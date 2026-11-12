import test from 'node:test';
import assert from 'node:assert/strict';
import { initialCatalog } from '../src/data/menu';
import type { Order } from '../src/data/types';
import { createMenu } from '../src/lib/menu';
import { comboOffer } from '../src/lib/combo-offer';
import { prepareRepeatOrder } from '../src/lib/repeat-order';
import { lookupPostalCode } from '../src/server/postal-code';
import { HttpError } from '../src/server/auth';
import { orderPrintLines } from '../src/lib/print-order';
import { newlyReceived } from '../src/components/use-order-alerts';

const at = new Date('2026-11-11T18:00:00-03:00');
const pizza = initialCatalog.products.find(product => product.id === 'flavor-380033')!;
const price = initialCatalog.prices.find(price => price.productId === pizza.id && price.sizeId === '40442')!;
const configuration = { id: 'old-item', productId: pizza.id, priceId: price.id, flavorIds: [pizza.id], selections: [], note: 'Sem cebola', quantity: 2 };
const order: Order = { id: '#12', number: 12, token: 'private-token', status: 'received', createdAt: at.toISOString(), fulfillment: 'pickup', customer: { name: 'Cliente', phone: '(81) 99999-9999', cpf: '52998224725', cep: '', street: '', number: '', neighborhood: '', complement: '', note: '', payment: 'pix' }, items: [{ title: pizza.name, details: ['Grande'], configuration, unitCents: 1 }], subtotalCents: 2, deliveryCents: 0, totalCents: 2 };

test('repeat order uses current prices, preserves notes and skips unavailable options', () => {
  const catalog = structuredClone(initialCatalog);
  const currentPrice = catalog.prices.find(variant => variant.id === price.id)!;
  currentPrice.pickupCents = 7500;
  const result = prepareRepeatOrder(order, catalog, 'pickup', at);
  assert.equal(result.subtotal, 15000);
  assert.equal(result.items[0].configuration.note, 'Sem cebola');
  assert.equal(order.items[0].unitCents, 1);
  currentPrice.enabled = false;
  const unavailable = prepareRepeatOrder(order, catalog, 'pickup', at);
  assert.equal(unavailable.items.length, 0);
  assert.equal(unavailable.skipped.length, 1);
});

test('repeat order excludes removed products without dropping valid items', () => {
  const previous = { ...order, items: [...order.items, { ...order.items[0], title: 'Produto removido', configuration: { ...configuration, productId: 'deleted' } }] };
  const result = prepareRepeatOrder(previous, initialCatalog, 'pickup', at);
  assert.equal(result.items.length, 1); assert.equal(result.skipped.length, 1);
  assert.equal(previous.items.length, 2);
});

test('combo starts at a valid server-calculated price and includes required flavor extras', () => {
  const offer = comboOffer(initialCatalog, 'pickup');
  assert.ok(offer);
  assert.equal(offer.price, 8599);
  assert.equal(createMenu(initialCatalog).calculateItem(offer.config, 'pickup', at).cents, offer.price);
  const changed = structuredClone(initialCatalog);
  changed.additions.filter(option => offer.group.additionIds.includes(option.id) && option.cents === 0).forEach(option => { option.enabled = false; });
  const premium = comboOffer(changed, 'pickup');
  assert.ok(premium); assert.equal(premium.price, 12199);
  assert.equal(createMenu(changed).calculateItem(premium.config, 'pickup', at).cents, premium.price);
  changed.products.find(product => product.id === offer.product.id)!.enabled = false;
  assert.equal(comboOffer(changed, 'pickup'), null);
});

test('postal lookup validates input before the request and handles missing CEP and service errors', async () => {
  let requests = 0;
  const fake = (async () => { requests++; return Response.json({ erro: true }); }) as typeof fetch;
  await assert.rejects(lookupPostalCode('../secret', fake), (error: unknown) => error instanceof HttpError && error.status === 400);
  assert.equal(requests, 0);
  await assert.rejects(lookupPostalCode('99999999', fake), (error: unknown) => error instanceof HttpError && error.status === 404);
  await assert.rejects(lookupPostalCode('50761000', (async () => { throw new Error('timeout'); }) as typeof fetch), (error: unknown) => error instanceof HttpError && error.status === 503);
  const result = await lookupPostalCode('50761000', (async url => {
    assert.equal(String(url), 'https://viacep.com.br/ws/50761000/json/');
    return Response.json({ cep: '50761-000', logradouro: 'Av. General San Martin', bairro: 'San Martin', localidade: 'Recife', uf: 'PE', extra: 'not public' });
  }) as typeof fetch);
  assert.deepEqual(result, { cep: '50761000', street: 'Av. General San Martin', neighborhood: 'San Martin', city: 'Recife', state: 'PE' });
});

test('order alerts only identify new received orders and printouts omit private identifiers', () => {
  const known = new Set(['12']);
  const fresh = { ...order, id: '#13', number: 13 };
  assert.deepEqual(newlyReceived(known, [order, fresh, { ...order, number: 14, status: 'completed' }]).map(item => item.number), [13]);
  known.add('13'); assert.equal(newlyReceived(known, [fresh]).length, 0);
  const text = orderPrintLines(order).join('\n');
  assert.ok(text.includes('COMANDA 12')); assert.ok(text.includes('Sem cebola'));
  assert.ok(!text.includes(order.token!)); assert.ok(!text.includes(order.customer.cpf));
});
