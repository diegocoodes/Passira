import { requireAdmin } from '@/server/auth';
import { api } from '@/server/http';
import { db } from '@/server/db';
import { listLogs, logFilters, logsCsv } from '@/server/logs-query';
import { recordLog } from '@/server/system-logs';

export async function GET(request: Request) {
  return api(async () => {
    const actor = await requireAdmin();
    const params = new URL(request.url).searchParams;
    const { where, format } = logFilters(params);
    if (format !== 'csv') return listLogs(params);
    const rows = await db().systemLog.findMany({ where, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], take: 5000 });
    await recordLog({ action: 'system.logs_exported', actor, details: { rowCount: rows.length } });
    return new Response(logsCsv(rows), { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="passira-registros.csv"', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
  }, request);
}
