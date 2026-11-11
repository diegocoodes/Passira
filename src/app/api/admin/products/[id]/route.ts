import { api, checkOrigin, readJson } from '@/server/http';
import { HttpError, requireAdmin } from '@/server/auth';
import { saveProduct } from '@/server/admin-service';
import { db } from '@/server/db';
type Context = { params: Promise<{ id: string }> };
export async function PUT(request: Request, { params }: Context) { return api(async () => { await requireAdmin(); return saveProduct(await readJson(request), (await params).id); }); }
export async function DELETE(request: Request, { params }: Context) { return api(async () => {
  await requireAdmin(); checkOrigin(request);
  const result = await db().product.updateMany({ where: { id: (await params).id, deletedAt: null }, data: { deletedAt: new Date() } });
  if (!result.count) throw new HttpError(404, 'Produto não encontrado.');
  return { ok: true };
}); }
