import { randomBytes, createHash } from 'node:crypto';
import { z } from 'zod';
import { db } from './db';
import { getCatalog, json } from './catalog';
import { HttpError } from './auth';
import { createMenu, storeOpen } from '@/lib/menu';
import { validateCustomer } from '@/lib/orders';
import { indexCatalog } from '@/data/menu';
import type { CartItem, Customer, Fulfillment, ItemConfiguration, Order, OrderStatus } from '@/data/types';
import type { Prisma } from '@/generated/prisma/client';
import { nextStatuses } from '@/lib/order-status';

const selection = z.object({ scope: z.enum(['size', 'product', 'flavor']), ownerId: z.string().max(100), groupId: z.string().max(100), quantities: z.record(z.string().max(100), z.number().int().min(0).max(99)) });
export const itemSchema = z.object({ id: z.string().min(1).max(100), productId: z.string().max(100), priceId: z.string().max(100), flavorIds: z.array(z.string().max(100)).max(2), selections: z.array(selection).max(30), note: z.string().max(500), quantity: z.number().int().min(1).max(99) });
const customerSchema = z.object({ name: z.string().trim().min(2).max(100), phone: z.string().max(20), cep: z.string().max(10), street: z.string().max(150), number: z.string().max(20), neighborhood: z.string().max(100), complement: z.string().max(150), note: z.string().max(1000), payment: z.enum(['pix', 'debit', 'credit']) });
export const orderSchema = z.object({ requestKey: z.uuid(), fulfillment: z.enum(['pickup', 'delivery']), customer: customerSchema, items: z.array(itemSchema).min(1).max(80), expectedTotalCents: z.number().int().min(0).max(100000000) });
const includeOrder = { items: true, events: { orderBy: { createdAt: 'asc' as const } } };
type StoredOrder = Prisma.OrderGetPayload<{ include: typeof includeOrder }>;
export function presentOrder(order: StoredOrder): Order {
  return { id: `#${order.id}`, number: order.id, token: order.token, status: order.status as OrderStatus, createdAt: order.createdAt.toISOString(), fulfillment: order.fulfillment as Fulfillment,
    customer: order.customer as unknown as Customer, subtotalCents: order.subtotalCents, deliveryCents: order.deliveryCents, totalCents: order.totalCents,
    items: order.items.map(item => ({ configuration: item.configuration as unknown as CartItem, title: item.title, details: item.details as string[], unitCents: item.unitCents })),
    events: order.events.map(event => ({ status: event.status as OrderStatus, createdAt: event.createdAt.toISOString() })),
  };
}

export async function createOrder(input: unknown, date = new Date()) {
  const payload = orderSchema.parse(input);
  const hash = createHash('sha256').update(JSON.stringify(payload)).digest('hex');
  const previous = await db().order.findUnique({ where: { requestKey: payload.requestKey }, include: includeOrder });
  if (previous) {
    if (previous.requestHash !== hash) throw new HttpError(409, 'Esta tentativa já foi usada para outro pedido. Recarregue a página.');
    return presentOrder(previous);
  }
  const reason = validateCustomer(payload.customer, payload.fulfillment === 'delivery');
  if (reason) throw new HttpError(400, reason);
  if (!storeOpen(date)) throw new HttpError(400, 'A loja está fora do horário de atendimento.');
  if (new Set(payload.items.map(item => item.id)).size !== payload.items.length) throw new HttpError(400, 'Há itens duplicados no pedido.');
  const catalog = await getCatalog(), menu = createMenu(catalog), { productById } = indexCatalog(catalog);
  const totals = menu.cartTotals(payload.items, payload.fulfillment, payload.customer.neighborhood, date);
  if (totals.hasErrors) throw new HttpError(400, totals.rows.find(row => row.error)?.error || 'Revise os itens do pedido.');
  if (totals.total === null || totals.fee === null) throw new HttpError(400, 'A taxa de entrega não está definida para este bairro.');
  if (payload.expectedTotalCents !== totals.total) throw new HttpError(409, 'Os valores do cardápio mudaram. Confira o total atualizado e confirme novamente.');
  const variants = await db().variant.findMany(), additions = await db().additionCost.findMany();
  const costByPrice = new Map(variants.map(variant => [variant.id, variant.unitCostCents]));
  const costByAddition = new Map(additions.map(addition => [addition.id, addition.costCents]));
  const costOf = (item: ItemConfiguration): number | null => {
    const price = catalog.prices.find(price => price.id === item.priceId)!;
    const flavorIds = productById[item.productId].kind === 'pizza' ? item.flavorIds : [];
    const costIds = flavorIds.length ? flavorIds.map(id => catalog.prices.find(candidate => candidate.productId === id && candidate.sizeId === price.sizeId)?.id) : [price.id];
    const costs = costIds.map(id => id ? costByPrice.get(id) : null);
    if (costs.some(cost => cost === undefined || cost === null)) return null;
    let total = costs.reduce<number>((sum, cost) => sum + cost!, 0) / costs.length;
    for (const group of item.selections) for (const [id, quantity] of Object.entries(group.quantities)) if (quantity) {
      const cost = costByAddition.get(id);
      if (cost === undefined || cost === null) return null;
      total += cost * quantity / (group.scope === 'flavor' ? Math.max(1, flavorIds.length) : 1);
    }
    return Math.round(total);
  };
  if (payload.fulfillment === 'pickup') Object.assign(payload.customer, { cep: '', street: '', number: '', neighborhood: '', complement: '' });
  const data = { token: randomBytes(24).toString('hex'), requestKey: payload.requestKey, requestHash: hash, fulfillment: payload.fulfillment, customer: json(payload.customer), subtotalCents: totals.subtotal, deliveryCents: totals.fee, totalCents: totals.total,
    items: { create: totals.rows.map(row => ({ productId: row.item.productId, title: productById[row.item.productId].name, quantity: row.item.quantity, configuration: json(row.item), details: json(menu.itemDetails(row.item)), unitCents: row.cents!, unitCostCents: costOf(row.item) })) }, events: { create: { status: 'received' } } };
  try { return presentOrder(await db().order.create({ data, include: includeOrder })); }
  catch (error) {
    // Concurrent retries share one unique key and must return the same order.
    const saved = await db().order.findUnique({ where: { requestKey: payload.requestKey }, include: includeOrder });
    if (saved && saved.requestHash === hash) return presentOrder(saved);
    throw error;
  }
}
export async function trackedOrder(token: string) {
  if (!/^[a-f0-9]{48}$/.test(token)) throw new HttpError(404, 'Pedido não encontrado.');
  const order = await db().order.findUnique({ where: { token }, include: includeOrder });
  if (!order) throw new HttpError(404, 'Pedido não encontrado.');
  return presentOrder(order);
}
export async function changeStatus(id: number, expected: OrderStatus, status: OrderStatus) {
  return db().$transaction(async tx => {
    const order = await tx.order.findUnique({ where: { id } });
    if (!order) throw new HttpError(404, 'Pedido não encontrado.');
    if (order.status !== expected) throw new HttpError(409, 'O pedido mudou. Atualize o painel.');
    if (!nextStatuses(expected, order.fulfillment as Fulfillment).includes(status)) throw new HttpError(400, 'Essa mudança de etapa não é permitida.');
    const result = await tx.order.updateMany({ where: { id, status: expected }, data: { status, ...(status === 'completed' ? { completedAt: new Date() } : {}) } });
    if (!result.count) throw new HttpError(409, 'O pedido mudou. Atualize o painel.');
    await tx.orderEvent.create({ data: { orderId: id, status } });
    return { ok: true };
  });
}
