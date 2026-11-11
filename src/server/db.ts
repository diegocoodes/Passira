import 'dotenv/config';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import { PrismaClient } from '@/generated/prisma/client';

const globalDb = globalThis as unknown as { passiraDb?: PrismaClient };
export function db() {
  const url = process.env.DATABASE_URL || 'file:./prisma/dev.db';
  if (process.env.VERCEL && url.startsWith('file:')) throw new Error('Configure DATABASE_URL com um banco Turso persistente antes de publicar.');
  if (!globalDb.passiraDb) globalDb.passiraDb = new PrismaClient({ adapter: new PrismaLibSql({ url, authToken: process.env.TURSO_AUTH_TOKEN }) });
  return globalDb.passiraDb;
}
