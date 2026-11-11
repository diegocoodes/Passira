'use client';
import Link from 'next/link';
import { useState } from 'react';
import { ArrowLeft, ArrowRight, LockKeyhole } from 'lucide-react';
import { BrandLogo } from './brand-logo';

export function AdminLogin() {
  const [error, setError] = useState(''), [busy, setBusy] = useState(false);
  return <main className="admin-login"><Link href="/" className="admin-login-brand" aria-label="Passira, início"><BrandLogo /></Link><section>
    <div className="admin-login-icon"><LockKeyhole size={24} /></div><p className="eyebrow">GESTÃO PASSIRA</p><h1>Bem-vindo de volta.</h1><p>Entre para acompanhar os pedidos e cuidar do seu cardápio.</p>
    <form onSubmit={async event => {
      event.preventDefault(); setBusy(true); setError('');
      const fields = new FormData(event.currentTarget);
      try { const response = await fetch('/api/admin/login/', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: fields.get('email'), password: fields.get('password') }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error); window.location.assign('/admin/'); } catch (error) { setError(error instanceof Error ? error.message : 'Não foi possível entrar.'); setBusy(false); }
    }}><label className="field"><span>Email</span><input type="email" name="email" required autoComplete="username" placeholder="seu@email.com" /></label><label className="field"><span>Senha</span><input type="password" name="password" required maxLength={256} autoComplete="current-password" placeholder="Sua senha" /></label>{error && <p className="form-error" role="alert">{error}</p>}<button className="button primary full-width" disabled={busy}>{busy ? 'Entrando…' : 'Entrar no painel'}<ArrowRight size={18} /></button></form>
    <Link href="/" className="text-button"><ArrowLeft size={16} />Voltar à loja</Link>
  </section><small>Acesso exclusivo da equipe Passira San Martin.</small></main>;
}
