import { test, expect, type Page, type APIRequestContext } from '@playwright/test';
import { blankCustomer } from '../../src/lib/account';
import { signInCustomer } from './helpers/customer';

const origin = 'http://127.0.0.1:3100';

test.beforeEach(async ({ page }) => {
  const day = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Recife', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  await page.clock.setFixedTime(new Date(`${day}T18:00:00-03:00`));
});

async function seedCart(page: Page, request: APIRequestContext) {
  const catalog = await (await request.get('/api/menu/')).json();
  const price = catalog.prices.find((row: { productId: string; sizeId: string }) => row.productId === 'flavor-380033' && row.sizeId === '40442');
  await page.addInitScript(state => {
    if (!localStorage.getItem('passira-cart-v1')) localStorage.setItem('passira-cart-v1', JSON.stringify({ state, version: 1 }));
  }, { items: [{ id: 'checkout-fixture', productId: price.productId, priceId: price.id, flavorIds: [price.productId], selections: [], note: '', quantity: 1 }], method: 'pickup', orders: [], favoriteIds: [], customerDraftAccountId: null, customerDraft: { ...blankCustomer, name: 'Contato antigo do navegador', cpf: '111.444.777-35', phone: '(11) 99999-9999', note: 'Observação preservada' } });
}

test('continue redirects guests to sign in and returns with account data and the same cart', async ({ page, request }) => {
  const user = await signInCustomer(page, 'checkout-return');
  await page.request.post('/api/account/logout/', { headers: { origin } });
  await seedCart(page, request);
  await page.goto('/finalizar/');
  await page.getByRole('button', { name: 'Continuar para meus dados', exact: true }).click();
  await expect(page).toHaveURL(/\/entrar\/\?next=%2Ffinalizar%2F%3Fetapa%3Ddados/);
  await expect(page.getByRole('link', { name: 'Criar uma conta', exact: true })).toBeVisible();
  await page.getByLabel('Email', { exact: true }).fill(user.email);
  await page.getByLabel('Senha', { exact: true }).fill('senha-fixture-cliente-123');
  await page.getByRole('button', { name: 'Entrar na minha conta', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Dados do cliente', exact: true })).toBeVisible();
  await expect(page.getByLabel('Seu nome', { exact: true })).toHaveValue(user.name);
  await expect(page.getByLabel('CPF', { exact: true })).toHaveValue(user.cpf!);
  await expect(page.getByLabel('Telefone com DDD', { exact: true })).toHaveValue(user.phone);
  await expect(page.getByLabel('Observação do pedido', { exact: false })).toHaveValue('Observação preservada');
  await expect(page.locator('.checkout-summary')).toContainText('1×');
});

test('continue checks the current server session before opening details and uses fresh profile values', async ({ page, request }) => {
  await signInCustomer(page, 'checkout-fresh');
  await seedCart(page, request);
  const initialSession = page.waitForResponse(response => response.url().endsWith('/api/account/session/'));
  await page.goto('/finalizar/'); await initialSession;
  const updated = { name: 'Dados atualizados da conta', phone: '81988887777', cpf: '11144477735' };
  expect((await page.request.patch('/api/account/profile/', { headers: { origin }, data: updated })).ok()).toBe(true);
  let release: () => void = () => {};
  const pending = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/api/account/session/', async route => { await pending; await route.continue(); });
  await page.getByRole('button', { name: 'Continuar para meus dados', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Verificando sua conta…', exact: true })).toBeDisabled();
  await expect(page.getByRole('heading', { name: 'Dados do cliente', exact: true })).toHaveCount(0);
  release();
  await expect(page.getByLabel('Seu nome', { exact: true })).toHaveValue(updated.name);
  await expect(page.getByLabel('CPF', { exact: true })).toHaveValue('111.444.777-35');
  await expect(page.getByLabel('Telefone com DDD', { exact: true })).toHaveValue('(81) 98888-7777');
  await page.unroute('**/api/account/session/');
});

test('continue detects a session ended elsewhere instead of trusting the visible logged in state', async ({ page, request }) => {
  await signInCustomer(page, 'checkout-expired');
  await seedCart(page, request);
  const initialSession = page.waitForResponse(response => response.url().endsWith('/api/account/session/'));
  await page.goto('/finalizar/'); await initialSession;
  await page.request.post('/api/account/logout/', { headers: { origin } });
  await page.getByRole('button', { name: 'Continuar para meus dados', exact: true }).click();
  await expect(page).toHaveURL(/\/entrar\/\?next=/);
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('passira-cart-v1')!).state);
  expect(stored.items).toHaveLength(1);
});

test('confirmed contact data persists in the account and prefills the next checkout', async ({ page, request }) => {
  const user = await signInCustomer(page, 'checkout-profile');
  await seedCart(page, request);
  await page.goto('/finalizar/');
  await page.getByRole('button', { name: 'Continuar para meus dados', exact: true }).click();
  await page.getByLabel('CPF', { exact: true }).fill('11144477735');
  await page.getByLabel('Seu nome', { exact: true }).fill('Nome salvo na conta');
  await page.getByLabel('Telefone com DDD', { exact: true }).fill('81988887777');
  await page.getByRole('button', { name: 'Conferir pedido', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Revise seu pedido', exact: true })).toBeVisible();
  const session = await (await page.request.get('/api/account/session/')).json();
  expect(session.user.cpf).toBe('111.444.777-35');
  expect(session.user.name).toBe('Nome salvo na conta');
  expect((await page.request.patch('/api/account/profile/', { headers: { origin: 'https://invalid.example' }, data: session.user })).status()).toBe(403);
  expect((await page.request.patch('/api/account/profile/', { headers: { origin }, data: { ...session.user, cpf: '11111111111' } })).status()).toBe(400);
  await page.evaluate(() => {
    const stored = JSON.parse(localStorage.getItem('passira-cart-v1')!);
    stored.state.customerDraft = null; stored.state.customerDraftAccountId = null;
    localStorage.setItem('passira-cart-v1', JSON.stringify(stored));
  });
  await page.goto('/finalizar/?etapa=dados');
  await expect(page.getByLabel('CPF', { exact: true })).toHaveValue('111.444.777-35');
  await expect(page.getByLabel('Seu nome', { exact: true })).toHaveValue('Nome salvo na conta');
  await expect(page.getByLabel('Telefone com DDD', { exact: true })).toHaveValue('(81) 98888-7777');
  expect((await (await page.request.get('/api/account/session/')).json()).user.id).toBe(user.id);
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    if (width === 390 || width === 1440) await page.screenshot({ path: `test-results/checkout-account-prefill-${width}.png`, fullPage: true });
  }
});
