'use client';
import type { Order } from '@/data/types';
import { brl, displayMenuText } from './format';
import { paymentLabels, pickupAddress } from './orders';

export function orderPrintLines(order: Order): string[] {
  const c = order.customer;
  return [
    'PASSIRA SAN MARTIN', `COMANDA ${order.number || order.id}`,
    new Date(order.createdAt).toLocaleString('pt-BR', { timeZone: 'America/Recife' }),
    order.fulfillment === 'pickup' ? 'RETIRADA NA LOJA' : 'ENTREGA',
    c.name, c.phone,
    order.fulfillment === 'delivery' ? `${c.street}, ${c.number}, ${c.neighborhood}, CEP ${c.cep}${c.complement ? ', ' + c.complement : ''}` : pickupAddress,
    '', ...order.items.flatMap(item => [
      `${item.configuration.quantity}x ${displayMenuText(item.title)}`,
      ...item.details.map(detail => displayMenuText(detail)),
      ...(item.configuration.note && !item.details.some(detail => detail.includes(item.configuration.note)) ? [`Obs.: ${item.configuration.note}`] : []),
      brl(item.configuration.quantity * item.unitCents), '',
    ]),
    `Subtotal: ${brl(order.subtotalCents)}`, `Entrega: ${brl(order.deliveryCents)}`, `TOTAL: ${brl(order.totalCents)}`,
    `Pagamento no recebimento: ${paymentLabels[c.payment]}`,
    ...(c.note ? ['', `OBSERVAÇÃO: ${c.note}`] : []),
  ];
}

let previousCleanup: (() => void) | undefined;
export function printOrder(order: Order) {
  previousCleanup?.();
  const receipt = document.createElement('section');
  receipt.id = 'passira-print-receipt';
  receipt.setAttribute('aria-hidden', 'true');
  const style = document.createElement('style');
  style.textContent = '#passira-print-receipt{display:none}@media print{@page{size:auto;margin:6mm}body{background:white!important;margin:0!important}body>:not(#passira-print-receipt){display:none!important}#passira-print-receipt{display:block!important;width:72mm;max-width:100%;color:black;background:white;font:12px/1.5 monospace}#passira-print-receipt pre{white-space:pre-wrap;overflow-wrap:anywhere;margin:0;font:inherit}}';
  const content = document.createElement('pre');
  // Customer data is always text, including product names and notes.
  content.textContent = orderPrintLines(order).join('\n');
  receipt.append(style, content);
  document.body.append(receipt);
  const cleanup = () => { receipt.remove(); window.removeEventListener('afterprint', cleanup); clearTimeout(timeout); if (previousCleanup === cleanup) previousCleanup = undefined; };
  const timeout = window.setTimeout(cleanup, 60000);
  previousCleanup = cleanup;
  window.addEventListener('afterprint', cleanup, { once: true });
  try { window.print(); } catch { cleanup(); }
}
