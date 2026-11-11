import 'dotenv/config';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@/generated/prisma/client';
import { PrismaClient as SqliteClient } from '@/generated/sqlite/client';
import { postgresConnection } from './connection';

const globalDb = globalThis as unknown as { passiraDb?: PrismaClient };
export function db() {
  const url = process.env.DATABASE_URL?.trim() || 'file:./prisma/dev.db';
  if (process.env.VERCEL && url.startsWith('file:')) throw new Error('Configure DATABASE_URL com um banco PostgreSQL persistente antes de publicar.');
  if (!globalDb.passiraDb) {
    if (/^postgres(ql)?:/.test(url)) {
      const schema = new URL(url).searchParams.get('schema') || 'public';
      globalDb.passiraDb = new PrismaClient({ adapter: new PrismaPg({ connectionString: postgresConnection(url), max: 5, connectionTimeoutMillis: 15000 }, { schema }) });
    } else if (url.startsWith('file:')) {
      // Both clients come from the same models; only the connector differs.
      globalDb.passiraDb = new SqliteClient({ adapter: new PrismaLibSql({ url }) }) as unknown as PrismaClient;
    } else throw new Error('DATABASE_URL deve usar PostgreSQL ou um arquivo SQLite local.');
  }
  return globalDb.passiraDb;
}
