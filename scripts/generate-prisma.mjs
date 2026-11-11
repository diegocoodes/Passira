import 'dotenv/config';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const canonical = readFileSync('prisma/schema.prisma', 'utf8');
const sqlite = '// Generated from prisma/schema.prisma by scripts/generate-prisma.mjs.\n' + canonical.replace('provider = "postgresql"', 'provider = "sqlite"').replace('"../src/generated/prisma"', '"../../src/generated/sqlite"');
mkdirSync('prisma/sqlite', { recursive: true });
writeFileSync('prisma/sqlite/schema.prisma', sqlite);
if (!process.argv.includes('--schema-only')) {
  for (const schema of ['prisma/schema.prisma', 'prisma/sqlite/schema.prisma']) {
    const result = spawnSync(process.execPath, ['node_modules/prisma/build/index.js', 'generate', '--schema', schema], { stdio: 'inherit' });
    if (result.status !== 0) { process.exitCode = result.status || 1; break; }
  }
}
