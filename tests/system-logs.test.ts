import test from 'node:test';
import assert from 'node:assert/strict';
import { logRoute, safeLogDetails, logRequestId, withLogContext } from '../src/server/system-logs';
import { logFilters, logsCsv } from '../src/server/logs-query';

test('logging removes request payloads, credentials, tracking tokens, query strings and unknown detail fields', () => {
  const privateValue = 'never-write-this-value';
  const details = safeLogDetails({ code: 'HTTP_403', statusCode: 403, password: privateValue, token: privateValue, cpf: privateValue, customer: { name: privateValue }, body: privateValue, route: `/api/orders/${privateValue}/?password=${privateValue}` });
  assert.deepEqual(details, { code: 'HTTP_403', statusCode: 403 });
  assert.equal(logRoute(`/api/orders/${privateValue}/?key=${privateValue}`), '/api/orders/[id]/');
  assert.equal(logRoute(`/pedido/${privateValue}/`), '/pedido/[id]/');
  assert.equal(logRoute(`/api/cep/12345678/?cpf=${privateValue}`), '/api/cep/[id]/');
  assert.equal(logRoute(`/api/admin/products/${privateValue}/`), '/api/admin/products/[id]/');
  assert.ok(!JSON.stringify(details).includes(privateValue));
});

test('request identifiers stay isolated across concurrent asynchronous operations', async () => {
  const ids = await Promise.all([1, 2].map(() => withLogContext(undefined, async () => { const before = logRequestId(); await Promise.resolve(); assert.equal(logRequestId(), before); return before; })));
  assert.ok(ids[0]); assert.notEqual(ids[0], ids[1]); assert.equal(logRequestId(), undefined);
});

test('log filters enforce Recife day boundaries and reject invalid dates and filter values', () => {
  const result = logFilters(new URLSearchParams({ from: '2026-11-16', to: '2026-11-16', level: 'error', category: 'system' }));
  assert.deepEqual(result.where.createdAt, { gte: new Date('2026-11-16T03:00:00Z'), lt: new Date('2026-11-17T03:00:00Z') });
  assert.throws(() => logFilters(new URLSearchParams({ from: '2026-02-30' })));
  assert.throws(() => logFilters(new URLSearchParams({ from: '2026-11-17', to: '2026-11-16' })));
  assert.throws(() => logFilters(new URLSearchParams({ category: 'private-table' })));
});

test('CSV keeps accents and quoted cells while preventing spreadsheet formulas', () => {
  const csv = logsCsv([{ createdAt: new Date('2026-11-16T14:00:00Z'), level: 'info', category: 'products', summary: 'Produto "Especial"', actorEmail: '=DANGEROUS()', entityId: 'safe-id', requestId: null, details: { code: 'TEST' } }]);
  assert.ok(csv.startsWith('\uFEFF'));
  assert.ok(csv.includes('"\'=DANGEROUS()"'));
  assert.ok(csv.includes('Produto ""Especial""'));
  assert.ok(csv.includes('16/11/2026, 11:00:00'));
});
