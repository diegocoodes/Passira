import { z } from 'zod';
import { api, readJson, checkOrigin } from '@/server/http';
import { HttpError, requireAdmin } from '@/server/auth';
import { db } from '@/server/db';
import { dayBounds } from '@/lib/order-status';
export async function POST(request: Request) { return api(async () => {
  await requireAdmin(); const data = z.object({ day: z.string(), title: z.string().trim().min(2).max(150), cents: z.number().int().positive().max(100000000) }).parse(await readJson(request));
  try { dayBounds(data.day); } catch { throw new HttpError(400, 'Data inválida.'); }
  return db().expense.create({ data });
}); }
export async function DELETE(request: Request) { return api(async () => {
  await requireAdmin(); checkOrigin(request);
  const id = new URL(request.url).searchParams.get('id') || '';
  await db().expense.deleteMany({ where: { id } }); return { ok: true };
}); }
