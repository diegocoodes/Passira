import { api, checkOrigin, readJson } from '@/server/http';
import { HttpError, requireAdmin } from '@/server/auth';
import { saveProduct } from '@/server/admin-service';
import { db } from '@/server/db';
import { recordLog } from '@/server/system-logs';
type Context = { params: Promise<{ id: string }> };
export async function PUT(request: Request, { params }: Context) { return api(async () => { const actor = await requireAdmin(); return saveProduct(await readJson(request), (await params).id, actor); }, request); }
export async function DELETE(request: Request, { params }: Context) { return api(async () => {
  const actor = await requireAdmin(); checkOrigin(request);
  const id = (await params).id;
  await db().$transaction(async tx => {
    const result = await tx.product.updateMany({ where: { id, deletedAt: null }, data: { deletedAt: new Date() } });
    if (!result.count) throw new HttpError(404, 'Produto não encontrado.');
    await recordLog({ action: 'products.deleted', actor, entityId: id }, tx);
  });
  return { ok: true };
}, request); }
