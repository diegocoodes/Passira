import 'dotenv/config';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const canonical = readFileSync('prisma/schema.prisma', 'utf8');
for (const provider of ['sqlite', 'mysql']) {
  const schema = '// Generated from prisma/schema.prisma by scripts/generate-prisma.mjs.\n' + canonical.replace('provider = "postgresql"', `provider = "${provider}"`).replace('"../src/generated/prisma"', `"../../src/generated/${provider}"`);
  mkdirSync(`prisma/${provider}`, { recursive: true });
  writeFileSync(`prisma/${provider}/schema.prisma`, schema);
}
if (!process.argv.includes('--schema-only')) {
  for (const schema of ['prisma/schema.prisma', 'prisma/sqlite/schema.prisma', 'prisma/mysql/schema.prisma']) {
    const result = spawnSync(process.execPath, ['node_modules/prisma/build/index.js', 'generate', '--schema', schema], { stdio: 'inherit' });
    if (result.status !== 0) { process.exitCode = result.status || 1; break; }
  }
}
