import 'dotenv/config';
import { randomBytes } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { db } from '../src/server/db';
import { seedCatalog } from '../src/server/catalog';
import { hashPassword } from '../src/server/auth';

async function main() {
  await seedCatalog();
  if (!await db().admin.count()) {
    const production = process.env.NODE_ENV === 'production' || !!process.env.VERCEL;
    if (production && (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD)) throw new Error('Defina ADMIN_EMAIL e ADMIN_PASSWORD para criar o primeiro administrador.');
    const email = process.env.ADMIN_EMAIL || 'admin@passira.local';
    const password = process.env.ADMIN_PASSWORD || randomBytes(18).toString('base64url');
    if (password.length < 12) throw new Error('A senha deve ter pelo menos 12 caracteres.');
    await db().admin.create({ data: { email: email.toLowerCase(), passwordHash: hashPassword(password) } });
    if (!production) writeFileSync('admin-access.local.txt', `Painel: http://127.0.0.1:3000/admin/\nEmail: ${email}\nSenha: ${password}\n\nArquivo privado. Não publique. Altere a senha no painel.\n`, { mode: 0o600 });
    console.log(production ? 'Administrador criado.' : 'Administrador criado. Acesso salvo em admin-access.local.txt.');
  }
  console.log('Banco inicializado. Cardápio existente preservado.');
}
main().catch(error => { console.error(error.message); process.exitCode = 1; }).finally(() => db().$disconnect());
