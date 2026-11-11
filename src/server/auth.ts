import { randomBytes, scryptSync, timingSafeEqual, createHash } from 'node:crypto';
import { cookies } from 'next/headers';
import { db } from './db';

const COOKIE = 'passira-admin';
export function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  return `${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
}
export function verifyPassword(password: string, stored: string) {
  try { const [salt, hash] = stored.split(':'); const expected = Buffer.from(hash, 'hex'); const actual = scryptSync(password, salt, 64); return expected.length === actual.length && timingSafeEqual(expected, actual); } catch { return false; }
}
export const digest = (token: string) => createHash('sha256').update(token).digest('hex');
export async function currentAdmin() {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const session = await db().session.findUnique({ where: { id: digest(token) }, include: { admin: true } });
  return session && session.expiresAt > new Date() ? session.admin : null;
}
export async function requireAdmin() {
  const admin = await currentAdmin();
  if (!admin) throw new HttpError(401, 'Entre no painel para continuar.');
  return admin;
}
export async function startSession(adminId: string) {
  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await db().session.create({ data: { id: digest(token), adminId, expiresAt } });
  (await cookies()).set(COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/', expires: expiresAt });
}
export async function endSession() {
  const jar = await cookies(), token = jar.get(COOKIE)?.value;
  if (token) await db().session.deleteMany({ where: { id: digest(token) } });
  jar.delete(COOKIE);
}
export class HttpError extends Error { constructor(public status: number, message: string) { super(message); } }
export async function rateLimit(key: string, limit: number, seconds: number) {
  const id = digest(key), now = new Date(), expiresAt = new Date(now.getTime() + seconds * 1000);
  const rows = await db().$queryRaw<{ hits: number }[]>`INSERT INTO RateLimit (id, hits, expiresAt) VALUES (${id}, 1, ${expiresAt}) ON CONFLICT(id) DO UPDATE SET hits = CASE WHEN expiresAt < ${now} THEN 1 ELSE hits + 1 END, expiresAt = CASE WHEN expiresAt < ${now} THEN ${expiresAt} ELSE expiresAt END RETURNING hits`;
  if (Number(rows[0].hits) > limit) throw new HttpError(429, 'Muitas tentativas. Aguarde alguns minutos.');
}
