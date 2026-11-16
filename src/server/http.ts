import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { HttpError } from './auth';
import { logRequestId, safeRecordLog, withLogContext } from './system-logs';
import { databaseIssue } from './database-health';

export function checkOrigin(request: Request) {
  const origin = request.headers.get('origin');
  let valid = false;
  try {
    const source = new URL(origin || '');
    // Next.js can use an internal hostname for request.url behind a proxy.
    // Host is supplied by the browser and cannot be overridden by cross-site JS.
    const host = request.headers.get('host') || new URL(request.url).host;
    valid = ['http:', 'https:'].includes(source.protocol) && source.host === new URL(`${source.protocol}//${host}`).host;
  } catch {}
  if (!valid) throw new HttpError(403, 'Origem da solicitação inválida.');
}
export async function readJson(request: Request) {
  checkOrigin(request);
  if (!request.headers.get('content-type')?.startsWith('application/json')) throw new HttpError(415, 'Envie os dados em formato JSON.');
  if (Number(request.headers.get('content-length') || 0) > 100000) throw new HttpError(413, 'Solicitação muito grande.');
  if (!request.body) throw new HttpError(400, 'Dados inválidos.');
  const reader = request.body.getReader(), chunks: Uint8Array[] = [];
  let length = 0;
  while (true) {
    const { value, done } = await reader.read(); if (done) break;
    length += value.byteLength;
    if (length > 100000) { await reader.cancel(); throw new HttpError(413, 'Solicitação muito grande.'); }
    chunks.push(value);
  }
  const text = Buffer.concat(chunks).toString('utf8');
  try { return JSON.parse(text); } catch { throw new HttpError(400, 'Dados inválidos.'); }
}
export function api(handler: () => Promise<unknown>, request?: Request) {
  return withLogContext(request, async () => {
    const requestId = logRequestId()!;
    const headers = { 'Cache-Control': 'no-store', 'X-Request-ID': requestId };
    try {
      const data = await handler();
      if (data instanceof Response) { data.headers.set('X-Request-ID', requestId); return data; }
      return NextResponse.json(data, { headers });
    } catch (error) {
      const status = error instanceof HttpError ? error.status : error instanceof ZodError ? 400 : 500;
      if (status >= 500 || status === 403 || status === 429) {
        const issue = databaseIssue(error);
        await safeRecordLog({ action: status >= 500 ? 'system.request_failed' : 'system.request_blocked', level: status >= 500 ? 'error' : 'warning', details: { statusCode: status, code: status >= 500 ? issue === 'DATABASE_UNAVAILABLE' ? 'INTERNAL_ERROR' : issue : `HTTP_${status}` } });
      }
      const message = error instanceof HttpError ? error.message : error instanceof ZodError ? error.issues[0]?.message || 'Revise os campos.' : 'Não foi possível concluir. Tente novamente.';
      return NextResponse.json({ error: message, ...(status >= 500 ? { requestId } : {}) }, { status, headers });
    }
  });
}
