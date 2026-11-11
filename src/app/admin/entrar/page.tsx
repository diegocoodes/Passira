import { redirect } from 'next/navigation';
import { currentAdmin } from '@/server/auth';
import { AdminLogin } from '@/components/admin-login';
export const metadata = { title: 'Entrar no painel | Passira', robots: { index: false, follow: false } };
export default async function Entrar() { if (await currentAdmin()) redirect('/admin/'); return <AdminLogin />; }
