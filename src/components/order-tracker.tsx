'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowLeft, Check, Clipboard, Clock3, ShoppingBag } from 'lucide-react';
import type { Order, OrderStatus } from '@/data/types';
import { requestJson } from '@/lib/api-client';
import { statusLabels } from '@/lib/order-status';
import { brl } from '@/lib/format';
import { BrandLogo } from './brand-logo';

export function OrderTracker({ token }: { token: string }) {
  const [order, setOrder] = useState<Order | null>(null), [error, setError] = useState(''), [copied, setCopied] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    const refresh = () => requestJson<Order>(`/api/orders/${token}/`, { signal: controller.signal }).then(order => { setOrder(order); setError(''); }).catch(error => { if (error.name !== 'AbortError') setError(error.message); });
    refresh(); const interval = window.setInterval(refresh, 15000);
    return () => { controller.abort(); window.clearInterval(interval); };
  }, [token]);
  const steps: OrderStatus[] = ['received', 'accepted', 'preparing', 'ready', ...(order?.fulfillment === 'delivery' ? ['out_for_delivery' as const] : []), 'completed'];
  const status = order?.status as OrderStatus;
  return <div className="tracking-page"><header className="site-header"><div className="header-inner"><Link href="/" className="brand" aria-label="Passira, início"><BrandLogo /></Link><Link href="/#cardapio" className="checkout-back"><ArrowLeft size={18} />Voltar ao cardápio</Link></div></header><main className="tracking-container">
    {error && <div className="admin-alert" role="alert">{error}</div>}{!order ? !error && <p className="admin-empty" role="status">Buscando seu pedido…</p> : <><section className="tracking-heading"><p className="eyebrow">SEU PEDIDO NA PASSIRA</p><h1>Pedido {order.id}</h1><span className={`order-status status-${status}`} role="status">{statusLabels[status]}</span><p>{status === 'received' ? 'Recebemos seu pedido. Aguarde a aceitação da equipe.' : status === 'accepted' ? 'A equipe aceitou seu pedido. Logo começa o preparo.' : status === 'preparing' ? 'Seu pedido está sendo preparado com cuidado.' : status === 'ready' ? order.fulfillment === 'pickup' ? 'Tudo pronto! Você já pode retirar seu pedido na loja.' : 'Tudo pronto! Aguardando a saída para entrega.' : status === 'out_for_delivery' ? 'Seu pedido está a caminho do endereço informado.' : status === 'completed' ? 'Pedido concluído. Obrigado por escolher a Passira!' : 'Este pedido foi cancelado. Fale com a loja se precisar de ajuda.'}</p></section>
    {status !== 'cancelled' && <ol className="tracking-steps" aria-label="Etapas do pedido">{steps.map((step, index) => { const event = order.events?.find(event => event.status === step); return <li key={step} className={event ? 'done' : ''} aria-current={step === status ? 'step' : undefined}><span>{event ? <Check size={17} /> : index + 1}</span><div><strong>{statusLabels[step]}</strong>{event && <small>{new Date(event.createdAt).toLocaleTimeString('pt-BR', { timeZone: 'America/Recife', hour: '2-digit', minute: '2-digit' })}</small>}</div></li>; })}</ol>}
    <section className="tracking-summary"><h2><ShoppingBag size={21} />Resumo do pedido</h2>{order.items.map(item => <div className="tracking-item" key={item.configuration.id}><div><strong>{item.configuration.quantity}× {item.title}</strong>{item.details.map((detail, index) => <small key={index}>{detail}</small>)}</div><strong>{brl(item.unitCents * item.configuration.quantity)}</strong></div>)}<div className="tracking-totals"><p><span>Subtotal</span><strong>{brl(order.subtotalCents)}</strong></p><p><span>{order.fulfillment === 'pickup' ? 'Retirada' : 'Entrega'}</span><strong>{brl(order.deliveryCents)}</strong></p><p><span>Total</span><strong>{brl(order.totalCents)}</strong></p></div><p className="admin-help">Pagamento no recebimento. Este site não realiza cobranças online.</p></section><div className="tracking-share"><Clock3 size={16} /><span>Atualização automática a cada 15 segundos.</span><button className="text-button" onClick={async () => { try { await navigator.clipboard.writeText(window.location.href); setCopied(true); } catch { setError('Copie o endereço desta página para guardar seu acompanhamento.'); } }}><Clipboard size={16} />{copied ? 'Link copiado' : 'Copiar acompanhamento'}</button></div><Link className="button primary full-width" href="/#cardapio">Fazer outro pedido<ShoppingBag size={18} /></Link></>}
  </main></div>;
}
