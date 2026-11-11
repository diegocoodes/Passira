import { redirect } from 'next/navigation';
import { currentAdmin } from '@/server/auth';
import { AdminPanel } from '@/components/admin-panel';
export const metadata = { title: 'Painel administrativo | Passira', robots: { index: false, follow: false } };
export default async function AdminPage() { const admin = await currentAdmin(); if (!admin) redirect('/admin/entrar/'); return <AdminPanel email={admin.email} />; }
