import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createClient } from '@libsql/client';
import { Client as PgClient } from 'pg';
import { createConnection as createMysqlConnection } from 'mariadb';
import { db } from '../src/server/db';
import { seedCatalog, getCatalog } from '../src/server/catalog';
import { saveProduct, dashboard } from '../src/server/admin-service';
import { changeStatus, createOrder, trackedOrder, trackedOrderByNumber } from '../src/server/order-service';
import { hashPassword, verifyPassword, HttpError, rateLimit, digest } from '../src/server/auth';
import { nextStatuses, todayInRecife, dayBounds } from '../src/lib/order-status';
import { createMenu } from '../src/lib/menu';
import { checkOrigin } from '../src/server/http';
import { mysqlConnection, postgresConnection } from '../src/server/connection';
import { salesHighlights } from '../src/server/storefront-insights';
import { getStorefrontContent, saveStorefrontContent } from '../src/server/storefront-content';
import { defaultStorefrontContent } from '../src/lib/storefront-content';
import { recordLog, setLogActor } from '../src/server/system-logs';
import { listLogs } from '../src/server/logs-query';
import { api } from '../src/server/http';
import { registerCustomer, authenticateCustomer, createCustomerSession, customerFromToken, revokeCustomerSession } from '../src/server/customer-auth';
import { customerOrders, customerOrder } from '../src/server/order-service';
import { accountDestination } from '../src/lib/account';

const folder = mkdtempSync(path.join(tmpdir(), 'passira-tests-'));
const postgresUrl = process.env.TEST_POSTGRES_URL;
const mysqlUrl = process.env.TEST_MYSQL_URL;
if (postgresUrl && mysqlUrl) throw new Error('Configure apenas um banco remoto de teste por execução.');
const testSchema = `passira_test_${randomUUID().replaceAll('-', '')}`;
let mysqlCreated = false;
if (postgresUrl) {
  const url = new URL(postgresUrl); url.searchParams.set('schema', testSchema); process.env.DATABASE_URL = url.toString();
} else if (mysqlUrl) {
  const url = new URL(mysqlUrl); url.pathname = `/${testSchema}`; process.env.DATABASE_URL = url.toString();
} else process.env.DATABASE_URL = `file:${path.join(folder, 'test.db').replaceAll('\\', '/')}`;
const serviceTime = new Date('2026-11-11T18:00:00-03:00');
const customer = { name: 'Cliente de teste', phone: '(81) 99999-9999', cpf: '529.982.247-25', cep: '', street: '', number: '', neighborhood: '', complement: '', note: '', payment: 'pix' as const };
let productId: string, priceId: string, accountId: string;

