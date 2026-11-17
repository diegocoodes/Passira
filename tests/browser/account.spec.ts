import { test, expect } from '@playwright/test';
const origin = 'http://127.0.0.1:3100';

test('guest order submission and private account endpoints require a customer session', async ({ page, request }) => {
  for (const endpoint of ['/api/account/orders/', '/api/account/orders/1/']) expect((await request.get(endpoint)).status()).toBe(401);
  expect((await request.post('/api/orders/', { headers: { origin }, data: { accountId: 'forged' } })).status()).toBe(401);
  expect((await request.patch('/api/account/profile/', { headers: { origin }, data: {} })).status()).toBe(401);
  await page.goto('/finalizar/?etapa=dados');
  await expect(page).toHaveURL(/\/entrar\/\?next=%2Ffinalizar%2F%3Fetapa%3Ddados/);
  await page.goto('/minha-conta/');
  await expect(page).toHaveURL(/\/entrar\//);
  await page.goto('/minha-conta/pedidos/1/');
  await expect(page).toHaveURL(/\/entrar\//);
});

test('customers register, sign out, sign in on another browser and cannot access the admin panel', async ({ page, browser }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Entrar', exact: true }).click();
  await page.getByRole('link', { name: 'Criar uma conta', exact: true }).click();
  await page.getByLabel('Nome completo').fill('Marina Passira');
  await page.getByLabel('CPF', { exact: true }).fill('52998224725');
  await page.getByLabel('Telefone com DDD').fill('81988887777');
  await page.getByLabel('Email', { exact: true }).fill('MARINA@passira.local');
  await page.getByLabel('Senha', { exact: true }).fill('senha-cliente-marina-123');
  await page.getByLabel('Confirmar senha').fill('diferente-123');
  await page.getByRole('button', { name: 'Criar minha conta', exact: true }).click();
  await expect(page.locator('#account-form').getByRole('alert')).toHaveText('As senhas precisam ser iguais.');
  await page.getByLabel('Confirmar senha').fill('senha-cliente-marina-123');
  await page.getByRole('button', { name: 'Mostrar senha' }).click();
  await expect(page.getByLabel('Senha', { exact: true })).toHaveAttribute('type', 'text');
  await page.getByRole('button', { name: 'Criar minha conta', exact: true }).click();
  await expect(page).toHaveURL(/\/minha-conta\/$/);
  await expect(page.getByRole('heading', { name: 'Olá, Marina.' })).toBeVisible();
  await expect(page.getByText('Seu primeiro pedido começa no cardápio')).toBeVisible();
  const session = await (await page.request.get('/api/account/session/')).json();
  expect(Object.keys(session.user).sort()).toEqual(['cpf', 'email', 'id', 'name', 'phone']);
  expect(session.user.cpf).toBe('529.982.247-25');
  const cookie = (await page.context().cookies()).find(cookie => cookie.name === 'passira-customer');
  expect(cookie?.httpOnly).toBe(true);
  expect(cookie?.sameSite).toBe('Lax');
  expect((await page.request.get('/api/admin/dashboard/')).status()).toBe(401);
  expect((await page.request.post('/api/account/logout/', { headers: { origin: 'https://invalid.example' } })).status()).toBe(403);
  const another = await browser.newContext({ baseURL: origin });
  const otherDevice = await another.newPage();
  await otherDevice.goto('/entrar/?next=https://attacker.example');
  await otherDevice.getByLabel('Email', { exact: true }).fill('marina@passira.local');
  await otherDevice.getByLabel('Senha', { exact: true }).fill('senha-incorreta');
  await otherDevice.getByRole('button', { name: 'Entrar na minha conta', exact: true }).click();
  await expect(otherDevice.locator('#account-form').getByRole('alert')).toHaveText('Email ou senha incorretos.');
  await otherDevice.getByLabel('Senha', { exact: true }).fill('senha-cliente-marina-123');
  await otherDevice.getByRole('button', { name: 'Entrar na minha conta', exact: true }).click();
  await expect(otherDevice).toHaveURL(/\/minha-conta\/$/);
  await expect(otherDevice.getByRole('heading', { name: 'Olá, Marina.' })).toBeVisible();
  for (const width of [320, 390, 768, 1024, 1440]) {
    await otherDevice.setViewportSize({ width, height: 900 });
    await otherDevice.evaluate(async () => { await document.fonts.ready; await Promise.all(Array.from(document.images, image => image.decode().catch(() => {}))); window.scrollTo({ top: 0, behavior: 'instant' }); });
    await expect(otherDevice.getByRole('link', { name: 'Passira, início', exact: true })).toBeVisible();
    expect(await otherDevice.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    if (width === 390 || width === 1440) await otherDevice.screenshot({ path: `test-results/account-${width}.png`, fullPage: true });
  }
  await page.getByRole('button', { name: 'Sair da conta', exact: true }).click();
  await expect(page).toHaveURL(origin + '/');
  expect((await page.request.get('/api/account/orders/')).status()).toBe(401);
  expect((await (await another.request.get('/api/account/session/')).json()).user.email).toBe('marina@passira.local');
  await page.context().addCookies([{ name: 'passira-customer', value: cookie!.value, url: origin }]);
  expect((await page.request.get('/api/account/orders/')).status()).toBe(401);
  await another.close();
});

test('login and registration forms fit mobile and desktop and reject cross origin registration', async ({ page, request }) => {
  expect((await request.post('/api/account/register/', { data: {}, headers: { origin: 'https://invalid.example' } })).status()).toBe(403);
  for (const path of ['/entrar/', '/criar-conta/']) {
    await page.goto(path);
    for (const width of [320, 390, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await expect(page.locator('#account-form')).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      if (width === 390 || width === 1440) await page.screenshot({ path: `test-results/${path.includes('criar') ? 'register' : 'login'}-${width}.png`, fullPage: true });
    }
  }
});
