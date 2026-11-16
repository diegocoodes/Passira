import test from 'node:test';
import assert from 'node:assert/strict';
import { databaseConfigurationIssue, databaseIssue } from '../src/server/database-health';
import { mysqlConnection } from '../src/server/connection';

test('hosted database configuration requires a complete MySQL or PostgreSQL URL', () => {
  assert.equal(databaseConfigurationIssue(undefined, true), 'DATABASE_URL_MISSING');
  assert.equal(databaseConfigurationIssue('   ', true), 'DATABASE_URL_MISSING');
  assert.equal(databaseConfigurationIssue('DATABASE_URL=postgres://example', true), 'DATABASE_URL_INVALID');
  assert.equal(databaseConfigurationIssue('"postgres://user:private@host/database"', true), 'DATABASE_URL_INVALID');
  assert.equal(databaseConfigurationIssue('file:./prisma/dev.db', true), 'DATABASE_URL_INVALID');
  assert.equal(databaseConfigurationIssue(' postgres://user:private@host/database?sslmode=require\n', true), null);
  assert.equal(databaseConfigurationIssue(undefined, false), null);
  assert.equal(databaseConfigurationIssue('file:./prisma/dev.db', false), null);
  assert.equal(databaseConfigurationIssue('mysql://user:private@127.0.0.1:3306/database', true), null);
  assert.equal(databaseConfigurationIssue('mysql://user:private@127.0.0.1:3306', true), 'DATABASE_URL_INVALID');
  assert.equal(databaseConfigurationIssue('mysql://user@127.0.0.1/database', true), 'DATABASE_URL_INVALID');
});

test('MySQL connections decode credentials and use verified TLS when requested', () => {
  const options = mysqlConnection('mysql://user%40account:private%40%3A%2F%23@127.0.0.1:3307/passira');
  assert.equal(options.user, 'user@account');
  assert.equal(options.password, 'private@:/#');
  assert.equal(options.host, '127.0.0.1');
  assert.equal(options.port, 3307);
  assert.equal(options.database, 'passira');
  assert.equal(options.timezone, '+00:00');
  assert.ok(!('ssl' in options));
  assert.deepEqual(mysqlConnection('mysql://user:private@host/passira?sslaccept=strict').ssl, { rejectUnauthorized: true });
  assert.throws(() => mysqlConnection('postgres://user:private@host/passira'));
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
  assert.equal(databaseIssue({ cause: { code: 1045, message: secret } }), 'DATABASE_AUTHENTICATION_FAILED');
  assert.equal(databaseIssue({ cause: { originalCode: '1146', message: secret } }), 'DATABASE_SCHEMA_MISSING');
  assert.equal(databaseIssue({ errno: 1049 }), 'DATABASE_SCHEMA_MISSING');
});
