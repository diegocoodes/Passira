import { z } from 'zod';
import type { Prisma } from '@/generated/prisma/client';
import { logCategories, logLevels, type LogEntry } from '@/lib/system-logs';
import { dayBounds } from '@/lib/order-status';
import { db } from './db';
import { HttpError } from './auth';

export function logFilters(params: URLSearchParams) {
  const values = z.object({
    from: z.string().max(10).optional(), to: z.string().max(10).optional(),
    category: z.enum(Object.keys(logCategories) as [keyof typeof logCategories, ...Array<keyof typeof logCategories>]).optional(),
    level: z.enum(['info', 'warning', 'error']).optional(),
    q: z.string().trim().max(100).optional(), cursor: z.string().max(100).optional(),
    format: z.enum(['json', 'csv']).default('json'),
  }).parse(Object.fromEntries([...params].filter(([, value]) => value !== '')));
  let start: Date | undefined, end: Date | undefined;
  try { if (values.from) start = dayBounds(values.from).start; if (values.to) end = dayBounds(values.to).end; }
  catch { throw new HttpError(400, 'Escolha datas válidas para os registros.'); }
  if (start && end && start >= end) throw new HttpError(400, 'A data final precisa ser igual ou posterior à inicial.');
  const where: Prisma.SystemLogWhereInput = {
    ...(start || end ? { createdAt: { gte: start, lt: end } } : {}),
    category: values.category, level: values.level,
    ...(values.q ? { OR: ['summary', 'action', 'actorEmail', 'entityId', 'requestId'].map(field => ({ [field]: { contains: values.q } })) } : {}),
  };
  return { where, cursor: values.cursor, format: values.format };
}

export async function listLogs(params: URLSearchParams) {
  const { where, cursor } = logFilters(params);
  const [rows, total] = await Promise.all([
    db().systemLog.findMany({ where, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}), take: 51 }),
    db().systemLog.count({ where }),
  ]);
  const entries = rows.slice(0, 50).map(row => ({ ...row, createdAt: row.createdAt.toISOString() })) as LogEntry[];
  return { entries, total, nextCursor: rows.length > 50 ? entries.at(-1)!.id : null };
}

export function logsCsv(rows: Array<{ createdAt: Date; level: string; category: string; summary: string; actorEmail: string | null; entityId: string | null; requestId: string | null; details: unknown }>) {
  const cell = (value: unknown) => {
    let text = String(value ?? '');
    if (/^[\s\uFEFF]*[=+@-]/.test(text)) text = "'" + text;
    return '"' + text.replaceAll('"', '""') + '"';
  };
  const headers = ['Data em America/Recife', 'Nível', 'Área', 'Evento', 'Responsável', 'Referência', 'Código da solicitação', 'Detalhes'];
  const data = rows.map(row => [new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Recife', dateStyle: 'short', timeStyle: 'medium' }).format(row.createdAt), logLevels[row.level as keyof typeof logLevels] || row.level, logCategories[row.category as keyof typeof logCategories] || row.category, row.summary, row.actorEmail || 'Sistema', row.entityId, row.requestId, JSON.stringify(row.details)]);
  return '\uFEFF' + [headers, ...data].map(row => row.map(cell).join(';')).join('\r\n');
}
