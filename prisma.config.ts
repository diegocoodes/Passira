import 'dotenv/config';
import { defineConfig } from 'prisma/config';
import path from 'node:path';

const url = process.env.DATABASE_URL || 'file:./prisma/dev.db';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  datasource: { url: url.startsWith('file:') ? `file:${path.resolve(url.slice(5))}` : url },
});
