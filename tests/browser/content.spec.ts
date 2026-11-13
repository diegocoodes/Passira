import { test, expect } from '@playwright/test';
import type { StorefrontContent } from '../../src/lib/storefront-content';

const origin = 'http://127.0.0.1:3100';

test('administrator edits storefront content and customers see persisted changes', async ({ page, request, browser }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  expect((await request.get('/api/admin/content/')).status()).toBe(401);
  expect((await request.put('/api/admin/content/', { data: {}, headers: { origin } })).status()).toBe(401);
  await page.goto('/admin/entrar/');
  await page.getByLabel('Email', { exact: true }).fill('teste@passira.local');
  await page.getByLabel('Senha', { exact: true }).fill('senha-apenas-para-testes-123456');
  await page.getByRole('button', { name: 'Entrar no painel' }).click();
  await page.getByRole('button', { name: 'Conteúdo da loja', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Banner principal', exact: true })).toBeVisible();
  const original: StorefrontContent = await (await page.request.get('/api/admin/content/')).json();
  const customerContext = await browser.newContext();
  const customer = await customerContext.newPage();
  try {
    expect((await page.request.put('/api/admin/content/', { data: original, headers: { origin: 'https://another-store.example' } })).status()).toBe(403);
    expect((await page.request.put('/api/admin/content/', { data: { ...original, hero: { ...original.hero, image: 'javascript:alert(1)' } }, headers: { origin } })).status()).toBe(400);
    await page.getByLabel('Título do banner', { exact: true }).fill('Pizza na mesa');
    await page.getByLabel('Trecho em destaque do banner', { exact: true }).fill('com a Passira.');
    await page.getByLabel('Texto do botão principal', { exact: true }).fill('Escolher meu prato');
    await page.getByLabel('Link da imagem principal', { exact: true }).fill('/images/380075.webp');
    await page.getByLabel('Descrição da imagem principal', { exact: true }).fill('Pizza da Passira para compartilhar');
    await page.getByLabel('Título dos destaques', { exact: true }).fill('Seleção da nossa cozinha');
    await page.getByLabel('Texto sobre a Passira', { exact: true }).fill('Uma casa feita para reunir amigos em volta da mesa.');
    await page.getByLabel('Foto do restaurante', { exact: true }).fill('/images/2169126.webp');
    await page.getByLabel('Descrição no rodapé', { exact: true }).fill('Venha compartilhar bons momentos na Passira.');
    await page.getByRole('button', { name: 'Descer destaque 1', exact: true }).click();
    const reordered = [original.selection.productIds[1], original.selection.productIds[0], ...original.selection.productIds.slice(2)];
    await expect(page.getByLabel('Produto em destaque 1', { exact: true })).toHaveValue(reordered[0]);
    await expect(page.getByLabel('Prévia do banner')).toContainText('Pizza na mesa');
    await page.getByRole('button', { name: 'Salvar conteúdo da loja', exact: true }).click();
    await expect(page.getByRole('status')).toContainText('Conteúdo salvo.');
    await page.reload();
    await page.getByRole('button', { name: 'Conteúdo da loja', exact: true }).click();
    await expect(page.getByLabel('Título do banner', { exact: true })).toHaveValue('Pizza na mesa');
    const saved: StorefrontContent = await (await page.request.get('/api/admin/content/')).json();
    expect(saved.selection.productIds).toEqual(reordered);
    await customer.goto('/');
    await expect(customer.locator('#hero-heading')).toHaveText('Pizza na mesacom a Passira.');
    await expect(customer.locator('.hero-pizza img')).toHaveAttribute('src', '/images/380075.webp');
    await expect(customer.getByRole('link', { name: 'Escolher meu prato', exact: true })).toBeVisible();
    await expect(customer.locator('#selection-heading')).toHaveText('Seleção da nossa cozinha');
    await expect(customer.locator('.selection-grid .product-card-link').first()).toHaveAttribute('href', `/produto/${reordered[0]}/`);
    await expect(customer.locator('.restaurant-story-copy')).toContainText(saved.story.body);
    await expect(customer.locator('.restaurant-photo figcaption')).toHaveCount(0);
    await expect(customer.locator('.footer-brand')).toContainText(saved.footer.description);
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      expect(await page.locator('.content-image-preview > img').evaluateAll(images => images.every(image => image.getBoundingClientRect().height <= image.parentElement!.getBoundingClientRect().height))).toBe(true);
      await customer.setViewportSize({ width, height: 900 });
      await expect.poll(() => customer.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      if (width === 390 || width === 1440) await page.screenshot({ path: `test-results/content-${width}.png`, fullPage: true });
    }
    await page.getByLabel('Título do banner', { exact: true }).fill('Edição descartada');
    await page.getByRole('button', { name: 'Desfazer edição', exact: true }).click();
    await expect(page.getByLabel('Título do banner', { exact: true })).toHaveValue('Pizza na mesa');
    await page.getByRole('button', { name: 'Adicionar destaque', exact: true }).click();
    await expect(page.getByLabel('Produto em destaque 4', { exact: true })).toBeVisible();
    for (let index = 4; index > 0; index--) await page.getByRole('button', { name: `Remover destaque ${index}`, exact: true }).click();
    await page.getByRole('button', { name: 'Salvar conteúdo da loja', exact: true }).click();
    await expect(page.getByRole('status')).toContainText('Conteúdo salvo.');
    await customer.reload();
    await expect(customer.locator('.house-selection')).toHaveCount(0);
    await expect(customer.getByRole('link', { name: 'Destaques', exact: true })).toHaveCount(0);
    expect(errors).toEqual([]);
  } finally {
    await page.request.put('/api/admin/content/', { data: original, headers: { origin } });
    await customerContext.close();
  }
});
