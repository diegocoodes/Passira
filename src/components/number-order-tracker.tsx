'use client';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowLeft, Clock3, PackageSearch, Search } from 'lucide-react';
import type { PublicOrderTracking } from '@/data/types';
import { requestJson } from '@/lib/api-client';
import { statusLabels } from '@/lib/order-status';
import { BrandLogo } from './brand-logo';
import { OrderProgress, orderStatusMessage } from './order-progress';

export function NumberOrderTracker() {
  const params = useSearchParams(), router = useRouter();
  const value = params.get('numero') || '';
  const number = /^\d{1,10}$/.test(value) && Number(value) > 0 && Number(value) <= 2147483647 ? Number(value) : null;
  const [input, setInput] = useState(value), [order, setOrder] = useState<PublicOrderTracking | null>(null);
  const [error, setError] = useState(''), [loading, setLoading] = useState(false);
  useEffect(() => { setInput(value); }, [value]);
  useEffect(() => {
    if (!number) { setOrder(null); setLoading(false); setError(value ? 'Informe um número de pedido válido.' : ''); return; }
    const controller = new AbortController();
    setOrder(null); setError(''); setLoading(true);
    const refresh = () => requestJson<PublicOrderTracking>(`/api/orders/number/${number}/`, { signal: controller.signal }).then(data => { setOrder(data); setError(''); }).catch(error => { if (error.name !== 'AbortError') setError(error.message); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    refresh(); const interval = window.setInterval(refresh, 15000);
    return () => { controller.abort(); window.clearInterval(interval); };
  }, [number, value]);
  return <div className="tracking-page"><header className="site-header"><div className="header-inner"><Link href="/" className="brand" aria-label="Passira, início"><BrandLogo /></Link><Link href="/#cardapio" className="checkout-back"><ArrowLeft size={18} />Voltar ao cardápio</Link></div></header><main className="tracking-container">
    <section className="tracking-lookup" aria-labelledby="tracking-title"><div className="tracking-lookup-icon"><PackageSearch size={29} /></div><p className="eyebrow">DA COZINHA ATÉ VOCÊ</p><h1 id="tracking-title">Rastrear pedido</h1><p>Digite o número recebido na confirmação para acompanhar cada etapa.</p><form onSubmit={event => { event.preventDefault(); const normalized = input.trim().replace(/^#\s*/, ''); const parsed = Number(normalized); if (!/^\d{1,10}$/.test(normalized) || !Number.isInteger(parsed) || parsed < 1 || parsed > 2147483647) { setError('Informe um número de pedido válido.'); return; } setError(''); router.replace(`/rastrear-pedido/?numero=${parsed}`, { scroll: false }); }}><label className="field"><span>Número do pedido</span><input inputMode="numeric" autoComplete="off" maxLength={12} placeholder="Ex.: 2" value={input} onChange={event => setInput(event.target.value)} required /></label><button type="submit" className="button primary" disabled={loading}><Search size={18} />{loading ? 'Buscando…' : 'Rastrear pedido'}</button></form></section>
    {error && <div className="admin-alert" role="alert">{error}</div>}{loading && <p className="admin-empty" role="status">Buscando seu pedido…</p>}{order && <section className="tracking-result" aria-label={`Acompanhamento do pedido ${order.id}`}><div className="tracking-heading"><h2>Pedido {order.id}</h2><span className={`order-status status-${order.status}`} role="status">{statusLabels[order.status]}</span><p>{orderStatusMessage(order.status, order.fulfillment)}</p></div><OrderProgress status={order.status} fulfillment={order.fulfillment} events={order.events} /><p className="tracking-refresh"><Clock3 size={16} />Atualização automática a cada 15 segundos.</p></section>}
  </main></div>;
}
