import { z } from 'zod';
import { api, readJson, checkOrigin } from '@/server/http';
import { HttpError, requireAdmin } from '@/server/auth';
import { db } from '@/server/db';
import { dayBounds } from '@/lib/order-status';
import { recordLog } from '@/server/system-logs';
export async function POST(request: Request) { return api(async () => {
  const actor = await requireAdmin(); const data = z.object({ day: z.string(), title: z.string().trim().min(2).max(150), cents: z.number().int().positive().max(100000000) }).parse(await readJson(request));
  try { dayBounds(data.day); } catch { throw new HttpError(400, 'Data inválida.'); }
  return db().$transaction(async tx => {
    const expense = await tx.expense.create({ data });
    await recordLog({ action: 'expenses.created', actor, entityId: expense.id, details: { cents: expense.cents } }, tx);
    return expense;
  });
}, request); }
export async function DELETE(request: Request) { return api(async () => {
  const actor = await requireAdmin(); checkOrigin(request);
  const id = new URL(request.url).searchParams.get('id') || '';
  await db().$transaction(async tx => {
    const result = await tx.expense.deleteMany({ where: { id } });
    if (result.count) await recordLog({ action: 'expenses.deleted', actor, entityId: id }, tx);
  });
  return { ok: true };
}, request); }
