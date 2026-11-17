import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { db } from './db';
import { digest, HttpError } from './auth';
import { formatCpf, formatPhone, validCpf } from '@/lib/format';
import type { AccountUser } from '@/lib/account';

const COOKIE = 'passira-customer';
const deriveKey = promisify(scrypt);
const email = z.email('Informe um email válido.').max(191).transform(value => value.toLowerCase());
const loginSchema = z.object({ email: z.string().trim().pipe(email), password: z.string().min(1, 'Informe sua senha.').max(128, 'A senha deve ter até 128 caracteres.') });
const profileSchema = z.object({
  name: z.string().trim().min(2, 'Informe seu nome completo.').max(100),
  cpf: z.string().max(14).refine(validCpf, 'Informe um CPF válido.').transform(formatCpf),
  phone: z.string().max(20).refine(value => {
    const digits = value.replace(/\D/g, '');
    return /^\d{10,11}$/.test(digits) && Number(digits.slice(0, 2)) >= 11 && (digits.length === 10 || digits[2] === '9');
  }, 'Informe um telefone brasileiro com DDD válido.').transform(formatPhone),
});
const registrationSchema = loginSchema.extend({ ...profileSchema.shape, password: z.string().min(8, 'Use uma senha com pelo menos 8 caracteres.').max(128, 'A senha deve ter até 128 caracteres.') });
const userFields = { id: true, name: true, email: true, phone: true, cpf: true } as const;
const publicUser = (account: AccountUser): AccountUser => ({ id: account.id, name: account.name, email: account.email, phone: account.phone, cpf: account.cpf });

export async function saveCustomerProfile(accountId: string, input: unknown): Promise<AccountUser> {
  if (!accountId) throw new HttpError(401, 'Entre na sua conta para continuar.');
  const data = profileSchema.parse(input);
  return db().customerAccount.update({ where: { id: accountId }, data, select: userFields });
}

export async function customerPasswordHash(password: string) {
  const salt = randomBytes(16).toString('hex');
  const key = await deriveKey(password, salt, 64) as Buffer;
  return `${salt}:${key.toString('hex')}`;
}

async function matchesPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(':');
  const actual = await deriveKey(password, salt, 64) as Buffer;
  const expected = Buffer.from(hash, 'hex');
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
const dummyHash = customerPasswordHash(randomBytes(32).toString('hex'));

export async function registerCustomer(input: unknown): Promise<AccountUser> {
  const { password, ...data } = registrationSchema.parse(input);
  const passwordHash = await customerPasswordHash(password);
  try {
    return await db().customerAccount.create({ data: { ...data, passwordHash }, select: userFields });
  } catch (error) {
    if ((error as { code?: string }).code === 'P2002') throw new HttpError(409, 'Este email já possui uma conta. Entre para continuar.');
    throw error;
  }
}

export async function authenticateCustomer(input: unknown): Promise<AccountUser> {
  const data = loginSchema.parse(input);
  const account = await db().customerAccount.findUnique({ where: { email: data.email } });
  const valid = await matchesPassword(data.password, account?.passwordHash || await dummyHash);
  if (!account || !valid) throw new HttpError(401, 'Email ou senha incorretos.');
  return publicUser(account);
}

export async function customerFromToken(token?: string): Promise<AccountUser | null> {
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  const session = await db().customerSession.findUnique({ where: { id: digest(token) }, include: { account: { select: userFields } } });
  return session && session.expiresAt > new Date() ? session.account : null;
}
export async function currentCustomer() { return customerFromToken((await cookies()).get(COOKIE)?.value); }
export async function requireCustomer() {
  const customer = await currentCustomer();
  if (!customer) throw new HttpError(401, 'Entre na sua conta para continuar.');
  return customer;
}

export async function createCustomerSession(accountId: string, previousToken?: string) {
  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 30 * 86400000);
  await db().$transaction(async tx => {
    await tx.customerSession.deleteMany({ where: { OR: [ ...(previousToken ? [{ id: digest(previousToken) }] : []), { accountId, expiresAt: { lte: new Date() } } ] } });
    await tx.customerSession.create({ data: { id: digest(token), accountId, expiresAt } });
  });
  return { token, expiresAt };
}
export async function startCustomerSession(accountId: string) {
  const jar = await cookies();
  const session = await createCustomerSession(accountId, jar.get(COOKIE)?.value);
  jar.set(COOKIE, session.token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', expires: session.expiresAt });
}
export async function revokeCustomerSession(token: string) { await db().customerSession.deleteMany({ where: { id: digest(token) } }); }
export async function endCustomerSession() {
  const jar = await cookies(), token = jar.get(COOKIE)?.value;
  if (token) await revokeCustomerSession(token);
  jar.delete(COOKIE);
}
