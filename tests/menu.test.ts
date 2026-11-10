import test from 'node:test';
import assert from 'node:assert/strict';
import { categories, products, prices, productPrices } from '../src/data/menu';
import { calculateItem, getDeliveryFee, inSchedule, cartTotals } from '../src/lib/menu';
import { formatPhone, formatCep } from '../src/lib/format';
import { validateCustomer } from '../src/lib/orders';
import type { ItemConfiguration, Customer } from '../src/data/types';
const duringService = new Date('2026-11-10T17:00:00Z');
const pizza = (id: string, sizeId: string, flavors = [id]): ItemConfiguration => ({ productId: id, priceId: prices.find(p => p.productId === id && p.sizeId === sizeId)!.id, flavorIds: flavors, selections: [], note: '' });
test('inventory preserves all source categories and products', () => {
  assert.equal(categories.length, 18); assert.equal(products.length, 192);
  assert.equal(products.filter(p => p.kind === 'food').length, 130);
  assert.equal(products.filter(p => p.kind === 'pizza').length, 62);
  assert.equal(prices.length, 289);
  for (const category of categories.filter(c => c.enabled)) assert.ok(products.some(p => p.categoryId === category.id));
  assert.equal(categories.find(c => c.id === '359581')?.enabled, false);
});
test('pizza averages the same-size flavor prices rather than charging the highest', () => {
  const config = pizza('flavor-380033', '40442', ['flavor-380033', 'flavor-380034']);
  assert.deepEqual(calculateItem(config, 'pickup', duringService), { cents: 5849, error: null });
});
test('Brotinho rejects two flavors and missing-size flavors', () => {
  const c = pizza('flavor-380033', '40443', ['flavor-380033', 'flavor-380034']);
  assert.ok(calculateItem(c, 'pickup', duringService).error);
});
test('Pizza em Dobro requires two choices, permits repetition, adds exact premiums', () => {
  const config = pizza('flavor-414849', '40445');
  assert.ok(calculateItem(config, 'pickup', duringService).error);
  config.selections = [{ scope: 'flavor', ownerId: config.productId, groupId: '291297', quantities: { '1271689': 2 } }];
  assert.equal(calculateItem(config, 'pickup', duringService).cents, 8599);
  config.selections[0].quantities = { '1271689': 1, '1415425': 1 };
  assert.equal(calculateItem(config, 'pickup', duringService).cents, 10399);
  config.selections[0].quantities = { '1415425': 2 };
  assert.equal(calculateItem(config, 'pickup', duringService).cents, 12199);
  config.selections[0].quantities = { '1271689': 3 };
  assert.ok(calculateItem(config, 'pickup', duringService).error);
});
test('mandatory accompaniment has one free choice and rejects unknown additions', () => {
  const c: ItemConfiguration = { productId: 'item-2169250', priceId: productPrices('item-2169250')[0].id, flavorIds: [], selections: [], note: '' };
  assert.ok(calculateItem(c, 'pickup', duringService).error);
  c.selections = [{ scope: 'product', ownerId: c.productId, groupId: '240355', quantities: { '1028546': 1 } }];
  assert.equal(calculateItem(c, 'pickup', duringService).cents, 3229);
  c.selections[0].quantities = { 'invented': 1 };
  assert.ok(calculateItem(c, 'pickup', duringService).error);
});
test('disputed prices, incomplete mandatory options and hidden promotion are blocked', () => {
  for (const id of ['item-2169202', 'item-2172244', 'item-2169236', 'flavor-428606']) {
    const c: ItemConfiguration = { productId: id, priceId: productPrices(id)[0].id, flavorIds: id.startsWith('flavor') ? [id] : [], selections: [], note: '' };
    assert.equal(calculateItem(c, 'pickup', duringService).cents, null);
  }
});
test('delivery rates distinguish unknown, explicit free and paid neighborhoods', () => {
  const regions = [{ id: 'test', name: 'test', neighborhoods: ['São Teste'], feeCents: 750 }];
  assert.equal(getDeliveryFee('delivery', 'sao teste', regions), 750);
  assert.equal(getDeliveryFee('delivery', 'Unknown', regions), null);
  assert.equal(getDeliveryFee('pickup', 'Unknown', regions), 0);
  assert.equal(getDeliveryFee('delivery', 'São Teste', [{ ...regions[0], feeCents: null }]), null);
  assert.equal(getDeliveryFee('delivery', 'São Teste', [{ ...regions[0], feeCents: 0 }]), 0);
});
test('pickup total uses validated prices and quantity, delivery without a fee stays unconfirmed', () => {
  const item = { ...pizza('flavor-380033', '40442'), id: 'test', quantity: 2 };
  const pickup = cartTotals([item], 'pickup', '', duringService);
  assert.equal(pickup.subtotal, 11398); assert.equal(pickup.total, 11398); assert.equal(pickup.fee, 0);
  assert.equal(cartTotals([item], 'delivery', 'San Martin', duringService).total, null);
  assert.equal(cartTotals([{ ...item, quantity: 0 }], 'pickup', '', duringService).total, null);
});
test('promotion schedules use Recife local time and reject unavailable weekdays', () => {
  const schedule = categories.find(c => c.id === '274527')!.schedule;
  assert.equal(inSchedule(schedule, duringService), true);
  assert.equal(inSchedule(schedule, new Date('2026-11-13T17:00:00Z')), false);
  assert.equal(inSchedule(schedule, new Date('2026-11-10T11:00:00Z')), false);
});
test('Brazilian phone and CEP validation', () => {
  assert.equal(formatPhone('81998765432'), '(81) 99876-5432');
  assert.equal(formatPhone('8131407400'), '(81) 3140-7400');
  assert.equal(formatCep('50761000'), '50761-000');
  const customer: Customer = { name: 'Teste', phone: '(81) 99876-5432', payment: 'pix', note: '', cep: '', street: '', number: '', neighborhood: '', complement: '' };
  assert.equal(validateCustomer(customer, false), null);
  assert.ok(validateCustomer(customer, true));
  assert.ok(validateCustomer({ ...customer, phone: '123' }, false));
});
