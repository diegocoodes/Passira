import 'dotenv/config';
import { createClient } from '@libsql/client';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const url = process.env.DATABASE_URL || 'file:./prisma/dev.db';
if (process.env.VERCEL && url.startsWith('file:')) throw new Error('Configure um banco Turso persistente em DATABASE_URL.');
if (url.startsWith('file:')) mkdirSync(dirname(resolve(url.slice(5))), { recursive: true });
const client = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });
try {
  if (url.startsWith('file:')) {
    await client.execute('PRAGMA journal_mode=WAL');
    client.close();
    const result = spawnSync(process.execPath, ['node_modules/prisma/build/index.js', 'migrate', 'deploy'], { stdio: 'inherit' });
    if (result.status !== 0) process.exitCode = result.status || 1;
  } else {
    await client.execute('CREATE TABLE IF NOT EXISTS "_PassiraMigration" (name TEXT PRIMARY KEY, checksum TEXT NOT NULL)');
    for (const name of readdirSync('prisma/migrations').filter(name => /^\d+_/.test(name)).sort()) {
      const sql = readFileSync(`prisma/migrations/${name}/migration.sql`, 'utf8');
      const checksum = createHash('sha256').update(sql).digest('hex');
      const previous = await client.execute({ sql: 'SELECT checksum FROM "_PassiraMigration" WHERE name = ?', args: [name] });
      if (previous.rows.length) { if (previous.rows[0].checksum !== checksum) throw new Error(`Migration alterada: ${name}`); continue; }
      const statements = sql.split(';').map(statement => statement.trim()).filter(Boolean);
      await client.migrate([...statements, { sql: 'INSERT INTO "_PassiraMigration" (name, checksum) VALUES (?, ?)', args: [name, checksum] }]);
      console.log(`Migration aplicada: ${name}`);
    }
    console.log('Banco remoto atualizado.');
  }
} finally { client.close(); }
