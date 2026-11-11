export function postgresConnection(url: string) {
  const connection = new URL(url);
  // Keep certificate and hostname verification explicit across pg versions.
  if (connection.searchParams.get('sslmode') === 'require') connection.searchParams.set('sslmode', 'verify-full');
  return connection.toString();
}
