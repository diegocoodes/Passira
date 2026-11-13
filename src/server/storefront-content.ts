import { defaultStorefrontContent, storefrontContentSchema, type StorefrontContent } from '@/lib/storefront-content';
import { db } from './db';
import { getCatalog, json } from './catalog';
import { HttpError } from './auth';

const settingId = 'storefront-content';

export async function getStorefrontContent(): Promise<StorefrontContent> {
  const row = await db().catalogSetting.findUnique({ where: { id: settingId } });
  return row ? storefrontContentSchema.parse(row.data) : structuredClone(defaultStorefrontContent);
}

export async function saveStorefrontContent(input: unknown) {
  const content = storefrontContentSchema.parse(input);
  const catalog = await getCatalog();
  // Saved selections may refer to a product that has since been paused or deleted.
  // Allow keeping/removing those selections so unrelated text edits remain possible.
  const previous = await getStorefrontContent();
  const eligible = new Set(catalog.products.filter(product => product.enabled && !product.blocked && catalog.categories.some(category => category.id === product.categoryId && category.enabled)).map(product => product.id));
  if (content.selection.productIds.some(id => !eligible.has(id) && !previous.selection.productIds.includes(id))) throw new HttpError(400, 'Escolha produtos disponíveis no cardápio para os destaques.');
  await db().catalogSetting.upsert({ where: { id: settingId }, create: { id: settingId, data: json(content) }, update: { data: json(content) } });
  return content;
}
