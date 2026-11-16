export function postgresConnection(url: string) {
  const connection = new URL(url);
  // Keep certificate and hostname verification explicit across pg versions.
  if (connection.searchParams.get('sslmode') === 'require') connection.searchParams.set('sslmode', 'verify-full');
  return connection.toString();
}

export function mysqlConnection(url: string) {
  const connection = new URL(url);
  if (connection.protocol !== 'mysql:' || !connection.hostname || !connection.username || !connection.password || connection.pathname.length < 2) {
    throw new Error('DATABASE_URL deve conter host, usuário, senha e nome do banco MySQL.');
  }
  const tls = connection.searchParams.get('ssl') === 'true' || connection.searchParams.has('sslaccept');
  return {
    host: connection.hostname,
    port: Number(connection.port || 3306),
    user: decodeURIComponent(connection.username),
    password: decodeURIComponent(connection.password),
    database: decodeURIComponent(connection.pathname.slice(1)),
    connectionLimit: 5,
    connectTimeout: 15000,
    acquireTimeout: 15000,
    timezone: '+00:00',
    ...(tls ? { ssl: { rejectUnauthorized: true } } : {}),
  };
}
