import { z } from 'zod';
import { api, readJson } from '@/server/http';
import { requireAdmin } from '@/server/auth';
import { db } from '@/server/db';
import { getCatalog, json } from '@/server/catalog';
const cents = z.number().int().min(0).max(10000000);
export async function PUT(request: Request) { return api(async () => {
  await requireAdmin(); const data = z.object({ deliveryRegions: z.array(z.object({ id: z.string().min(1).max(100), name: z.string().min(1).max(100), neighborhoods: z.array(z.string().trim().min(2).max(100)).min(1).max(100), feeCents: cents.nullable() })).max(100), additionCosts: z.record(z.string(), cents.nullable()) }).parse(await readJson(request));
  const catalog = await getCatalog();
  const { products: _products, prices: _prices, categories: _categories, ...settings } = catalog;
  await db().$transaction(async tx => {
    await tx.catalogSetting.update({ where: { id: 'catalog' }, data: { data: json({ ...settings, deliveryRegions: data.deliveryRegions }) } });
    for (const addition of catalog.additions) await tx.additionCost.upsert({ where: { id: addition.id }, create: { id: addition.id, costCents: data.additionCosts[addition.id] ?? null }, update: { costCents: data.additionCosts[addition.id] ?? null } });
  });
  return { ok: true };
}); }
