import { db } from './db';
import { initialCatalog } from '@/data/menu';
import type { Catalog, Product, Price } from '@/data/types';
import type { Prisma } from '@/generated/prisma/client';

export const json = (value: unknown) => JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
export async function seedCatalog() {
  if (await db().catalogSetting.findUnique({ where: { id: 'catalog' } })) return;
  await db().$transaction(async tx => {
    for (const category of initialCatalog.categories) await tx.category.upsert({ where: { id: category.id }, update: {}, create: { id: category.id, name: category.name, data: json(category) } });
    for (const product of initialCatalog.products) await tx.product.upsert({ where: { id: product.id }, update: {}, create: { id: product.id, categoryId: product.categoryId, name: product.name, data: json(product) } });
    for (const price of initialCatalog.prices) await tx.variant.upsert({ where: { id: price.id }, update: {}, create: { id: price.id, productId: price.productId, data: json(price) } });
    const { products: _products, prices: _prices, categories: _categories, ...settings } = initialCatalog;
    await tx.catalogSetting.create({ data: { id: 'catalog', data: json(settings) } });
  }, { timeout: 60000 });
}

export async function getCatalog(): Promise<Catalog> {
  const [categories, products, variants, settings] = await db().$transaction([
    db().category.findMany(), db().product.findMany({ where: { deletedAt: null }, orderBy: { id: 'asc' } }),
    db().variant.findMany({ where: { product: { deletedAt: null } } }), db().catalogSetting.findUnique({ where: { id: 'catalog' } }),
  ]);
  if (!settings) throw new Error('Banco não inicializado. Execute npm run db:setup.');
  return { ...settings.data as unknown as Omit<Catalog, 'categories' | 'products' | 'prices'>,
    categories: categories.map(row => row.data as unknown as Catalog['categories'][number]),
    products: products.map(row => row.data as unknown as Product),
    prices: variants.map(row => row.data as unknown as Price),
  };
}
