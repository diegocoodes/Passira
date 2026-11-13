import { test, expect } from '@playwright/test';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

test('missing pages and removed products use the themed 404 and return to the menu', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const response = await page.goto('/pagina-que-nao-existe/');
  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', { name: 'Esta fatia sumiu.', exact: true })).toBeVisible();
  await expect(page.locator('meta[name="robots"]').first()).toHaveAttribute('content', /noindex/);
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    if (width === 390 || width === 1440) await page.screenshot({ path: `test-results/error-404-${width}.png`, fullPage: true });
  }
  await page.goto('/produto/produto-removido/');
  await expect(page.getByRole('heading', { name: 'Esta fatia sumiu.', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Voltar ao cardápio', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Nosso cardápio.', exact: true })).toBeVisible();
  await expect(page.locator('.storefront-opening[open]')).toHaveCount(0);
});

test('error views cover client, service and protocol failures without indexing or exposing technical details', async ({ page, request }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const code of [400, 401, 403, 408, 410, 413, 415, 422, 429, 500, 501, 502, 503, 504, 505, 599]) {
    const response = await page.goto(`/erro/${code}/`);
    expect(response?.status()).toBe(200); // These URLs display the error design, rather than causing a failure.
    await expect(page.locator('.error-status')).toContainText(`Erro ${code}`);
    await expect(page.locator('.error-page h1')).toBeVisible();
    await expect(page.locator('meta[name="robots"]').first()).toHaveAttribute('content', /noindex/);
    if (code === 401 || code === 403) await expect(page.getByRole('link', { name: 'Entrar no painel', exact: true })).toHaveAttribute('href', '/admin/entrar/');
    if (code === 505) {
      await expect(page.getByRole('heading', { name: 'Essa conexão pede outra receita.', exact: true })).toBeVisible();
      for (const width of [320, 390, 768, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        if (width === 390 || width === 1440) await page.screenshot({ path: `test-results/error-505-${width}.png`, fullPage: true });
      }
    }
  }
  await page.goto('/erro/500/');
  const reloaded = page.waitForResponse(response => response.request().isNavigationRequest() && response.url().endsWith('/erro/500/'));
  await page.getByRole('button', { name: 'Tentar novamente', exact: true }).click();
  await reloaded;
  await expect(page.getByRole('heading', { name: 'O forno pediu uma pausa.', exact: true })).toBeVisible();
  await page.goto('/erro/codigo-invalido/');
  await expect(page.locator('.error-status')).toContainText('Erro 404');
  const unauthorized = await request.get('/api/admin/catalog/');
  expect(unauthorized.status()).toBe(401);
  expect((await unauthorized.json()).error).toContain('Entre no painel');
});

test('a real root layout failure renders a standalone themed recovery screen', async ({ page }) => {
  test.setTimeout(60000);
  const reservation = createServer();
  await new Promise<void>(resolve => reservation.listen(0, '127.0.0.1', resolve));
  const port = (reservation.address() as { port: number }).port;
  await new Promise<void>((resolve, reject) => reservation.close(error => error ? reject(error) : resolve()));
  mkdirSync('test-results', { recursive: true });
  const databasePath = path.resolve('test-results', `uninitialized-${randomUUID()}.db`).replaceAll('\\', '/');
  const server = spawn(process.execPath, [path.resolve('node_modules/next/dist/bin/next'), 'start', '--hostname', '127.0.0.1', '--port', String(port)], {
    cwd: process.cwd(), windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, NODE_ENV: 'production', DATABASE_URL: `file:${databasePath}` },
  });
  server.stderr.on('data', () => {});
  try {
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('O servidor isolado não iniciou.')), 20000);
      server.stdout.on('data', chunk => { if (String(chunk).includes('Ready')) { clearTimeout(timer); resolve(); } });
      server.once('error', error => { clearTimeout(timer); reject(error); });
      server.once('exit', () => { clearTimeout(timer); reject(new Error('O servidor isolado encerrou.')); });
    });
    await page.addInitScript(() => localStorage.setItem('passira-cart-v1', JSON.stringify({ state: { items: [], method: 'pickup', orders: [], favoriteIds: ['saved-favorite'], customerDraft: { name: 'Rascunho preservado' } }, version: 1 })));
    const origin = `http://127.0.0.1:${port}`;
    await page.goto(origin);
    await expect(page.getByRole('heading', { name: 'O forno pediu uma pausa.', exact: true })).toBeVisible();
    await expect(page).toHaveTitle('Falha no sistema | Passira');
    await expect(page.locator('.error-page')).not.toContainText(/Prisma|DATABASE_URL|uninitialized-|P2021/);
    await expect(page.getByRole('link', { name: 'Voltar ao cardápio', exact: true })).toHaveCSS('background-color', 'rgb(0, 125, 64)');
    await expect(page.locator('.error-page')).toHaveCSS('font-family', /Source Sans 3/);
    expect(await page.locator('.error-header img').evaluate(image => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
    const stored = await page.evaluate(() => localStorage.getItem('passira-cart-v1'));
    let retries = 0;
    page.on('request', request => { const url = new URL(request.url()); if (url.origin === origin && url.pathname === '/') retries++; });
    await page.getByRole('button', { name: 'Tentar novamente', exact: true }).click();
    await expect.poll(() => retries).toBeGreaterThan(0);
    await expect(page.getByRole('heading', { name: 'O forno pediu uma pausa.', exact: true })).toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem('passira-cart-v1'))).toBe(stored);
    await page.setViewportSize({ width: 390, height: 844 });
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: 'test-results/error-global-500.png', fullPage: true });
  } finally {
    if (server.exitCode === null) await new Promise<void>(resolve => { server.once('exit', () => resolve()); server.kill(); });
  }
});
