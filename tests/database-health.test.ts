import test from 'node:test';
import assert from 'node:assert/strict';
import { databaseConfigurationIssue, databaseIssue } from '../src/server/database-health';

test('hosted database configuration requires a complete PostgreSQL URL', () => {
  assert.equal(databaseConfigurationIssue(undefined, true), 'DATABASE_URL_MISSING');
  assert.equal(databaseConfigurationIssue('   ', true), 'DATABASE_URL_MISSING');
  assert.equal(databaseConfigurationIssue('DATABASE_URL=postgres://example', true), 'DATABASE_URL_INVALID');
  assert.equal(databaseConfigurationIssue('"postgres://user:private@host/database"', true), 'DATABASE_URL_INVALID');
  assert.equal(databaseConfigurationIssue('file:./prisma/dev.db', true), 'DATABASE_URL_INVALID');
  assert.equal(databaseConfigurationIssue(' postgres://user:private@host/database?sslmode=require\n', true), null);
  assert.equal(databaseConfigurationIssue(undefined, false), null);
  assert.equal(databaseConfigurationIssue('file:./prisma/dev.db', false), null);
});

test('database diagnostics classify Prisma and driver errors without returning their private messages', () => {
  const secret = 'private-database-password';
  const error = { code: 'P2010', meta: { driverAdapterError: { cause: { originalCode: '28P01', message: `password authentication failed: ${secret}` } } } };
  const result = databaseIssue(error);
  assert.equal(result, 'DATABASE_AUTHENTICATION_FAILED');
  assert.ok(!result.includes(secret));
  assert.equal(databaseIssue({ code: 'P2021' }), 'DATABASE_SCHEMA_MISSING');
  assert.equal(databaseIssue({ cause: { code: 'ECONNREFUSED' } }), 'DATABASE_CONNECTION_FAILED');
  assert.equal(databaseIssue(new Error('unable to verify the first certificate')), 'DATABASE_TLS_FAILED');
  assert.equal(databaseIssue(new Error(secret)), 'DATABASE_UNAVAILABLE');
});
