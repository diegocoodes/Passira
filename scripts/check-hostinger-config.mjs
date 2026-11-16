import 'dotenv/config';

let valid = false;
try {
  const url = new URL(process.env.DATABASE_URL?.trim() || '');
  valid = url.protocol === 'mysql:' && !!url.hostname && !!url.username && !!url.password && url.pathname.length > 1;
} catch { /* Report a configuration error without printing credentials. */ }

if (!valid) throw new Error('Configure DATABASE_URL com a conexão MySQL completa antes de preparar a Hostinger.');
if (process.env.NODE_ENV !== 'production') throw new Error('Defina NODE_ENV=production nas variáveis da Hostinger para preparar o administrador com segurança.');
console.log('Configuração MySQL validada para a Hostinger.');
