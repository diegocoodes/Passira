import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { HttpError } from './auth';

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
export function api(handler: () => Promise<unknown>) {
  return handler().then(data => NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } })).catch(error => {
    if (error instanceof HttpError) return NextResponse.json({ error: error.message }, { status: error.status });
    if (error instanceof ZodError) return NextResponse.json({ error: error.issues[0]?.message || 'Revise os campos.' }, { status: 400 });
    console.error('Falha interna da aplicação:', error instanceof Error ? error.name : 'Erro');
    return NextResponse.json({ error: 'Não foi possível concluir. Tente novamente.' }, { status: 500 });
  });
}
