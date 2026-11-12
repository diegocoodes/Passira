import { test, expect } from '@playwright/test';

async function fixture(page: import('@playwright/test').Page, request: import('@playwright/test').APIRequestContext, withHistory = false) {
  const catalog = await (await request.get('/api/menu/')).json();
  const price = catalog.prices.find((price: { productId: string; sizeId: string }) => price.productId === 'flavor-380033' && price.sizeId === '40442');
  const item = { id: 'existing', productId: 'flavor-380033', priceId: price.id, flavorIds: ['flavor-380033'], selections: [], note: '', quantity: 1 };
  const customer = { name: 'Rascunho preservado', phone: '', cpf: '', cep: '', street: '', number: '', neighborhood: '', complement: '', note: '', payment: 'pix' };
  const order = { id: '#90', createdAt: new Date().toISOString(), status: 'saved-locally', fulfillment: 'pickup', customer,
    items: [{ title: 'Pizza antiga', configuration: { ...item, id: 'old', quantity: 2 }, details: [], unitCents: 1 }, { title: 'Item removido', configuration: { ...item, productId: 'deleted' }, details: [], unitCents: 1 }], subtotalCents: 3, deliveryCents: 0, totalCents: 3 };
  await page.addInitScript(state => {
    if (!localStorage.getItem('passira-cart-v1')) localStorage.setItem('passira-cart-v1', JSON.stringify({ state, version: 1 }));
  }, { items: [item], orders: withHistory ? [order] : [], customerDraft: customer, method: 'pickup', favoriteIds: [] });
  return price;
}

test('favorites persist, filtering keeps six-item behavior and the real combo opens its customizer', async ({ page }) => {
  await page.goto('/');
  const cards = page.locator('#menu-products > .product-card');
  await expect(cards).toHaveCount(6);
  await cards.first().getByRole('button', { name: 'Salvar nos favoritos', exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.reload();
  await expect(cards.first().getByRole('button', { name: 'Remover dos favoritos', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: /^Favoritos/ }).click();
  await expect(cards).toHaveCount(1);
  await cards.first().getByRole('link').click();
  await expect(page.getByRole('button', { name: 'Remover dos favoritos', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Remover dos favoritos', exact: true }).click();
  await page.goto('/');
  await page.getByRole('button', { name: /^Favoritos/ }).click();
  await expect(page.getByText('Seus favoritos ficam aqui.')).toBeVisible();
  await page.locator('#category-track').getByRole('button', { name: /pizza em dobro/i }).click();
  await page.locator('#menu-products a[href="/produto/flavor-414849/"]').click();
  await expect(page.locator('.product-title')).toContainText('PIZZA EM DOBRO');
});

test('CEP fills the address, preserves typing during lookup and allows manual fallback', async ({ page, request }) => {
  await fixture(page, request);
  let release: (() => void) | undefined;
  const pending = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/api/cep/50761000/', route => route.fulfill({ json: { cep: '50761000', street: 'Av. General San Martin', neighborhood: 'San Martin', city: 'Recife', state: 'PE' } }));
  await page.route('**/api/cep/50762000/', async route => { await pending; await route.fulfill({ json: { cep: '50762000', street: 'Rua sugerida', neighborhood: 'Bongi', city: 'Recife', state: 'PE' } }); });
  await page.route('**/api/cep/99999999/', route => route.fulfill({ status: 503, json: { error: 'Preencha o endereço manualmente.' } }));
  await page.goto('/finalizar/');
  await page.getByRole('button', { name: 'Entrega', exact: true }).click();
  await page.getByRole('button', { name: 'Continuar para meus dados', exact: true }).click();
  await page.getByLabel('CEP', { exact: true }).fill('50761000');
  await expect(page.getByLabel('Endereço', { exact: true })).toHaveValue('Av. General San Martin');
  await expect(page.getByLabel('Bairro', { exact: true })).toHaveValue('San Martin');
  await page.getByLabel('Número', { exact: true }).fill('1656');
  await page.getByLabel('CEP', { exact: true }).fill('50762000');
  await expect(page.locator('#postal-lookup-status')).toContainText('Buscando');
  await page.getByLabel('Endereço', { exact: true }).fill('Rua digitada durante a consulta');
  release!();
  await expect(page.getByLabel('Bairro', { exact: true })).toHaveValue('Bongi');
  await expect(page.getByLabel('Endereço', { exact: true })).toHaveValue('Rua digitada durante a consulta');
  await expect(page.getByLabel('Número', { exact: true })).toHaveValue('1656');
  await page.getByLabel('CEP', { exact: true }).fill('99999999');
  await expect(page.locator('#postal-lookup-status')).toContainText('manualmente');
  await page.getByLabel('Endereço', { exact: true }).fill('Endereço manual');
  await expect(page.getByLabel('Endereço', { exact: true })).toHaveValue('Endereço manual');
});

test('repeat order appends only valid items using current prices and preserves the current cart and draft', async ({ page, request }) => {
  const price = await fixture(page, request, true);
  await page.goto('/');
  await page.getByRole('button', { name: 'Meus pedidos', exact: true }).click();
  await page.locator('.history-order > summary').click();
  await page.getByRole('button', { name: 'Pedir novamente', exact: true }).click();
  await expect(page).toHaveURL(/\/finalizar\//);
  await expect(page.locator('.cart-row')).toHaveCount(2);
  await expect(page.locator('.cart-notice')).toContainText('preços atuais');
  await expect(page.locator('.cart-notice')).toContainText('Item removido');
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('passira-cart-v1')!).state);
  expect(stored.items.map((item: { quantity: number }) => item.quantity)).toEqual([1, 2]);
  expect(stored.items[0].id).toBe('existing');
  expect(stored.items[1].id).not.toBe('old');
  const total = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price.pickupCents * 3 / 100);
  await expect(page.locator('.summary-total').first()).toContainText(total);
  await page.getByRole('button', { name: 'Continuar para meus dados', exact: true }).click();
  await expect(page.getByLabel('Seu nome', { exact: true })).toHaveValue('Rascunho preservado');
});

test('reduced motion keeps the menu and checkout content visible without decorative animations', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('#menu-products > .product-card')).toHaveCount(6);
  await page.getByRole('button', { name: 'Ver mais', exact: true }).click();
  expect(await page.locator('#menu-products > .product-card').count()).toBeGreaterThan(6);
  await expect(page.locator('#menu-products > .product-card').first()).toBeVisible();
  expect(await page.evaluate(() => document.getAnimations().filter(animation => animation.playState === 'running').length)).toBe(0);
});
