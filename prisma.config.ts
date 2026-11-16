import 'dotenv/config';
import { defineConfig } from 'prisma/config';
import path from 'node:path';

const url = process.env.DATABASE_URL || 'file:./prisma/dev.db';
const local = url.startsWith('file:');
const mysql = url.startsWith('mysql:');

export default defineConfig({
  schema: local ? 'prisma/sqlite/schema.prisma' : mysql ? 'prisma/mysql/schema.prisma' : 'prisma/schema.prisma',
  migrations: { path: local ? 'prisma/sqlite/migrations' : mysql ? 'prisma/mysql/migrations' : 'prisma/migrations' },
  datasource: { url: url.startsWith('file:') ? `file:${path.resolve(url.slice(5))}` : url },
});
