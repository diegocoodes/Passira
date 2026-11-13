import { test, expect } from '@playwright/test';
import type { Catalog } from '../../src/data/types';

test('dish options, quantity and notes lead to a styled confirmation and direct checkout', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/produto/item-2169250/');
  await expect(page.locator('.product-title')).toBeVisible();
  await page.getByRole('button', { name: 'Adicionar ao carrinho', exact: true }).click();
  await expect(page.locator('.product-detail .form-error[role="alert"]')).toBeVisible();
  await expect(page.locator('.product-added')).toHaveCount(0);
  await page.locator('fieldset.option-section').filter({ hasText: 'Obrigatório' }).first().getByRole('radio').first().check();
  await page.getByRole('button', { name: 'Aumentar Quantidade', exact: true }).click();
  await page.getByRole('textbox', { name: /Alguma observação/ }).fill('Sem cebola, por favor.');
  await expect(page.locator('.product-line-total strong')).toContainText('64,58');
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    if (width === 390 || width === 1440) await page.screenshot({ path: `test-results/product-dish-${width}.png`, fullPage: true });
  }
  await page.getByRole('button', { name: 'Adicionar ao carrinho', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Adicionado ao carrinho!', exact: true })).toBeFocused();
  await expect(page.locator('.product-added-item')).toContainText('2×');
  await expect(page.locator('.product-added-item')).toContainText('Sem cebola, por favor.');
  await expect(page.locator('.product-added-subtotal')).toContainText('64,58');
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    if (width === 390 || width === 1440) await page.screenshot({ path: `test-results/product-confirmation-${width}.png`, fullPage: true });
  }
  await expect(page.getByRole('link', { name: 'Ver carrinho', exact: true })).toHaveAttribute('href', '/finalizar/');
  await expect(page.getByRole('link', { name: 'Adicionar mais produtos', exact: true })).toHaveAttribute('href', '/?categoria=274522#cardapio');
  await page.getByRole('link', { name: 'Finalizar meu pedido', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Dados do cliente', exact: true })).toBeVisible();
  await expect(page.locator('.checkout-summary')).toContainText('2×');
  await page.getByLabel('Seu nome', { exact: true }).fill('Cliente da Passira');
  await page.getByRole('button', { name: 'Voltar', exact: true }).click();
  await page.getByRole('link', { name: /^Editar / }).click();
  await expect(page.getByRole('textbox', { name: /Alguma observação/ })).toHaveValue('Sem cebola, por favor.');
  await page.getByRole('button', { name: 'Salvar alterações', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Item atualizado!', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Finalizar meu pedido', exact: true }).click();
  await expect(page.getByLabel('Seu nome', { exact: true })).toHaveValue('Cliente da Passira');
  const state = await page.evaluate(() => JSON.parse(localStorage.getItem('passira-cart-v1')!).state);
  expect(state.items).toHaveLength(1);
  expect(state.items[0].quantity).toBe(2);
  expect(errors).toEqual([]);
});

test('pizza size and second flavor update totals and survive direct checkout', async ({ page }) => {
  await page.goto('/produto/flavor-380033/');
  await page.locator('.size-option').filter({ hasText: 'Grande' }).getByRole('radio').check();
  await page.getByRole('combobox').selectOption('flavor-380034');
  await expect(page.locator('.product-line-total')).toContainText('58,49');
  await page.setViewportSize({ width: 390, height: 844 });
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Adicionar ao carrinho', exact: true }).click();
  await expect(page.locator('.product-added-item')).toContainText('58,49');
  await page.getByRole('link', { name: 'Finalizar meu pedido', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Dados do cliente', exact: true })).toBeVisible();
  await expect(page.locator('.summary-total')).toContainText('58,49');
  const state = await page.evaluate(() => JSON.parse(localStorage.getItem('passira-cart-v1')!).state);
  expect(state.items[0].flavorIds).toEqual(['flavor-380033', 'flavor-380034']);
});

test('direct checkout sends invalid cart items back to review and handles an empty cart', async ({ page, request }) => {
  const catalog: Catalog = await (await request.get('/api/menu/')).json();
  const price = catalog.prices.find(price => price.productId === 'flavor-380033' && price.sizeId === '40442')!;
  await page.addInitScript(priceId => {
    localStorage.setItem('passira-cart-v1', JSON.stringify({ state: { items: [{ id: 'invalid', productId: 'deleted-product', priceId, flavorIds: [], selections: [], note: '', quantity: 1 }], method: 'pickup', orders: [], favoriteIds: [], customerDraft: null }, version: 1 }));
  }, price.id);
  await page.goto('/finalizar/?etapa=dados');
  await expect(page.getByRole('heading', { name: 'Confira os itens', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Continuar para meus dados', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Remover item', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Seu pedido está vazio', exact: true })).toBeVisible();
});
