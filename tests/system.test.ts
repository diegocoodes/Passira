import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createClient } from '@libsql/client';
import { db } from '../src/server/db';
import { seedCatalog, getCatalog } from '../src/server/catalog';
import { saveProduct, dashboard } from '../src/server/admin-service';
import { changeStatus, createOrder, trackedOrder } from '../src/server/order-service';
import { hashPassword, verifyPassword, HttpError, rateLimit, digest } from '../src/server/auth';
import { nextStatuses, todayInRecife, dayBounds } from '../src/lib/order-status';
import { createMenu } from '../src/lib/menu';
import { checkOrigin } from '../src/server/http';

const folder = mkdtempSync(path.join(tmpdir(), 'passira-tests-'));
process.env.DATABASE_URL = `file:${path.join(folder, 'test.db').replaceAll('\\', '/')}`;
const serviceTime = new Date('2026-11-11T18:00:00-03:00');
const customer = { name: 'Cliente de teste', phone: '(81) 99999-9999', cep: '', street: '', number: '', neighborhood: '', complement: '', note: '', payment: 'pix' as const };
let productId: string, priceId: string;

before(async () => {
  const client = createClient({ url: process.env.DATABASE_URL! });
  for (const name of readdirSync('prisma/migrations').filter(name => /^\d+_/.test(name)).sort()) await client.executeMultiple(readFileSync(`prisma/migrations/${name}/migration.sql`, 'utf8'));
  client.close(); await seedCatalog();
});
after(async () => {
  await db().$disconnect();
  // On Windows, the native SQLite driver can retain handles until process exit.
  if (process.platform !== 'win32') {
    assert.ok(path.resolve(folder).startsWith(path.resolve(tmpdir()) + path.sep + 'passira-tests-'));
    rmSync(folder, { recursive: true, force: true });
  }
});
const inputProduct = () => ({ name: 'Prato do teste', description: 'Uma porção para testar o sistema.', categoryId: '274522', kind: 'food', photoUrl: '', enabled: true, blocked: false, optionGroupIds: [], variants: [{ sizeId: null, name: 'Individual', cents: 5000, pickupCents: 5000, deliveryCents: 5500, unitCostCents: 2000, enabled: true, pickupEnabled: true, deliveryEnabled: true }] });
const payload = (quantity = 1) => ({ requestKey: randomUUID(), fulfillment: 'pickup', customer, expectedTotalCents: 5000 * quantity, items: [{ id: randomUUID(), productId, priceId, flavorIds: [], selections: [], note: '', quantity }] });
async function complete(id: number) { for (const [expected, status] of [['received', 'accepted'], ['accepted', 'preparing'], ['preparing', 'ready'], ['ready', 'completed']] as const) await changeStatus(id, expected, status); }

