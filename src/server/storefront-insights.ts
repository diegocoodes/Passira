import { db } from './db';
import { getCatalog } from './catalog';

export async function salesHighlights(now = new Date()) {
  const since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const [sales, catalog] = await Promise.all([
    db().orderItem.groupBy({
      by: ['productId'],
      where: { order: { status: 'completed', completedAt: { gte: since, lte: now } } },
      _sum: { quantity: true },
      orderBy: [{ _sum: { quantity: 'desc' } }, { productId: 'asc' }],
    }),
    getCatalog(),
  ]);
  const activeCategories = new Set(catalog.categories.filter(category => category.enabled).map(category => category.id));
  const activeProducts = new Set(catalog.products.filter(product => product.enabled && !product.blocked && activeCategories.has(product.categoryId)).map(product => product.id));
  return { productIds: sales.filter(sale => activeProducts.has(sale.productId) && (sale._sum.quantity || 0) > 0).slice(0, 3).map(sale => sale.productId), periodDays: 30 };
}
