import 'dotenv/config';
import { createClient } from '@libsql/client';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const url = process.env.DATABASE_URL || 'file:./prisma/dev.db';
if (process.env.VERCEL && url.startsWith('file:')) throw new Error('Configure DATABASE_URL com um banco PostgreSQL persistente.');
if (!url.startsWith('file:') && !/^postgres(ql)?:/.test(url)) throw new Error('DATABASE_URL deve usar PostgreSQL ou SQLite local.');
if (url.startsWith('file:')) {
  mkdirSync(dirname(resolve(url.slice(5))), { recursive: true });
  const client = createClient({ url });
  try { await client.execute('PRAGMA journal_mode=WAL'); } finally { client.close(); }
}
const generated = spawnSync(process.execPath, ['scripts/generate-prisma.mjs', '--schema-only'], { encoding: 'utf8' });
if (generated.status !== 0) throw new Error('Não foi possível preparar o schema.');
const result = spawnSync(process.execPath, ['node_modules/prisma/build/index.js', 'migrate', 'deploy'], { encoding: 'utf8' });
function redact(text) {
  let output = text.replaceAll(url, '[DATABASE_URL]');
  if (!url.startsWith('file:')) {
    const parsed = new URL(url);
    for (const secret of [parsed.password, decodeURIComponent(parsed.password), parsed.username]) if (secret) output = output.replaceAll(secret, '[REDACTED]');
  }
  return output;
}
if (result.stdout) process.stdout.write(redact(result.stdout));
if (result.stderr) process.stderr.write(redact(result.stderr));
if (result.status !== 0) process.exitCode = result.status || 1;
