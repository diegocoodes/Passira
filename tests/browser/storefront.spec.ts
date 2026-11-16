import { test, expect } from '@playwright/test';

test('menu previews ten products and expands every enabled category without duplicate products', async ({ page, request }) => {
  const catalog = await (await request.get('/api/menu/')).json();
  const categories = catalog.categories.filter((category: { enabled: boolean }) => category.enabled);
  const products = catalog.products.filter((product: { enabled: boolean; categoryId: string }) => product.enabled && categories.some((category: { id: string }) => category.id === product.categoryId));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const cards = page.locator('#menu-products .product-card');
  const more = page.getByRole('button', { name: 'Ver mais', exact: true });
  await expect(cards).toHaveCount(10);
  await page.getByRole('link', { name: /Bateu a fome/ }).click();
  await expect(page).toHaveURL(/#cardapio$/);
  await expect(page.getByRole('heading', { name: 'Nosso cardápio.' })).toBeVisible();
  await expect(more).toHaveAttribute('aria-expanded', 'false');
  await more.click();
  await expect(cards).toHaveCount(products.length);
  for (const category of categories) {
    const expected = products.filter((product: { categoryId: string }) => product.categoryId === category.id).length;
    if (expected) await expect(page.locator(`#categoria-${category.id} .product-card`)).toHaveCount(expected);
  }
  const ids = await cards.evaluateAll(elements => elements.map(element => element.id));
  expect(new Set(ids).size).toBe(products.length);
  await expect(page.getByRole('button', { name: 'Ver menos', exact: true })).toHaveAttribute('aria-expanded', 'true');
  await page.getByRole('button', { name: 'Ver menos', exact: true }).click();
  await expect(cards).toHaveCount(10);

  await more.click();
  await page.getByLabel('Buscar no cardápio', { exact: true }).fill('pizza');
  await expect(cards).toHaveCount(10);
  await expect(more).toHaveAttribute('aria-expanded', 'false');
  await more.click();
  await page.getByRole('button', { name: 'Limpar busca', exact: true }).click();
  await expect(cards).toHaveCount(10);

  await more.click();
  await page.locator('#category-track button').nth(1).click();
  await expect(cards).toHaveCount(products.length);
  await expect(page.locator('#categoria-365011 .product-card')).toHaveCount(1);
  await page.locator('#category-track button').nth(2).click();
  await expect(cards).toHaveCount(products.length);
  await expect(page.getByRole('button', { name: 'Ver menos', exact: true })).toHaveAttribute('aria-expanded', 'true');
  await page.getByLabel('Buscar no cardápio', { exact: true }).fill('nenhumpratocomestenome');
  await expect(page.getByText('Nenhum item por aqui.')).toBeVisible();
  await expect(more).toHaveCount(0);
});

for (const width of [390, 1440]) {
  test(`category shortcuts reveal the whole menu and scroll to the selected section at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await expect(page.locator('#menu-products .product-card')).toHaveCount(10);
    const shortcut = page.locator('#category-track').getByRole('button', { name: /^Bebidas / });
    await shortcut.click();
    await expect(page).toHaveURL(/categoria=274513#categoria-274513$/);
    await expect(shortcut).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#categoria-274513')).toBeFocused();
    await expect.poll(() => page.locator('#categoria-274513').evaluate(element => {
      const header = document.querySelector('.site-header')!.getBoundingClientRect();
      const section = element.getBoundingClientRect();
      return section.top >= header.bottom && section.top < 180;
    })).toBe(true);
    await expect(page.locator('#categoria-274528 .product-card').first()).toBeAttached();
    await expect(page.locator('#categoria-274508 .product-card').first()).toBeAttached();
    await page.screenshot({ path: `test-results/category-scroll-${width}.png` });
    await page.locator('.menu-end a').click();
    await expect(page).toHaveURL(/\/#cardapio$/);
    await expect.poll(() => page.locator('#cardapio').evaluate(element => Math.abs(element.getBoundingClientRect().top) < 300)).toBe(true);
    await shortcut.click();
    await page.reload();
    await expect(page.locator('#categoria-274513')).toBeFocused();
    await page.goto('/?categoria=274522#cardapio');
    await expect(page.locator('#categoria-274522')).toBeFocused();
    await page.goto('/#categoria-274512');
    await expect(page.locator('#categoria-274512')).toBeFocused();
    await page.goto('/?categoria=inexistente#cardapio');
    await expect(page.locator('#menu-products .product-card')).toHaveCount(10);
  });
}

test('storefront fits phones, tablets and desktops and keeps product navigation', async ({ page }) => {
  // Keep visual captures stable while the interaction suite checks reduced motion separately.
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  for (const width of [320, 390, 768, 1024, 1440, 1860]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
    await expect(page.locator('#menu-products .product-card')).toHaveCount(10);
    await expect(page.locator('.store-bar')).toHaveCount(0);
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
      await page.locator('.story-ribbon').screenshot({ path: `test-results/faixa-${width}.png` });
    }
  }
  await expect(page.locator('.restaurant-details a[href^="tel:"]')).toHaveAttribute('href', 'tel:+558131407400');
  await page.locator('#menu-products .product-card').first().click();
  await expect(page).toHaveURL(/\/produto\//);
  expect(errors).toEqual([]);
});
