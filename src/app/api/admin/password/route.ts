import { z } from 'zod';
import { api, readJson } from '@/server/http';
import { db } from '@/server/db';
import { endSession, hashPassword, HttpError, rateLimit, requireAdmin, verifyPassword } from '@/server/auth';
import { recordLog, safeRecordLog } from '@/server/system-logs';
export async function POST(request: Request) { return api(async () => {
  const admin = await requireAdmin();
  await rateLimit(`password:${admin.id}`, 10, 900);
  const data = z.object({ current: z.string().max(256), password: z.string().min(12, 'Use pelo menos 12 caracteres.').max(256) }).parse(await readJson(request));
  if (!verifyPassword(data.current, admin.passwordHash)) {
    await safeRecordLog({ action: 'access.password_rejected', level: 'warning', actor: admin });
    throw new HttpError(400, 'A senha atual está incorreta.');
  }
  await db().$transaction(async tx => {
    await tx.admin.update({ where: { id: admin.id }, data: { passwordHash: hashPassword(data.password) } });
    await tx.session.deleteMany({ where: { adminId: admin.id } });
    await recordLog({ action: 'access.password_changed', actor: admin }, tx);
  });
  await endSession();
  return { ok: true };
}, request); }
