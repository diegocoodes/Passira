import { db } from './db';
import { initialCatalog } from '@/data/menu';
import type { Catalog, Product, Price } from '@/data/types';
import type { Prisma } from '@/generated/prisma/client';

export const json = (value: unknown) => JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
export async function seedCatalog() {
  if (await db().catalogSetting.findUnique({ where: { id: 'catalog' } })) return;
  await db().$transaction(async tx => {
    const categories = new Set((await tx.category.findMany({ select: { id: true } })).map(row => row.id));
    const products = new Set((await tx.product.findMany({ select: { id: true } })).map(row => row.id));
    const variants = new Set((await tx.variant.findMany({ select: { id: true } })).map(row => row.id));
    const newCategories = initialCatalog.categories.filter(row => !categories.has(row.id)).map(category => ({ id: category.id, name: category.name, data: json(category) }));
    const newProducts = initialCatalog.products.filter(row => !products.has(row.id)).map(product => ({ id: product.id, categoryId: product.categoryId, name: product.name, data: json(product) }));
    const newVariants = initialCatalog.prices.filter(row => !variants.has(row.id)).map(price => ({ id: price.id, productId: price.productId, data: json(price) }));
    if (newCategories.length) await tx.category.createMany({ data: newCategories });
    if (newProducts.length) await tx.product.createMany({ data: newProducts });
    if (newVariants.length) await tx.variant.createMany({ data: newVariants });
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
