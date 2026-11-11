import { defineConfig } from '@playwright/test';
import { randomUUID } from 'node:crypto';

export default defineConfig({
  testDir: './tests/browser',
  fullyParallel: false,
  workers: 1,
  timeout: 90000,
  use: { baseURL: 'http://127.0.0.1:3100', headless: true, actionTimeout: 15000, trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  webServer: {
    command: 'npm run db:migrate && npm run db:setup && npm run start -- --port 3100',
    url: 'http://127.0.0.1:3100/admin/entrar/',
    reuseExistingServer: false,
    timeout: 120000,
    env: { NODE_ENV: 'production', DATABASE_URL: `file:./test-results/browser-${randomUUID()}.db`, ADMIN_EMAIL: 'teste@passira.local', ADMIN_PASSWORD: 'senha-apenas-para-testes-123456' },
  },
});
