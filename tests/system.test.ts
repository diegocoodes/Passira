import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createClient } from '@libsql/client';
import { Client as PgClient } from 'pg';
import { db } from '../src/server/db';
import { seedCatalog, getCatalog } from '../src/server/catalog';
import { saveProduct, dashboard } from '../src/server/admin-service';
import { changeStatus, createOrder, trackedOrder, trackedOrderByNumber } from '../src/server/order-service';
import { hashPassword, verifyPassword, HttpError, rateLimit, digest } from '../src/server/auth';
import { nextStatuses, todayInRecife, dayBounds } from '../src/lib/order-status';
import { createMenu } from '../src/lib/menu';
import { checkOrigin } from '../src/server/http';
import { postgresConnection } from '../src/server/connection';
import { salesHighlights } from '../src/server/storefront-insights';

const folder = mkdtempSync(path.join(tmpdir(), 'passira-tests-'));
const postgresUrl = process.env.TEST_POSTGRES_URL;
const testSchema = `passira_test_${randomUUID().replaceAll('-', '')}`;
if (postgresUrl) {
  const url = new URL(postgresUrl); url.searchParams.set('schema', testSchema); process.env.DATABASE_URL = url.toString();
} else process.env.DATABASE_URL = `file:${path.join(folder, 'test.db').replaceAll('\\', '/')}`;
const serviceTime = new Date('2026-11-11T18:00:00-03:00');
const customer = { name: 'Cliente de teste', phone: '(81) 99999-9999', cpf: '529.982.247-25', cep: '', street: '', number: '', neighborhood: '', complement: '', note: '', payment: 'pix' as const };
let productId: string, priceId: string;

before(async () => {
  const migrations = postgresUrl ? 'prisma/migrations' : 'prisma/sqlite/migrations';
  const scripts = readdirSync(migrations).filter(name => /^\d+_/.test(name)).sort().map(name => readFileSync(`${migrations}/${name}/migration.sql`, 'utf8'));
  if (postgresUrl) {
    const client = new PgClient({ connectionString: postgresConnection(postgresUrl), connectionTimeoutMillis: 15000 });
    try {
      await client.connect(); await client.query(`CREATE SCHEMA "${testSchema}"`); await client.query(`SET search_path TO "${testSchema}"`);
      for (const script of scripts) await client.query(script);
      await client.query('INSERT INTO "Category" (id, name, data) VALUES ($1, $2, $3)', ['schema-probe', testSchema, '{}']);
      assert.equal((await db().category.findUnique({ where: { id: 'schema-probe' } }))?.name, testSchema, 'The test client must use its isolated schema.');
      await db().category.delete({ where: { id: 'schema-probe' } });
    } finally { await client.end(); }
  } else {
    const client = createClient({ url: process.env.DATABASE_URL! });
    for (const script of scripts) await client.executeMultiple(script);
    client.close();
  }
  await seedCatalog();
});
after(async () => {
  await db().$disconnect();
  if (postgresUrl) {
    assert.match(testSchema, /^passira_test_[a-f0-9]{32}$/);
    const client = new PgClient({ connectionString: postgresConnection(postgresUrl), connectionTimeoutMillis: 15000 });
    try { await client.connect(); await client.query(`DROP SCHEMA "${testSchema}" CASCADE`); } finally { await client.end(); }
  }
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
  assert.equal(first.customer.cpf, '529.982.247-25');
  assert.equal((await trackedOrder(first.token!)).customer.name, customer.name);
  await assert.rejects(createOrder({ ...input, expectedTotalCents: 1 }, serviceTime), (error: unknown) => error instanceof HttpError && error.status === 409);
  await assert.rejects(createOrder({ ...payload(), expectedTotalCents: 1 }, serviceTime), /valores do cardápio mudaram/);
  assert.equal(await db().order.count(), 1);
  await complete(first.number!);
});
test('tracking by number returns status without customer information or the private tracking token', async () => {
  const order = await trackedOrderByNumber(1);
  assert.equal(order.id, '#1'); assert.equal(order.status, 'completed');
  assert.deepEqual(Object.keys(order).sort(), ['createdAt', 'events', 'fulfillment', 'id', 'number', 'status']);
  assert.ok(!JSON.stringify(order).includes(customer.cpf));
  await assert.rejects(trackedOrderByNumber(999999), (error: unknown) => error instanceof HttpError && error.status === 404);
  await assert.rejects(trackedOrderByNumber(0), (error: unknown) => error instanceof HttpError && error.status === 400);
});
test('invalid CPF prevents new orders from being created', async () => {
  const input = payload(); const previous = await db().order.count();
  await assert.rejects(createOrder({ ...input, customer: { ...customer, cpf: '111.111.111-11' } }, serviceTime), /CPF válido/);
  assert.equal(await db().order.count(), previous);
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

test('public highlights use recent completed sales and omit inactive products and customer data', async () => {
  const completed = await db().order.findFirstOrThrow({ where: { status: 'completed', items: { some: { productId } } } });
  const product = await db().product.findUniqueOrThrow({ where: { id: productId } });
  const now = new Date();
  assert.deepEqual((await salesHighlights(now)).productIds, [productId]);
  try {
    await db().order.update({ where: { id: completed.id }, data: { status: 'cancelled' } });
    assert.equal((await salesHighlights(now)).productIds.length, 0);
    await db().order.update({ where: { id: completed.id }, data: { status: 'completed', completedAt: new Date(now.getTime() - 31 * 86400000) } });
    assert.equal((await salesHighlights(now)).productIds.length, 0);
    await db().order.update({ where: { id: completed.id }, data: { completedAt: completed.completedAt } });
    await db().product.update({ where: { id: productId }, data: { data: { ...(product.data as Record<string, unknown>), blocked: true } as never } });
    assert.equal((await salesHighlights(now)).productIds.length, 0);
  } finally {
    await db().order.update({ where: { id: completed.id }, data: { status: completed.status, completedAt: completed.completedAt } });
    await db().product.update({ where: { id: productId }, data: { data: product.data as never } });
  }
  assert.deepEqual(Object.keys(await salesHighlights(now)).sort(), ['periodDays', 'productIds']);
});
