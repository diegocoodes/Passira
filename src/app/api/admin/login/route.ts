import { z } from 'zod';
import { api, readJson } from '@/server/http';
import { db } from '@/server/db';
import { HttpError, hashPassword, rateLimit, startSession, verifyPassword } from '@/server/auth';
import { safeRecordLog } from '@/server/system-logs';
const dummyHash = hashPassword('invalid-password-placeholder');
export async function POST(request: Request) {
  return api(async () => {
    const data = z.object({ email: z.email().max(200), password: z.string().max(256) }).parse(await readJson(request));
    const email = data.email.toLowerCase();
    await rateLimit(`login:${email}`, 10, 900);
    await rateLimit(`login-ip:${request.headers.get('x-forwarded-for') || 'local'}`, 50, 900);
    const admin = await db().admin.findUnique({ where: { email } });
    const valid = verifyPassword(data.password, admin?.passwordHash || dummyHash);
    if (!admin || !valid) {
      await safeRecordLog({ action: 'access.login_failed', level: 'warning' });
      throw new HttpError(401, 'Email ou senha incorretos.');
    }
    await startSession(admin.id, admin);
    return { ok: true };
  }, request);
}
