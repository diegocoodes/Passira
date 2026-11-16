export type DatabaseIssue = 'DATABASE_URL_MISSING' | 'DATABASE_URL_INVALID' | 'DATABASE_AUTHENTICATION_FAILED' | 'DATABASE_CONNECTION_FAILED' | 'DATABASE_TLS_FAILED' | 'DATABASE_SCHEMA_MISSING' | 'DATABASE_UNAVAILABLE';

export function databaseConfigurationIssue(value: string | undefined, remoteRequired: boolean): DatabaseIssue | null {
  const connection = value?.trim();
  if (!connection) return remoteRequired ? 'DATABASE_URL_MISSING' : null;
  if (!remoteRequired && connection.startsWith('file:')) return null;
  try {
    const url = new URL(connection);
    if (!['postgres:', 'postgresql:', 'mysql:'].includes(url.protocol) || !url.hostname || !url.username || !url.password || url.pathname.length < 2) return 'DATABASE_URL_INVALID';
    return null;
  } catch { return 'DATABASE_URL_INVALID'; }
}

export function databaseIssue(error: unknown): DatabaseIssue {
  const nodes: unknown[] = [error];
  const visited = new Set<unknown>();
  let messages = '';
  const codes = new Set<string>();
  for (let index = 0; index < nodes.length && index < 20; index++) {
    const node = nodes[index];
    if (!node || typeof node !== 'object' || visited.has(node)) continue;
    visited.add(node);
    const record = node as Record<string, unknown>;
    for (const key of ['code', 'originalCode', 'errno']) if (typeof record[key] === 'string' || typeof record[key] === 'number') codes.add(String(record[key]));
    if (typeof record.message === 'string') messages += ` ${record.message}`;
    for (const key of ['cause', 'meta', 'driverAdapterError', 'originalError']) if (record[key]) nodes.push(record[key]);
  }
  if (['P1000', '28P01', '28000', '1044', '1045', 'ER_ACCESS_DENIED_ERROR', 'ER_DBACCESS_DENIED_ERROR'].some(code => codes.has(code)) || /password authentication failed|authentication failed|access denied for user|invalid (?:api key|credentials)/i.test(messages)) return 'DATABASE_AUTHENTICATION_FAILED';
  if (['P2021', '42P01', '1049', '1146', 'ER_NO_SUCH_TABLE', 'ER_BAD_DB_ERROR'].some(code => codes.has(code)) || /does not exist|doesn't exist|no such table|unknown database/i.test(messages)) return 'DATABASE_SCHEMA_MISSING';
  if (/certificate|self.signed|unable to verify/i.test(messages)) return 'DATABASE_TLS_FAILED';
  if (['P1001', 'P1002', 'P1017', 'ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND', 'ECONNRESET'].some(code => codes.has(code)) || /timeout|timed out|connection (?:closed|refused)/i.test(messages)) return 'DATABASE_CONNECTION_FAILED';
  return 'DATABASE_UNAVAILABLE';
}
