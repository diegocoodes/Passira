import fs from 'node:fs';
import assert from 'node:assert/strict';
const read = p => JSON.parse(fs.readFileSync(new URL('../' + p, import.meta.url), 'utf8'));
const source = read('audit/source/menu.json').data;
const products = read('src/data/menu/products.json');
const categories = read('src/data/menu/categories.json');
const prices = read('src/data/menu/prices.json');
const groups = read('src/data/menu/option-groups.json');
const additions = read('src/data/menu/additions.json');
let expectedProducts = 0, expectedPrices = 0;
function verifyGroups(list = []) {
  for (const g of list) {
    const saved = groups.find(x => x.id === String(g.id));
    assert.ok(saved, `Grupo ${g.id} ausente`);
    assert.equal(saved.name, g.title); assert.equal(saved.min, g.minimum_choice); assert.equal(saved.max, g.maximum_choice); assert.equal(saved.enabled, g.enabled); assert.equal(saved.allowRepeated, g.choose_more_than_one);
    for (const a of g.complements) {
      const option = additions.find(x => x.id === String(a.id));
      assert.ok(option); assert.equal(option.name, a.title); assert.equal(option.description, a.description); assert.equal(option.cents, Math.round(a.price * 100)); assert.equal(option.enabled, a.enabled);
    }
  }
}
for (const c of source.categories) {
  assert.equal(categories.find(x => x.id === String(c.id))?.name, c.title);
  for (const p of [...c.items, ...c.pizza_flavors]) {
    const saved = products.find(x => x.sourceId === p.id);
    assert.ok(saved, `Produto ${p.id} ausente`); expectedProducts++;
    assert.equal(saved.name, p.title); assert.equal(saved.description, p.description); assert.equal(saved.categoryId, String(c.id));
  }
  for (const p of c.items) {
    verifyGroups(p.complement_categories);
    for (const v of p.prices) { expectedPrices++; const saved = prices.find(x => x.id === `price-${v.id}`); assert.ok(saved); assert.equal(saved.name, v.name); assert.equal(saved.cents, Math.round((v.promotion.enabled ? v.promotion.price : v.value) * 100)); }
  }
  for (const s of c.pizzas) {
    verifyGroups(s.complement_categories);
    for (const v of s.flavors_and_prices) { expectedPrices++; verifyGroups(v.flavor.complement_categories); const saved = prices.find(x => x.id === `pizza-price-${v.price.id}`); assert.ok(saved); assert.equal(saved.cents, Math.round(v.price.price * 100)); assert.equal(saved.productId, `flavor-${v.flavor.id}`); assert.equal(saved.sizeId, String(s.id)); }
  }
}
assert.equal(categories.length, source.categories.length);
assert.equal(products.length, expectedProducts); assert.equal(prices.length, expectedPrices);
console.log(`Integridade confirmada: ${categories.length} categorias, ${expectedProducts} produtos/sabores e ${expectedPrices} preços iguais à fonte arquivada; textos e regras de opções preservados.`);
