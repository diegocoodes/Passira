import 'dotenv/config';
import { defineConfig } from 'prisma/config';
import path from 'node:path';

const url = process.env.DATABASE_URL || 'file:./prisma/dev.db';
const local = url.startsWith('file:');

export default defineConfig({
  schema: local ? 'prisma/sqlite/schema.prisma' : 'prisma/schema.prisma',
  migrations: { path: local ? 'prisma/sqlite/migrations' : 'prisma/migrations' },
  datasource: { url: url.startsWith('file:') ? `file:${path.resolve(url.slice(5))}` : url },
});
