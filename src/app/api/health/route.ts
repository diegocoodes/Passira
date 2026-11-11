import { NextResponse } from 'next/server';
import { db } from '@/server/db';
import { databaseConfigurationIssue, databaseIssue } from '@/server/database-health';

export const dynamic = 'force-dynamic';
export async function GET() {
  const headers = { 'Cache-Control': 'no-store, max-age=0' };
  const configuration = databaseConfigurationIssue(process.env.DATABASE_URL, !!process.env.VERCEL);
  if (configuration) return NextResponse.json({ status: 'unavailable', code: configuration }, { status: 503, headers });
  try {
    await db().category.count();
    const catalog = await db().catalogSetting.findUnique({ where: { id: 'catalog' }, select: { id: true } });
    if (!catalog) return NextResponse.json({ status: 'unavailable', code: 'DATABASE_NOT_INITIALIZED' }, { status: 503, headers });
    return NextResponse.json({ status: 'ok', database: 'connected' }, { headers });
  } catch (error) {
    const code = databaseIssue(error);
    console.error('Falha de conexão com o banco:', code, error instanceof Error ? error.name : 'Error');
    return NextResponse.json({ status: 'unavailable', code }, { status: 503, headers });
  }
}
