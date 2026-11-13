import { test, expect } from '@playwright/test';

for (const width of [390, 1440]) {
  test(`pizzeria opening reveals the store automatically and plays once per tab at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    const opening = page.locator('.storefront-opening[open]');
    await expect(opening).toBeVisible();
    await expect(page.getByRole('button', { name: 'Pular abertura', exact: true })).toBeFocused();
    expect(await page.evaluate(() => document.body.style.overflow)).toBe('hidden');
    await opening.evaluate(element => {
      for (const animation of element.getAnimations({ subtree: true })) { animation.pause(); animation.currentTime = 1200; }
    });
    expect(await opening.evaluate(element => element.scrollWidth <= innerWidth && element.scrollHeight <= innerHeight)).toBe(true);
    await page.screenshot({ path: `test-results/opening-${width}.png` });
    await expect(opening).toHaveCount(0, { timeout: 5000 });
    expect(await page.evaluate(() => document.body.style.overflow)).toBe('');
    await expect(page.locator('#menu-products > .product-card')).toHaveCount(6);
    await page.reload();
    await expect(page.locator('#menu-products > .product-card')).toHaveCount(6);
    await expect(page.locator('.storefront-opening[open]')).toHaveCount(0);
    await page.getByLabel('Buscar no cardápio', { exact: true }).fill('pizza');
    await expect(page.locator('#menu-products > .product-card')).toHaveCount(6);
  });
}

test('skip, Escape and a change to reduced motion release the store immediately', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Pular abertura', exact: true }).click();
  await expect(page.locator('.storefront-opening[open]')).toHaveCount(0);
  expect(await page.evaluate(() => document.body.style.overflow)).toBe('');
  await page.evaluate(() => sessionStorage.removeItem('passira-opening-seen'));
  await page.reload();
  await expect(page.locator('.storefront-opening[open]')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('.storefront-opening[open]')).toHaveCount(0);
  expect(await page.evaluate(() => document.body.style.overflow)).toBe('');
  await page.evaluate(() => sessionStorage.removeItem('passira-opening-seen'));
  await page.reload();
  await expect(page.locator('.storefront-opening[open]')).toBeVisible();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('.storefront-opening[open]')).toHaveCount(0);
  expect(await page.evaluate(() => document.body.style.overflow)).toBe('');
  await page.getByRole('button', { name: 'Ver mais', exact: true }).click();
  expect(await page.locator('#menu-products > .product-card').count()).toBeGreaterThan(6);
});

test('direct menu links and reduced motion bypass the opening', async ({ page }) => {
  await page.goto('/?categoria=274528#cardapio');
  await expect(page.locator('#menu-products > .product-card')).toHaveCount(6);
  await expect(page.locator('.storefront-opening[open]')).toHaveCount(0);
  await page.evaluate(() => sessionStorage.removeItem('passira-opening-seen'));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('#menu-products > .product-card')).toHaveCount(6);
  await expect(page.locator('.storefront-opening[open]')).toHaveCount(0);
  expect(await page.evaluate(() => document.body.style.overflow)).toBe('');
});

test('blocked session storage does not prevent skipping or using the menu', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'sessionStorage', { get() { throw new DOMException('Blocked', 'SecurityError'); } });
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Pular abertura', exact: true }).click();
  await expect(page.locator('.storefront-opening[open]')).toHaveCount(0);
  await page.getByRole('button', { name: 'Ver mais', exact: true }).click();
  expect(await page.locator('#menu-products > .product-card').count()).toBeGreaterThan(6);
});
