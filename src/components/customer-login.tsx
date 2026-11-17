'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowRight, Eye, EyeOff } from 'lucide-react';
import { requestJson } from '@/lib/api-client';
import { formatPhone } from '@/lib/format';
import { accountLoginHref } from '@/lib/account';
import { AccountHeader } from './account-header';

export function CustomerLogin({ register = false, destination }: { register?: boolean; destination: string }) {
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [visible, setVisible] = useState(false);
  const [phone, setPhone] = useState('');
  const checkout = destination.startsWith('/finalizar/');
  return <div className="customer-auth-page"><a href="#account-form" className="skip-link">Ir para o formulário</a><AccountHeader /><main className="customer-auth-layout">
    <div className="customer-auth-visual"><div className="customer-auth-photo"><img src="/images/restaurant/interior-san-martin.webp" alt="Salão da Passira San Martin" width={1200} height={900} /></div><div className="customer-auth-wordmark" aria-hidden="true">Mais perto.<br /><strong>Mais Passira.</strong></div></div>
    <section className="customer-auth-content" aria-labelledby="auth-title">
      <p className="eyebrow">SUA CONTA PASSIRA</p><h1 id="auth-title">{register ? 'Crie sua conta' : 'Entre na sua conta'}</h1>
      <p className="customer-auth-intro">{checkout ? 'Entre ou crie uma conta para concluir o pedido. Seu carrinho está guardado.' : register ? 'Guarde seus pedidos e acompanhe cada etapa, do preparo à sua mesa.' : 'Entre para ver seus últimos pedidos e acompanhar o que está sendo preparado.'}</p>
      <form id="account-form" onSubmit={async event => {
        event.preventDefault(); if (busy) return;
        const form = new FormData(event.currentTarget);
        if (register && form.get('password') !== form.get('confirmation')) { setError('As senhas precisam ser iguais.'); return; }
        setBusy(true); setError('');
        try {
          const data = { email: String(form.get('email') || '').trim(), password: String(form.get('password') || ''), ...(register ? { name: String(form.get('name') || '').trim(), phone } : {}) };
          await requestJson(`/api/account/${register ? 'register' : 'login'}/`, { method: 'POST', body: JSON.stringify(data) });
          window.location.assign(destination);
        } catch (error) { setError(error instanceof Error ? error.message : 'Não foi possível entrar. Tente novamente.'); setBusy(false); }
      }} aria-busy={busy}>
        {register && <><label className="field"><span>Nome completo</span><input name="name" autoComplete="name" required minLength={2} maxLength={100} /></label><label className="field"><span>Telefone com DDD</span><input name="phone" type="tel" autoComplete="tel-national" inputMode="tel" value={phone} onChange={event => setPhone(formatPhone(event.target.value))} required maxLength={15} /></label></>}
        <label className="field"><span>Email</span><input name="email" type="email" autoComplete="username" required maxLength={191} autoCapitalize="none" spellCheck={false} /></label>
        <label className="field"><span>Senha</span><div className="customer-password"><input name="password" aria-label="Senha" type={visible ? 'text' : 'password'} autoComplete={register ? 'new-password' : 'current-password'} required minLength={register ? 8 : 1} maxLength={128} aria-describedby={register ? 'password-help' : undefined} /><button type="button" aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'} aria-pressed={visible} onClick={() => setVisible(value => !value)}>{visible ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>{register && <small id="password-help">Use pelo menos 8 caracteres.</small>}</label>
        {register && <label className="field"><span>Confirmar senha</span><input name="confirmation" type={visible ? 'text' : 'password'} autoComplete="new-password" required minLength={8} maxLength={128} /></label>}
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="button primary full-width" disabled={busy}>{busy ? register ? 'Criando sua conta…' : 'Entrando…' : register ? 'Criar minha conta' : 'Entrar na minha conta'}<ArrowRight size={18} /></button>
      </form>
      <p className="customer-auth-switch">{register ? 'Já tem uma conta?' : 'Primeira vez por aqui?'} <Link href={register ? accountLoginHref(destination) : `/criar-conta/?next=${encodeURIComponent(destination)}`}>{register ? 'Entrar na conta' : 'Criar uma conta'}</Link></p>
    </section>
  </main></div>;
}
