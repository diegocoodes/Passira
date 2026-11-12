import { test, expect } from '@playwright/test';

test('menu shows six options and expands the remaining dishes on demand', async ({ page, request }) => {
  const catalog = await (await request.get('/api/menu/')).json();
  const pizzas = catalog.products.filter((product: { enabled: boolean; categoryId: string }) => product.enabled && product.categoryId === '274528');
  await page.goto('/');
  const cards = page.locator('#menu-products > .product-card');
  const more = page.getByRole('button', { name: 'Ver mais', exact: true });
  await expect(cards).toHaveCount(6);
  await page.getByRole('link', { name: /Bateu a fome/ }).click();
  await expect(page).toHaveURL(/#cardapio$/);
  await expect(page.getByRole('heading', { name: 'Nosso cardápio.' })).toBeVisible();
  await expect(more).toHaveAttribute('aria-expanded', 'false');
  await more.click();
  await expect(cards).toHaveCount(pizzas.length);
  await expect(page.getByRole('button', { name: 'Ver menos', exact: true })).toHaveAttribute('aria-expanded', 'true');
  await page.getByRole('button', { name: 'Ver menos', exact: true }).click();
  await expect(cards).toHaveCount(6);

  await more.click();
  await page.getByLabel('Buscar no cardápio', { exact: true }).fill('pizza');
  await expect(cards).toHaveCount(6);
  await expect(more).toHaveAttribute('aria-expanded', 'false');
  await more.click();
  await page.getByRole('button', { name: 'Limpar busca', exact: true }).click();
  await expect(cards).toHaveCount(6);

  await more.click();
  await page.locator('#category-track button').nth(1).click();
  await expect(cards).toHaveCount(1);
  await expect(more).toHaveCount(0);
  await page.locator('#category-track button').nth(2).click();
  await expect(cards).toHaveCount(6);
  await expect(more).toHaveAttribute('aria-expanded', 'false');
  await page.getByLabel('Buscar no cardápio', { exact: true }).fill('nenhumpratocomestenome');
  await expect(page.getByText('Nenhum item por aqui.')).toBeVisible();
  await expect(more).toHaveCount(0);
});

test('storefront fits phones, tablets and desktops and keeps product navigation', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  for (const width of [320, 390, 768, 1024, 1440, 1860]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
    await expect(page.locator('#menu-products > .product-card')).toHaveCount(6);
    await expect(page.getByText('Pizzaria e restaurante em San Martin', { exact: true })).toHaveCount(0);
    await expect(page.getByText('Da nossa cozinha direto para a sua mesa. Pizzas, pratos e petiscos para saborear cada momento.', { exact: true })).toHaveCount(0);
    // Load offscreen photos too so full-page review captures the finished design.
    const brokenImages = await page.evaluate(async () => {
      const images = Array.from(document.images);
      await Promise.all(images.map(img => { img.loading = 'eager'; return img.decode().catch(() => {}); }));
      return images.filter(img => !img.naturalWidth).map(img => img.getAttribute('src'));
    });
    expect(brokenImages).toEqual([]);
    const layout = await page.evaluate(() => {
      const hero = document.querySelector('.hero')!.getBoundingClientRect();
      const header = document.querySelector('.site-header')!.getBoundingClientRect();
      const copy = document.querySelector('.hero-copy')!.getBoundingClientRect();
      const photo = document.querySelector('.hero-feast')!.getBoundingClientRect();
      return {
        width: document.documentElement.clientWidth,
        contentWidth: document.documentElement.scrollWidth,
        copyFits: copy.left >= hero.left && copy.right <= hero.right,
        photoFits: photo.left >= hero.left && photo.right <= hero.right,
        heroLeft: hero.left,
        heroRight: hero.right,
        headerLeft: header.left,
        headerRight: header.right,
        photoBottom: photo.bottom,
        checkerTop: hero.bottom - parseFloat(getComputedStyle(document.querySelector('.hero')!, '::after').height),
      };
    });
    expect(layout.contentWidth).toBeLessThanOrEqual(layout.width);
    expect(layout.copyFits).toBe(true);
    expect(layout.photoFits).toBe(true);
    expect(layout.heroLeft).toBe(0);
    expect(layout.heroRight).toBe(layout.width);
    expect(layout.headerLeft).toBe(0);
    expect(layout.headerRight).toBe(layout.width);
    expect(layout.photoBottom).toBeCloseTo(layout.checkerTop, 2);
    await page.screenshot({ path: `test-results/storefront-${width}.png`, fullPage: true });
    if (width === 390 || width === 1440 || width === 1860) {
      await page.locator('.hero').screenshot({ path: `test-results/banner-${width}.png` });
      await page.locator('.restaurant-story').screenshot({ path: `test-results/restaurante-${width}.png` });
      await page.locator('.customer-reviews').screenshot({ path: `test-results/avaliacoes-${width}.png` });
      await page.locator('.house-selection').screenshot({ path: `test-results/destaques-${width}.png` });
    }
  }
  await expect(page.locator('.restaurant-details a[href^="tel:"]')).toHaveAttribute('href', 'tel:+558131407400');
  await page.locator('#menu-products > .product-card').first().click();
  await expect(page).toHaveURL(/\/produto\//);
  expect(errors).toEqual([]);
});
