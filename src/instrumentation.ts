import type { Instrumentation } from 'next';

export const onRequestError: Instrumentation.onRequestError = async (error, request) => {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  const { logRoute, safeRecordLog, withLogContext } = await import('./server/system-logs');
  const { databaseIssue } = await import('./server/database-health');
  const issue = databaseIssue(error);
  await withLogContext(undefined, () => safeRecordLog({ action: 'system.request_failed', level: 'error', details: { route: logRoute(request.path), method: request.method, statusCode: 500, code: issue === 'DATABASE_UNAVAILABLE' ? 'INTERNAL_ERROR' : issue } }));
};
