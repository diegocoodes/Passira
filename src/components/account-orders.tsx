'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Clock3, LogOut, ReceiptText, RefreshCw } from 'lucide-react';
import type { Order, OrderStatus } from '@/data/types';
import { ApiError, requestJson } from '@/lib/api-client';
import { accountLoginHref, type AccountUser } from '@/lib/account';
import { brl } from '@/lib/format';
import { statusLabels } from '@/lib/order-status';
import { useCart } from '@/lib/cart';
import { AccountHeader } from './account-header';
import { RepeatOrderButton } from './repeat-order-button';

type OrderPage = { orders: Order[]; nextCursor: number | null };
const activeOrder = (order: Order) => !['completed', 'cancelled'].includes(order.status);

export function AccountOrders({ user }: { user: AccountUser }) {
  const [orders, setOrders] = useState<Order[]>([]), [cursor, setCursor] = useState<number | null>(null);
  const [loading, setLoading] = useState(true), [moreLoading, setMoreLoading] = useState(false), [signingOut, setSigningOut] = useState(false), [error, setError] = useState('');
  const refreshRef = useRef<() => void>(() => {});
  const pagesLoaded = useRef(1), refreshing = useRef(false);
  useEffect(() => {
    useCart.persist.rehydrate();
    const controller = new AbortController();
    const refresh = async () => {
      if (refreshing.current) return;
      refreshing.current = true;
      try {
        const combined: Order[] = [];
        let next: number | null = null;
        for (let page = 0; page < pagesLoaded.current; page++) {
          const data: OrderPage = await requestJson<OrderPage>(`/api/account/orders/${next ? `?before=${next}` : ''}`, { signal: controller.signal });
          combined.push(...data.orders); next = data.nextCursor;
          if (!next) break;
        }
        if (!controller.signal.aborted) { setOrders(combined); setCursor(next); setError(''); }
      } catch (error) {
        if (controller.signal.aborted) return;
        if (error instanceof ApiError && error.status === 401) { setOrders([]); window.location.replace(accountLoginHref()); }
        else setError(error instanceof Error ? error.message : 'Não foi possível carregar seus pedidos.');
      } finally { refreshing.current = false; if (!controller.signal.aborted) setLoading(false); }
    };
    refreshRef.current = refresh;
    refresh();
    const interval = window.setInterval(refresh, 15000);
    window.addEventListener('focus', refresh);
    return () => { controller.abort(); window.clearInterval(interval); window.removeEventListener('focus', refresh); };
  }, []);
  const renderOrder = (order: Order) => <article className={`customer-order ${activeOrder(order) ? 'customer-order-active' : ''}`} key={order.id}>
    <div className="customer-order-top"><div><h3>Pedido {order.id}</h3><time dateTime={order.createdAt}>{new Date(order.createdAt).toLocaleString('pt-BR', { timeZone: 'America/Recife', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</time></div><span className={`order-status status-${order.status}`}>{statusLabels[order.status as OrderStatus]}</span></div>
    <p className="customer-order-items">{order.items.map(item => `${item.configuration.quantity}× ${item.title}`).join(' · ')}</p>
    <div className="customer-order-total"><span>{order.fulfillment === 'pickup' ? 'Retirada na Passira' : 'Entrega no endereço'}</span><strong>{brl(order.totalCents)}</strong></div>
    <div className="customer-order-actions"><Link href={`/minha-conta/pedidos/${order.number}/`} className={`button ${activeOrder(order) ? 'primary' : 'secondary'}`}>{activeOrder(order) ? 'Acompanhar pedido' : 'Ver pedido'}<ArrowRight size={17} /></Link>{!activeOrder(order) && <RepeatOrderButton order={order} />}</div>
  </article>;
  const active = orders.filter(activeOrder), previous = orders.filter(order => !activeOrder(order));
  return <div className="customer-account-page"><a href="#meus-pedidos" className="skip-link">Ir para meus pedidos</a><AccountHeader /><main className="customer-account-container" id="meus-pedidos">
    <div className="customer-account-heading"><div><p className="eyebrow">SUA CONTA PASSIRA</p><h1>Olá, {user.name.split(' ')[0]}.</h1><p>Seus pedidos, do preparo à última fatia.</p></div><button className="text-button account-logout" disabled={signingOut} onClick={async () => {
      setSigningOut(true); setError('');
      try {
        await requestJson('/api/account/logout/', { method: 'POST' });
        await useCart.persist.rehydrate();
        useCart.setState({ orders: [], customerDraft: null, customerDraftAccountId: null });
        sessionStorage.removeItem('passira-pending-order');
        window.location.replace('/');
      } catch (error) { setError(error instanceof Error ? error.message : 'Não foi possível sair da conta.'); setSigningOut(false); }
    }}><LogOut size={17} />{signingOut ? 'Saindo…' : 'Sair da conta'}</button></div>
    <div className="customer-account-identity"><span>{user.email}</span><span><Clock3 size={15} />Atualização a cada 15 segundos</span><button className="text-button" onClick={() => refreshRef.current()}><RefreshCw size={15} />Atualizar pedidos</button></div>
    {error && <p className="form-error" role="alert">{error}</p>}
    {loading ? <p className="account-loading" role="status">Buscando seus pedidos…</p> : !orders.length && !error ? <section className="customer-account-empty"><ReceiptText size={40} strokeWidth={1.25} /><h2>Seu primeiro pedido começa no cardápio</h2><p>Os pedidos feitos com esta conta vão aparecer aqui para você acompanhar.</p><Link href="/#cardapio" className="button primary">Escolher meu pedido<ArrowRight size={18} /></Link></section> : <>
      {!!active.length && <section className="customer-orders-section" aria-labelledby="active-orders-title"><h2 id="active-orders-title">Em andamento <span>{active.length}</span></h2><div className="customer-orders-grid">{active.map(renderOrder)}</div></section>}
      {!!previous.length && <section className="customer-orders-section" aria-labelledby="previous-orders-title"><h2 id="previous-orders-title">Últimos pedidos</h2><div className="customer-orders-grid">{previous.map(renderOrder)}</div></section>}
      {cursor !== null && <button className="button secondary account-load-more" disabled={moreLoading} onClick={async () => {
        setMoreLoading(true); setError('');
        try {
          const data = await requestJson<OrderPage>(`/api/account/orders/?before=${cursor}`);
          setOrders(current => [...current, ...data.orders.filter(order => !current.some(existing => existing.number === order.number))]);
          setCursor(data.nextCursor); pagesLoaded.current++;
        } catch (error) {
          if (error instanceof ApiError && error.status === 401) window.location.replace(accountLoginHref());
          else setError(error instanceof Error ? error.message : 'Não foi possível buscar mais pedidos.');
        } finally { setMoreLoading(false); }
      }}>{moreLoading ? 'Buscando pedidos…' : 'Ver pedidos anteriores'}</button>}
    </>}
  </main></div>;
}
