import { AsyncLocalStorage } from 'node:async_hooks';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import type { Prisma } from '@/generated/prisma/client';
import { logActions, type LogAction, type LogLevel } from '@/lib/system-logs';
import { db } from './db';

export type LogActor = { id: string; email: string };
type LogContext = { requestId: string; route?: string; method?: string; actor?: LogActor };
const context = new AsyncLocalStorage<LogContext>();
const statuses = z.enum(['received', 'accepted', 'preparing', 'ready', 'out_for_delivery', 'completed', 'cancelled']);
const detailFields = {
  previousStatus: statuses, status: statuses,
  totalCents: z.number().int().nonnegative(), cents: z.number().int().nonnegative(),
  itemCount: z.number().int().nonnegative(), variantCount: z.number().int().nonnegative(), rowCount: z.number().int().nonnegative(),
  regionCount: z.number().int().nonnegative(),
  code: z.string().regex(/^[A-Z0-9_]{1,80}$/),
  statusCode: z.number().int().min(100).max(599),
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']),
  route: z.string().max(160).refine(value => value === logRoute(value)),
  changedFields: z.array(z.enum(['name', 'description', 'categoryId', 'kind', 'photoUrl', 'enabled', 'blocked', 'optionGroupIds', 'variants', 'hero', 'selection', 'campaign', 'story', 'footer'])).max(20),
};

// Keep only route templates. Tracking tokens, CEPs and query strings never enter logs.
export function logRoute(value: string) {
  let pathname: string;
  try { pathname = new URL(value, 'http://local').pathname; } catch { return '/unknown/'; }
  const segments = pathname.split('/').filter(Boolean);
  if (segments[0] === 'api' && segments[1] === 'admin') {
    if (!['login', 'logout', 'password', 'catalog', 'dashboard', 'content', 'settings', 'expenses', 'products', 'orders', 'logs'].includes(segments[2])) return '/unknown/';
    return `/api/admin/${segments[2]}/${segments.length > 3 ? '[id]/' : ''}`;
  }
  if (segments[0] === 'api' && segments[1] === 'orders') return segments.length === 2 ? '/api/orders/' : segments[2] === 'number' ? '/api/orders/number/[id]/' : '/api/orders/[id]/';
  if (segments[0] === 'api' && segments[1] === 'cep') return '/api/cep/[id]/';
  if (segments[0] === 'api' && ['health', 'menu'].includes(segments[1])) return `/api/${segments[1]}/${segments[1] === 'menu' && segments.length > 2 ? 'highlights/' : ''}`;
  if (['produto', 'pedido', 'erro'].includes(segments[0])) return `/${segments[0]}/[id]/`;
  if (['admin', 'rastrear-pedido', 'finalizar', 'conferencia'].includes(segments[0])) return `/${segments[0]}/`;
  return pathname === '/' ? '/' : '/unknown/';
}

export function withLogContext<T>(request: Request | undefined, handler: () => T) {
  const requestId = randomUUID();
  return context.run({ requestId, ...(request ? { route: logRoute(request.url), method: request.method } : {}) }, () => handler());
}
export function logRequestId() { return context.getStore()?.requestId; }
export function setLogActor(actor: LogActor) { const active = context.getStore(); if (active) active.actor = { id: actor.id, email: actor.email }; }

export function safeLogDetails(input: Record<string, unknown> = {}) {
  const output: Record<string, string | number | string[]> = {};
  for (const [key, schema] of Object.entries(detailFields)) {
    const parsed = schema.safeParse(input[key]);
    if (parsed.success) output[key] = parsed.data;
  }
  return output;
}

type LogInput = { action: LogAction; level?: LogLevel; actor?: LogActor | null; entityId?: string; details?: Record<string, unknown> };
export function recordLog(input: LogInput, client: Pick<Prisma.TransactionClient, 'systemLog'> = db()) {
  const [category, summary] = logActions[input.action];
  const active = context.getStore();
  const actor = input.actor || active?.actor;
  return client.systemLog.create({ data: {
    action: input.action, category, summary, level: input.level || 'info',
    actorId: actor?.id, actorEmail: actor?.email.slice(0, 191),
    entityId: input.entityId && /^[a-zA-Z0-9._:-]{1,100}$/.test(input.entityId) ? input.entityId : undefined,
    requestId: active?.requestId,
    details: safeLogDetails({ route: active?.route, method: active?.method, ...input.details }) as Prisma.InputJsonValue,
  } });
}

// Diagnostics must not turn a handled failure into another failing response.
export async function safeRecordLog(input: LogInput) {
  try { return await recordLog(input); }
  catch { console.error(JSON.stringify({ event: 'LOG_STORAGE_UNAVAILABLE', action: input.action, requestId: logRequestId() })); return null; }
}
