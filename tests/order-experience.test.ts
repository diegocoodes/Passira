import test from 'node:test';
import assert from 'node:assert/strict';
import { formatCpf, validCpf } from '../src/lib/format';
import { orderText, validateCustomer, whatsappLink } from '../src/lib/orders';
import type { Order } from '../src/data/types';

const order: Order = { id: '#10', number: 10, token: 'a'.repeat(48), createdAt: '2026-11-11T18:00:00Z', status: 'received', fulfillment: 'pickup', customer: { name: 'Cliente de teste', phone: '(81) 99999-9999', cpf: '529.982.247-25', payment: 'pix', note: '', cep: '', street: '', number: '', neighborhood: '', complement: '' }, items: [], subtotalCents: 5898, deliveryCents: 0, totalCents: 5898 };

test('CPF formatting accepts typing and checksum validation rejects incomplete and repeated values', () => {
  assert.equal(formatCpf('52998224725'), '529.982.247-25');
  assert.equal(formatCpf('52998'), '529.98');
  assert.ok(validCpf('529.982.247-25'));
  assert.ok(validCpf('52998224725'));
  for (const value of ['', '123', '00000000000', '11111111111', '52998224724']) assert.ok(!validCpf(value));
  assert.match(validateCustomer({ ...order.customer, cpf: '' }, false)!, /CPF/);
});
test('WhatsApp receives a prefilled order with its number, CPF and total', () => {
  const link = new URL(whatsappLink(order));
  assert.equal(link.hostname, 'wa.me');
  assert.match(link.searchParams.get('text')!, /Referência: #10/);
  assert.match(link.searchParams.get('text')!, /CPF: 529\.982\.247-25/);
  assert.match(link.searchParams.get('text')!, /58,98/);
});
test('old orders without CPF continue to produce a readable receipt message', () => {
  const previous = { ...order, customer: { ...order.customer } };
  delete (previous.customer as Partial<typeof previous.customer>).cpf;
  assert.ok(!orderText(previous).includes('undefined'));
  assert.ok(!orderText(previous).includes('CPF:'));
});
