import store from '@/data/store.json';
import type { Customer, Order } from '@/data/types';
import { brl } from './format';
export const paymentLabels = { pix: 'Pix', debit: 'Cartão de débito', credit: 'Cartão de crédito' };
export const pickupAddress = `${store.address.street}, ${store.address.number} · ${store.address.neighborhood}, ${store.address.city}–${store.address.state} · CEP 50761-000`;
export function validateCustomer(c: Customer, delivery: boolean): string | null {
  if (c.name.trim().length < 2) return 'Informe seu nome.';
  const phone = c.phone.replace(/\D/g, '');
  if (!/^\d{10,11}$/.test(phone) || Number(phone.slice(0, 2)) < 11 || (phone.length === 11 && phone[2] !== '9')) return 'Informe um telefone brasileiro com DDD válido.';
  if (!['pix', 'debit', 'credit'].includes(c.payment)) return 'Selecione a forma de pagamento.';
  if (delivery && (!/^\d{8}$/.test(c.cep.replace(/\D/g, '')) || c.street.trim().length < 2 || !c.number.trim() || c.neighborhood.trim().length < 2)) return 'Preencha CEP, endereço, número e bairro para entrega.';
  return null;
}
export function orderText(order: Order) {
  const c = order.customer;
  return [`Olá, Passira - San Martin! Gostaria de confirmar este pedido:`, `Referência: ${order.id}`, `Modalidade: ${order.fulfillment === 'pickup' ? 'Retirada no estabelecimento' : 'Entrega'}`, `Nome: ${c.name}`, `Telefone: ${c.phone}`, ...(order.fulfillment === 'delivery' ? [`Endereço: ${c.street}, ${c.number}, ${c.neighborhood}, CEP ${c.cep}${c.complement ? ', ' + c.complement : ''}`] : [`Retirada: ${pickupAddress}`]), '', ...order.items.flatMap(i => [`${i.configuration.quantity}× ${i.title} — ${brl(i.unitCents * i.configuration.quantity)}`, ...i.details.map(d => '  ' + d)]), '', `Subtotal: ${brl(order.subtotalCents)}`, `Taxa de entrega: ${brl(order.deliveryCents)}`, `Total: ${brl(order.totalCents)}`, `Pagamento ${order.fulfillment === 'pickup' ? 'na retirada' : 'no recebimento'}: ${paymentLabels[c.payment]}`, ...(c.note ? [`Observação: ${c.note}`] : []), '', 'Aguardando confirmação da pizzaria. Nenhum pagamento realizado.'].join('\n');
}
export const whatsappLink = (order: Order) => `https://wa.me/55${store.whatsapp}?text=${encodeURIComponent(orderText(order))}`;
export function downloadOrder(order: Order) {
  const url = URL.createObjectURL(new Blob([orderText(order)], { type: 'text/plain;charset=utf-8' }));
  const a = document.createElement('a'); a.href = url; a.download = `passira-${order.id}.txt`; a.click(); URL.revokeObjectURL(url);
}