test('database imports the original menu once without overwriting later edits', async () => {
  assert.equal((await getCatalog()).products.length, 192);
  const result = await saveProduct(inputProduct()); productId = result.id;
  priceId = (await getCatalog()).prices.find(price => price.productId === productId)!.id;
  await seedCatalog(); assert.equal((await getCatalog()).products.length, 193);
  assert.equal(createMenu(await getCatalog()).minimumPrice(productId, 'pickup'), 5000);
});
test('orders receive sequential numbers, server totals, and idempotent retry handling', async () => {
  const input = payload(2); const first = await createOrder(input, serviceTime);
  const retries = await Promise.all([createOrder(input, serviceTime), createOrder(input, serviceTime)]);
  assert.ok(retries.every(order => order.number === first.number));
  assert.equal(first.number, 1); assert.equal(first.totalCents, 10000); assert.equal(first.token?.length, 48);
  assert.equal((await trackedOrder(first.token!)).customer.name, customer.name);
  await assert.rejects(createOrder({ ...input, expectedTotalCents: 1 }, serviceTime), (error: unknown) => error instanceof HttpError && error.status === 409);
  await assert.rejects(createOrder({ ...payload(), expectedTotalCents: 1 }, serviceTime), /valores do cardápio mudaram/);
  assert.equal(await db().order.count(), 1);
  await complete(first.number!);
});
test('dashboard counts completed sales, ranks products, subtracts costs and daily expenses', async () => {
  const day = todayInRecife(); await db().expense.create({ data: { day, title: 'Despesa do teste', cents: 1000 } });
  const result = await dashboard(day);
  assert.equal(result.completed, 1); assert.equal(result.revenue, 10000); assert.equal(result.costs, 4000); assert.equal(result.profit, 5000);
  assert.equal(result.topProducts[0].id, productId); assert.equal(result.topProducts[0].quantity, 2);
  assert.equal(result.activeOrders.length, 0);
});
test('invalid transitions and stale administrator actions cannot change an order', async () => {
  const order = await createOrder(payload(), serviceTime);
  assert.equal(order.number, 2);
  await assert.rejects(changeStatus(order.number!, 'received', 'completed'), /não é permitida/);
  await changeStatus(order.number!, 'received', 'accepted');
  await assert.rejects(changeStatus(order.number!, 'received', 'preparing'), /pedido mudou/);
  await changeStatus(order.number!, 'accepted', 'cancelled');
  assert.equal((await dashboard(todayInRecife())).completed, 1);
  assert.deepEqual(nextStatuses('ready', 'delivery'), ['out_for_delivery', 'cancelled']);
});
test('product deletion hides it from the live menu and preserves historical order snapshots', async () => {
  await db().product.update({ where: { id: productId }, data: { deletedAt: new Date() } });
  assert.ok(!(await getCatalog()).products.some(product => product.id === productId));
  const first = await db().order.findUniqueOrThrow({ where: { id: 1 } });
  assert.equal((await trackedOrder(first.token)).items[0].title, 'Prato do teste');
  await assert.rejects(createOrder(payload(), serviceTime), /opção válida|Indisponível/);
});
test('unknown costs remain pending instead of reporting a fabricated profit', async () => {
  const input = inputProduct(); input.variants[0].unitCostCents = null as unknown as number;
  const result = await saveProduct(input); productId = result.id; priceId = (await getCatalog()).prices.find(price => price.productId === productId)!.id;
  const order = await createOrder(payload(), serviceTime); await complete(order.number!);
  const report = await dashboard(todayInRecife()); assert.equal(report.profit, null); assert.equal(report.missingCosts, 1);
});
test('passwords use salted hashes and tracking cannot be fetched with a sequential number', async () => {
  const password = 'uma-senha-bem-longa-123'; const hash = hashPassword(password);
  assert.ok(verifyPassword(password, hash)); assert.ok(!verifyPassword('incorreta', hash)); assert.notEqual(hashPassword(password), hash);
  await assert.rejects(trackedOrder('1'), (error: unknown) => error instanceof HttpError && error.status === 404);
  assert.equal(dayBounds('2026-11-11').start.toISOString(), '2026-11-11T03:00:00.000Z');
});
test('login attempt limits are stored in the database and reset after expiration', async () => {
  const key = `test-limit-${randomUUID()}`;
  await rateLimit(key, 2, 900); await rateLimit(key, 2, 900);
  await assert.rejects(rateLimit(key, 2, 900), (error: unknown) => error instanceof HttpError && error.status === 429);
  await db().rateLimit.update({ where: { id: digest(key) }, data: { expiresAt: new Date(Date.now() - 1000) } });
  await rateLimit(key, 2, 900);
});
test('same-origin requests work behind a proxy and foreign origins are rejected', () => {
  assert.doesNotThrow(() => checkOrigin(new Request('http://localhost:3100/api/admin/login/', { headers: { host: '127.0.0.1:3100', origin: 'http://127.0.0.1:3100' } })));
  assert.throws(() => checkOrigin(new Request('http://localhost:3100/api/admin/login/', { headers: { host: '127.0.0.1:3100', origin: 'https://attacker.example' } })), /Origem/);
});
