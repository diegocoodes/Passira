import { z } from 'zod';
import { api, readJson } from '@/server/http';
import { db } from '@/server/db';
import { endSession, hashPassword, HttpError, rateLimit, requireAdmin, verifyPassword } from '@/server/auth';
export async function POST(request: Request) { return api(async () => {
  const admin = await requireAdmin();
  await rateLimit(`password:${admin.id}`, 10, 900);
  const data = z.object({ current: z.string().max(256), password: z.string().min(12, 'Use pelo menos 12 caracteres.').max(256) }).parse(await readJson(request));
  if (!verifyPassword(data.current, admin.passwordHash)) throw new HttpError(400, 'A senha atual está incorreta.');
  await db().$transaction([db().admin.update({ where: { id: admin.id }, data: { passwordHash: hashPassword(data.password) } }), db().session.deleteMany({ where: { adminId: admin.id } })]);
  await endSession();
  return { ok: true };
}); }