before(async () => {
  const migrations = postgresUrl ? 'prisma/migrations' : mysqlUrl ? 'prisma/mysql/migrations' : 'prisma/sqlite/migrations';
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
  } else if (mysqlUrl) {
    const client = await createMysqlConnection({ ...mysqlConnection(mysqlUrl), multipleStatements: true });
    try {
      assert.match(testSchema, /^passira_test_[a-f0-9]{32}$/);
      await client.query(`CREATE DATABASE \`${testSchema}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
      mysqlCreated = true;
      await client.query(`USE \`${testSchema}\``);
      for (const script of scripts) await client.query(script);
      await client.query('INSERT INTO Category (id, name, data) VALUES (?, ?, ?)', ['schema-probe', testSchema, '{}']);
      assert.equal((await db().category.findUnique({ where: { id: 'schema-probe' } }))?.name, testSchema, 'The MySQL client must use its isolated database.');
      await db().category.delete({ where: { id: 'schema-probe' } });
    } finally { await client.end(); }
  } else {
    const client = createClient({ url: process.env.DATABASE_URL! });
    for (const script of scripts) await client.executeMultiple(script);
    client.close();
  }
  await seedCatalog();
  accountId = (await registerCustomer({ name: customer.name, phone: customer.phone, email: 'cliente@teste.local', password: 'senha-cliente-123' })).id;
});
after(async () => {
  await db().$disconnect();
  if (postgresUrl) {
    assert.match(testSchema, /^passira_test_[a-f0-9]{32}$/);
    const client = new PgClient({ connectionString: postgresConnection(postgresUrl), connectionTimeoutMillis: 15000 });
    try { await client.connect(); await client.query(`DROP SCHEMA "${testSchema}" CASCADE`); } finally { await client.end(); }
  }
  if (mysqlUrl && mysqlCreated) {
    assert.match(testSchema, /^passira_test_[a-f0-9]{32}$/);
    const client = await createMysqlConnection(mysqlConnection(mysqlUrl));
    try { await client.query(`DROP DATABASE \`${testSchema}\``); } finally { await client.end(); }
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

test('storefront content persists separately from the menu and rejects unsafe images and invalid highlights', async () => {
  assert.deepEqual(await getStorefrontContent(), defaultStorefrontContent);
  const originalCatalog = await getCatalog();
  const content = structuredClone(defaultStorefrontContent);
  content.hero.title = 'Nossa pizza';
  content.hero.image = 'https://example.com/pizza.webp';
  content.story.body = 'Uma nova história escrita pela equipe.';
  content.selection.productIds.reverse();
  await saveStorefrontContent(content);
  assert.deepEqual(await getStorefrontContent(), content);
  assert.deepEqual(await getCatalog(), originalCatalog);
  for (const image of ['http://example.com/photo.jpg', 'javascript:alert(1)', 'data:image/svg+xml,test', '//example.com/photo.jpg', '/images/../private', 'https://user:password@example.com/photo.jpg']) {
    await assert.rejects(saveStorefrontContent({ ...content, hero: { ...content.hero, image } }), /HTTPS/);
  }
  await assert.rejects(saveStorefrontContent({ ...content, selection: { ...content.selection, productIds: ['missing-product'] } }), /produtos disponíveis/);
  await assert.rejects(saveStorefrontContent({ ...content, selection: { ...content.selection, productIds: [content.selection.productIds[0], content.selection.productIds[0]] } }), /produtos diferentes/);
  await assert.rejects(saveStorefrontContent({ ...content, hero: { ...content.hero, title: '   ' } }), /Preencha/);
  assert.deepEqual(await getStorefrontContent(), content, 'Rejected edits must preserve saved content.');
  await saveStorefrontContent({ ...content, selection: { ...content.selection, productIds: [] } });
  assert.deepEqual((await getStorefrontContent()).selection.productIds, []);
  await saveStorefrontContent(defaultStorefrontContent);
});

test('database imports the original menu once without overwriting later edits', async () => {
  assert.equal((await getCatalog()).products.length, 192);
  const result = await saveProduct(inputProduct()); productId = result.id;
  priceId = (await getCatalog()).prices.find(price => price.productId === productId)!.id;
  await seedCatalog(); assert.equal((await getCatalog()).products.length, 193);
  assert.equal(createMenu(await getCatalog()).minimumPrice(productId, 'pickup'), 5000);
});

test('customer registration normalizes email, protects passwords and rejects duplicates and invalid input', async () => {
  const credentials = { name: 'Cliente da Conta', phone: '(81) 99999-9999', email: '  CONTA@TESTE.LOCAL  ', password: 'senha-segura-123' };
  const user = await registerCustomer(credentials);
  assert.equal(user.email, 'conta@teste.local');
  assert.deepEqual(Object.keys(user).sort(), ['email', 'id', 'name', 'phone']);
  const saved = await db().customerAccount.findUniqueOrThrow({ where: { id: user.id } });
  assert.notEqual(saved.passwordHash, credentials.password);
  assert.ok(verifyPassword(credentials.password, saved.passwordHash));
  assert.deepEqual(await authenticateCustomer(credentials), user);
  await assert.rejects(registerCustomer({ ...credentials, email: 'conta@teste.local' }), (error: unknown) => error instanceof HttpError && error.status === 409);
  await assert.rejects(registerCustomer({ ...credentials, email: 'outra@teste.local', password: 'curta' }), /pelo menos 8/);
  await assert.rejects(registerCustomer({ ...credentials, email: 'outra@teste.local', phone: '123' }), /telefone brasileiro/);
  for (const email of ['conta@teste.local', 'inexistente@teste.local']) {
    await assert.rejects(authenticateCustomer({ email, password: 'incorreta' }), (error: unknown) => error instanceof HttpError && error.status === 401 && error.message === 'Email ou senha incorretos.');
  }
});

test('customer sessions store token digests, rotate, expire and are independent from admin sessions', async () => {
  const first = await createCustomerSession(accountId);
  assert.equal((await customerFromToken(first.token))?.id, accountId);
  assert.equal(await db().customerSession.count({ where: { id: first.token } }), 0);
  assert.ok(await db().customerSession.findUnique({ where: { id: digest(first.token) } }));
  const second = await createCustomerSession(accountId, first.token);
  assert.equal(await customerFromToken(first.token), null);
  assert.equal((await customerFromToken(second.token))?.id, accountId);
  const admin = await db().admin.create({ data: { email: 'session@teste.local', passwordHash: hashPassword('senha-admin-separada') } });
  const adminToken = 'b'.repeat(64);
  await db().session.create({ data: { id: digest(adminToken), adminId: admin.id, expiresAt: new Date(Date.now() + 60000) } });
  assert.equal(await customerFromToken(adminToken), null);
  await db().customerSession.update({ where: { id: digest(second.token) }, data: { expiresAt: new Date(Date.now() - 1000) } });
  assert.equal(await customerFromToken(second.token), null);
  const third = await createCustomerSession(accountId);
  await revokeCustomerSession(third.token);
  assert.equal(await customerFromToken(third.token), null);
  for (const token of [undefined, '', 'invalid', 'c'.repeat(64)]) assert.equal(await customerFromToken(token), null);
});

test('authentication returns only to known local customer pages', () => {
  for (const value of ['https://attacker.example', '//attacker.example', '/\\attacker.example', '/admin/', '/finalizar/?next=https://attacker.example', '/minha-conta/../admin/']) assert.equal(accountDestination(value), '/minha-conta/');
  for (const value of ['/finalizar/?etapa=conferencia', '/minha-conta/pedidos/1/']) assert.equal(accountDestination(value), value);
});
test('orders receive sequential numbers, server totals, and idempotent retry handling', async () => {
  await assert.rejects(createOrder(payload(), '', serviceTime), (error: unknown) => error instanceof HttpError && error.status === 401);
  const input = payload(2); const first = await createOrder(input, accountId, serviceTime);
  const retries = await Promise.all([createOrder(input, accountId, serviceTime), createOrder(input, accountId, serviceTime)]);
  assert.ok(retries.every(order => order.number === first.number));
  assert.equal(first.number, 1); assert.equal(first.totalCents, 10000); assert.equal(first.token?.length, 48);
  assert.equal(first.customer.cpf, '529.982.247-25');
  assert.equal((await db().order.findUniqueOrThrow({ where: { id: first.number } })).accountId, accountId);
  assert.equal((await trackedOrder(first.token!)).customer.name, customer.name);
  await assert.rejects(createOrder({ ...input, expectedTotalCents: 1 }, accountId, serviceTime), (error: unknown) => error instanceof HttpError && error.status === 409);
  await assert.rejects(createOrder({ ...payload(), expectedTotalCents: 1 }, accountId, serviceTime), /valores do cardápio mudaram/);
  assert.equal(await db().order.count(), 1);
  const logs = await db().systemLog.findMany({ where: { action: 'orders.created', entityId: String(first.number) } });
  assert.equal(logs.length, 1, 'Retries must not duplicate the recorded order event.');
  const recorded = JSON.stringify(logs);
  for (const privateValue of [customer.name, customer.phone, customer.cpf, first.customer.cpf, first.token]) assert.ok(!recorded.includes(privateValue!));
  await complete(first.number!);
});

test('customer order history and details cannot expose or replay another account order', async () => {
  const other = await registerCustomer({ name: 'Outro Cliente', phone: customer.phone, email: 'outro@teste.local', password: 'outra-senha-123' });
  assert.deepEqual(await customerOrders(other.id), { orders: [], nextCursor: null });
  assert.equal((await customerOrders(accountId)).orders[0].number, 1);
  assert.equal((await customerOrder(accountId, 1)).status, 'completed');
  await assert.rejects(customerOrder(other.id, 1), (error: unknown) => error instanceof HttpError && error.status === 404);
  const order = await db().order.findUniqueOrThrow({ where: { id: 1 } });
  await assert.rejects(createOrder({ ...payload(), requestKey: order.requestKey }, other.id, serviceTime), (error: unknown) => error instanceof HttpError && error.status === 409);
  await assert.rejects(customerOrders('', undefined), (error: unknown) => error instanceof HttpError && error.status === 401);
  await assert.rejects(customerOrders(accountId, NaN), (error: unknown) => error instanceof HttpError && error.status === 400);
  assert.deepEqual(await customerOrders(accountId, 1), { orders: [], nextCursor: null });
  assert.equal(await db().order.count(), 1);
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
  await assert.rejects(createOrder({ ...input, customer: { ...customer, cpf: '111.111.111-11' } }, accountId, serviceTime), /CPF válido/);
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
  const order = await createOrder(payload(), accountId, serviceTime);
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
  await assert.rejects(createOrder(payload(), accountId, serviceTime), /opção válida|Indisponível/);
});
test('unknown costs remain pending instead of reporting a fabricated profit', async () => {
  const input = inputProduct(); input.variants[0].unitCostCents = null as unknown as number;
  const result = await saveProduct(input); productId = result.id; priceId = (await getCatalog()).prices.find(price => price.productId === productId)!.id;
  const order = await createOrder(payload(), accountId, serviceTime); await complete(order.number!);
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
test('log transactions roll back with their operation and administrative events keep actor attribution', async () => {
  const actor = { id: 'audit-test-admin', email: 'equipe@passira.local' };
  const product = await saveProduct(inputProduct(), undefined, actor);
  const entry = await db().systemLog.findFirstOrThrow({ where: { action: 'products.created', entityId: product.id } });
  assert.equal(entry.actorEmail, actor.email);
  assert.equal(entry.actorId, actor.id);
  const marker = randomUUID();
  await assert.rejects(db().$transaction(async tx => {
    await tx.additionCost.create({ data: { id: marker, costCents: 10 } });
    await recordLog({ action: 'settings.delivery_updated', actor, entityId: marker }, tx);
    throw new Error('rollback-probe');
  }), /rollback-probe/);
  assert.equal(await db().additionCost.count({ where: { id: marker } }), 0);
  assert.equal(await db().systemLog.count({ where: { entityId: marker } }), 0);
});

test('logs paginate without duplicate rows and respect area and severity filters', async () => {
  const marker = randomUUID();
  await db().systemLog.createMany({ data: Array.from({ length: 65 }, (_, index) => ({ id: `log-${marker}-${String(index).padStart(2, '0')}`, createdAt: new Date('2026-11-20T12:00:00Z'), action: 'system.request_failed', summary: 'Falha em uma solicitação', category: 'system', level: 'error', entityId: marker, details: {} })) });
  const params = new URLSearchParams({ q: marker, from: '2026-11-20', to: '2026-11-20', category: 'system', level: 'error' });
  const first = await listLogs(params); assert.equal(first.entries.length, 50); assert.equal(first.total, 65); assert.ok(first.nextCursor);
  params.set('cursor', first.nextCursor!);
  const second = await listLogs(params); assert.equal(second.entries.length, 15); assert.equal(second.nextCursor, null);
  assert.equal(new Set([...first.entries, ...second.entries].map(row => row.id)).size, 65);
  params.delete('cursor'); params.set('category', 'products'); assert.equal((await listLogs(params)).total, 0);
});

test('API failures persist a safe diagnostic and return its request ID without leaking error messages', async () => {
  const secret = 'never-log-this-password-or-customer';
  const request = new Request(`http://localhost/api/orders/${secret}/?cpf=${secret}`);
  const actor = { id: 'failure-admin', email: 'operacao@passira.local' };
  const response = await api(async () => { setLogActor(actor); throw new Error(secret); }, request);
  assert.equal(response.status, 500);
  const body = await response.json();
  assert.equal(body.requestId, response.headers.get('X-Request-ID'));
  const row = await db().systemLog.findFirstOrThrow({ where: { requestId: body.requestId } });
  assert.equal(row.action, 'system.request_failed');
  assert.equal(row.actorEmail, actor.email);
  assert.ok(!JSON.stringify({ body, row }).includes(secret));
  assert.equal((row.details as { route: string }).route, '/api/orders/[id]/');
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

test('customer history paginates without duplicates and leaves legacy orders unclaimed', async () => {
  const pagedAccount = await registerCustomer({ name: 'Cliente Paginação', phone: customer.phone, email: 'paginacao@teste.local', password: 'senha-paginacao-123' });
  const original = await db().order.findUniqueOrThrow({ where: { id: 1 } });
  const snapshot = { requestHash: original.requestHash, customer: original.customer as never, fulfillment: original.fulfillment, subtotalCents: original.subtotalCents, deliveryCents: original.deliveryCents, totalCents: original.totalCents };
  await db().order.createMany({ data: Array.from({ length: 23 }, () => ({ ...snapshot, token: randomUUID().replaceAll('-', '') + randomUUID().replaceAll('-', '').slice(0, 16), requestKey: randomUUID(), accountId: pagedAccount.id })) });
  const legacy = await db().order.create({ data: { ...snapshot, requestKey: randomUUID(), token: 'd'.repeat(48), accountId: null } });
  const first = await customerOrders(pagedAccount.id);
  assert.equal(first.orders.length, 20); assert.ok(first.nextCursor);
  const second = await customerOrders(pagedAccount.id, first.nextCursor!);
  assert.equal(second.orders.length, 3); assert.equal(second.nextCursor, null);
  assert.equal(new Set([...first.orders, ...second.orders].map(order => order.number)).size, 23);
  await assert.rejects(customerOrder(pagedAccount.id, legacy.id), (error: unknown) => error instanceof HttpError && error.status === 404);
  assert.equal((await trackedOrder(legacy.token)).number, legacy.id);
});
