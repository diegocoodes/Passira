import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { db } from './db';
import { getCatalog, json } from './catalog';
import { HttpError } from './auth';
import type { Price, Product } from '@/data/types';
import { dayBounds } from '@/lib/order-status';
import { presentOrder } from './order-service';

const cents = z.number().int().min(0).max(10000000);
const variantSchema = z.object({ id: z.string().max(100).optional(), sizeId: z.string().max(100).nullable(), name: z.string().trim().min(1).max(100), cents: cents.nullable(), deliveryCents: cents.nullable(), pickupCents: cents.nullable(), unitCostCents: cents.nullable(), enabled: z.boolean(), deliveryEnabled: z.boolean(), pickupEnabled: z.boolean() });
export const productSchema = z.object({ name: z.string().trim().min(2).max(160), description: z.string().max(2000), categoryId: z.string().max(100), kind: z.enum(['food', 'pizza']), photoUrl: z.string().max(2000).refine(value => !value || /^https:\/\//.test(value) || /^\/images\/[a-zA-Z0-9/_.-]+$/.test(value), 'Use uma imagem HTTPS ou um caminho de imagem local.'), enabled: z.boolean(), blocked: z.boolean(), optionGroupIds: z.array(z.string().max(100)).max(20), variants: z.array(variantSchema).min(1).max(20) });
export async function saveProduct(input: unknown, id?: string) {
  const data = productSchema.parse(input), catalog = await getCatalog();
  const category = catalog.categories.find(category => category.id === data.categoryId && category.enabled);
  if (!category) throw new HttpError(400, 'Selecione uma categoria ativa.');
  if (category.kind !== data.kind) throw new HttpError(400, 'O tipo do produto precisa corresponder à categoria selecionada.');
  const previous = id ? await db().product.findUnique({ where: { id }, include: { variants: true } }) : null;
  if (id && (!previous || previous.deletedAt)) throw new HttpError(404, 'Produto não encontrado.');
  if (data.optionGroupIds.some(id => !catalog.optionGroups.some(group => group.id === id))) throw new HttpError(400, 'Grupo de adicionais inválido.');
  const sizes = data.variants.map(variant => variant.sizeId);
  if (data.kind === 'pizza' && (sizes.some(id => !id || !catalog.sizes.some(size => size.id === id && size.categoryId === data.categoryId && size.enabled)) || new Set(sizes).size !== sizes.length)) throw new HttpError(400, 'Selecione tamanhos diferentes da categoria da pizza.');
  if (data.kind === 'food' && sizes.some(id => id !== null)) throw new HttpError(400, 'Pratos e bebidas usam opções sem tamanho de pizza.');
  if (data.enabled && !data.blocked && !data.variants.some(variant => variant.enabled && variant.cents !== null && ((variant.pickupEnabled && variant.pickupCents !== null) || (variant.deliveryEnabled && variant.deliveryCents !== null)))) throw new HttpError(400, 'Cadastre pelo menos uma opção com preço disponível.');
  const existingProduct = previous?.data as unknown as Product | undefined;
  const productId = id || `custom-${randomUUID()}`;
  const product: Product = { id: productId, sourceId: 0, image: null, order: catalog.products.length + 1, schedule: [], pending: [], ...existingProduct, name: data.name, description: data.description, categoryId: data.categoryId, kind: data.kind, enabled: data.enabled, blocked: data.blocked, photoUrl: data.photoUrl || null, optionGroupIds: data.optionGroupIds };
  if (!data.blocked) product.pending = [];
  const ids = data.variants.filter(variant => variant.id).map(variant => variant.id!);
  if (new Set(ids).size !== ids.length || ids.some(id => !previous?.variants.some(variant => variant.id === id))) throw new HttpError(400, 'Opções de preço inválidas.');
  await db().$transaction(async tx => {
    await tx.product.upsert({ where: { id: productId }, create: { id: productId, categoryId: product.categoryId, name: product.name, data: json(product) }, update: { categoryId: product.categoryId, name: product.name, data: json(product) } });
    await tx.variant.deleteMany({ where: { productId, id: { notIn: ids } } });
    for (const variant of data.variants) {
      const old = previous?.variants.find(candidate => candidate.id === variant.id)?.data as unknown as Price | undefined;
      const variantId = variant.id || `price-${randomUUID()}`;
      const price: Price = { id: variantId, productId, sizeId: variant.sizeId, name: variant.name, cents: variant.cents, deliveryCents: variant.deliveryCents, pickupCents: variant.pickupCents, enabled: variant.enabled, deliveryEnabled: variant.deliveryEnabled, pickupEnabled: variant.pickupEnabled, optionGroupIds: old?.optionGroupIds || [] };
      await tx.variant.upsert({ where: { id: variantId }, create: { id: variantId, productId, data: json(price), unitCostCents: variant.unitCostCents }, update: { data: json(price), unitCostCents: variant.unitCostCents } });
    }
  });
  return { id: productId };
}
export async function adminCatalog() {
  const [catalog, variants, additions] = await Promise.all([getCatalog(), db().variant.findMany({ select: { id: true, unitCostCents: true } }), db().additionCost.findMany()]);
  return { catalog, costs: Object.fromEntries(variants.map(variant => [variant.id, variant.unitCostCents])), additionCosts: Object.fromEntries(additions.map(addition => [addition.id, addition.costCents])) };
}
export async function dashboard(day: string) {
  let bounds; try { bounds = dayBounds(day); } catch { throw new HttpError(400, 'Escolha uma data válida.'); }
  const [orders, expenses, activeOrders] = await Promise.all([
    db().order.findMany({ where: { OR: [{ createdAt: { gte: bounds.start, lt: bounds.end } }, { completedAt: { gte: bounds.start, lt: bounds.end } }] }, include: { items: true, events: { orderBy: { createdAt: 'asc' } } }, orderBy: { id: 'desc' } }),
    db().expense.findMany({ where: { day }, orderBy: { createdAt: 'desc' } }),
    db().order.findMany({ where: { status: { notIn: ['completed', 'cancelled'] } }, include: { items: true, events: { orderBy: { createdAt: 'asc' } } }, orderBy: { id: 'asc' } }),
  ]);
  const completed = orders.filter(order => order.status === 'completed' && order.completedAt && order.completedAt >= bounds.start && order.completedAt < bounds.end);
  const revenue = completed.reduce((sum, order) => sum + order.subtotalCents, 0);
  const deliveryRevenue = completed.reduce((sum, order) => sum + order.deliveryCents, 0);
  const items = completed.flatMap(order => order.items);
  const missingCosts = items.filter(item => item.unitCostCents === null).reduce((sum, item) => sum + item.quantity, 0);
  const costs = items.reduce((sum, item) => sum + (item.unitCostCents || 0) * item.quantity, 0);
  const expenseTotal = expenses.reduce((sum, expense) => sum + expense.cents, 0);
  const rankings = new Map<string, { id: string; name: string; quantity: number; revenue: number }>();
  for (const item of items) { const row = rankings.get(item.productId) || { id: item.productId, name: item.title, quantity: 0, revenue: 0 }; row.quantity += item.quantity; row.revenue += item.unitCents * item.quantity; rankings.set(item.productId, row); }
  const topProducts = [...rankings.values()].sort((a, b) => b.quantity - a.quantity || b.revenue - a.revenue);
  return { day, received: orders.filter(order => order.createdAt >= bounds.start && order.createdAt < bounds.end).length, completed: completed.length, cancelled: orders.filter(order => order.status === 'cancelled').length, revenue, deliveryRevenue, costs, expenses: expenseTotal, profit: missingCosts ? null : revenue - costs - expenseTotal, missingCosts, topProducts, orders: orders.map(presentOrder), activeOrders: activeOrders.map(presentOrder), expenseRows: expenses };
}
