'use client';
import { useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowRight, Check, ChevronRight, Clock3, Flame, Info, MapPin, Pizza, Plus, ReceiptText, Search, ShoppingBag, SlidersHorizontal, Store, X } from 'lucide-react';
import { availableCategories, categories, categoryById, productById, products } from '@/data/menu';
import store from '@/data/store.json';
import type { CartItem, Product } from '@/data/types';
import { useCart } from '@/lib/cart';
import { brl, normalize } from '@/lib/format';
import { availability, cartTotals, minimumPrice, storeOpen } from '@/lib/menu';
import { pickupAddress } from '@/lib/orders';
import { CartPanel, Checkout, MethodChoice, OrderReceipt } from './cart';
import { Dialog } from './dialog';
import { ProductCustomizer } from './product-customizer';

function ProductCard({ product, open }: { product: Product; open: () => void }) {
  const method = useCart(s => s.method);
  const price = product.blocked ? null : minimumPrice(product.id, method);
  const reason = availability(product.id);
  return <button className={`product-card ${product.blocked ? 'needs-review' : ''}`} onClick={open} aria-label={`Ver ${product.name.trim()}`}>
    <div className="product-card-copy">{product.blocked && <span className="review-label">Em conferência</span>}<h3>{product.name}</h3><p>{product.description || 'Veja os detalhes e opções deste item.'}</p><div className="product-card-price">{price === null ? <span>Preço em conferência</span> : <><small>{product.kind === 'pizza' ? 'A partir de' : ''}</small><strong>{brl(price)}</strong></>}{reason && !product.blocked && <span className="availability-label">Consulte os horários</span>}</div></div>
    <div className={`product-card-visual ${!product.image ? 'no-photo' : ''}`}>{product.image ? <img src={`/images/${product.sourceId}.webp`} alt="" loading="lazy" /> : <span aria-hidden="true"><Store size={26} strokeWidth={1} /><small>Passira</small></span>}<span className="add-circle" aria-hidden="true"><Plus size={19} /></span></div>
  </button>;
}
export function Storefront() {
  const [category, setCategory] = useState('274528');
  const [query, setQuery] = useState('');
  const [product, setProduct] = useState<Product | null>(null);
  const [editing, setEditing] = useState<CartItem | undefined>();
  const [checkout, setCheckout] = useState(false);
  const [information, setInformation] = useState(false);
  const [history, setHistory] = useState(false);
  const [toast, setToast] = useState('');
  const [ready, setReady] = useState(false);
  const [now, setNow] = useState(new Date());
  const items = useCart(s => s.items), orders = useCart(s => s.orders), clearOrders = useCart(s => s.clearOrders), method = useCart(s => s.method);
  useEffect(() => { useCart.persist.rehydrate(); setReady(true); const id = window.setInterval(() => setNow(new Date()), 30000); return () => window.clearInterval(id); }, []);
  useEffect(() => { if (!toast) return; const id = window.setTimeout(() => setToast(''), 3200); return () => window.clearTimeout(id); }, [toast]);
  const matching = useMemo(() => products.filter(p => p.enabled && categoryById[p.categoryId]?.enabled && (query ? normalize(`${p.name} ${p.description} ${categoryById[p.categoryId].name}`).includes(normalize(query)) : p.categoryId === category)).sort((a, b) => a.order - b.order), [category, query]);
  const count = ready ? items.reduce((n, i) => n + i.quantity, 0) : 0;
  const total = ready ? cartTotals(items, method, '').subtotal : 0;
  const selected = categoryById[category];
  const chooseCategory = (id: string) => { setCategory(id); setQuery(''); };
  const edit = (item: CartItem) => { const p = productById[item.productId]; if (p) { setCheckout(false); setProduct(p); setEditing(item); } };
  return <>
    <a className="skip-link" href="#cardapio">Ir para o cardápio</a>
    <div className="top-strip"><span>Tem sabor que reúne.</span><span>PASSIRA · SAN MARTIN, RECIFE</span></div>
    <header className="site-header"><div className="header-inner"><a href="#" className="brand" aria-label="Passira, início"><span className="brand-name">Passira<span className="brand-dot">®</span></span><span className="brand-location">SAN MARTIN</span></a><nav className="header-nav" aria-label="Menu principal"><a href="#cardapio" className="current">Cardápio</a><button onClick={() => setHistory(true)}><ReceiptText size={17} />Meus pedidos</button><button onClick={() => setInformation(true)}><Info size={17} />Sobre a Passira</button></nav><button className="header-cart" onClick={() => setCheckout(true)} aria-label={`Abrir carrinho, ${count} itens`}><ShoppingBag size={20} /><span>Meu pedido</span><b>{count}</b></button></div></header>
    <main>
      <div className="page-container">
        <section className="hero" aria-labelledby="hero-heading"><div className="hero-copy"><div className="hero-eyebrow"><span></span>BOA COMIDA. BOA COMPANHIA.</div><h1 id="hero-heading">O sabor de estar<br />bem <em>junto.</em></h1><p>Da pizza aos pratos para compartilhar.<br />Seu próximo bom momento começa aqui.</p><a href="#cardapio" className="button primary">Encontre seu favorito<ArrowDown size={17} /></a><div className="hero-bottom"><span><Pizza size={17} />Pizzas e muito mais</span><span><MapPin size={16} />San Martin · Recife</span></div></div><div className="hero-photo"><img src="/images/380034.webp" alt="Pizza Calabresa da Passira com uma fatia sendo servida" fetchPriority="high" /><div className="photo-caption"><span>UM CLÁSSICO DA PASSIRA</span><strong>Calabresa</strong><ArrowRight size={20} /></div></div></section>
        <div className="store-bar"><div className="store-status"><span className={`status-dot ${ready && !storeOpen(now) ? 'closed' : ''}`}></span><strong>{ready ? storeOpen(now) ? 'Atendimento até 23h15' : 'Fora do horário de atendimento' : 'Passira - San Martin'}</strong><span className="store-hours">Todos os dias, 10h às 23h15</span></div><button onClick={() => setInformation(true)}><MapPin size={16} /><span>Av. General San Martin, 1656</span><ChevronRight size={15} /></button><span className="store-estimate"><Clock3 size={16} />{method === 'pickup' ? 'Retirada: 30–40 min' : 'Entrega: 70–90 min'}</span></div>
        <div id="cardapio" className="menu-anchor"></div><div className="menu-toolbar"><div><span className="eyebrow">ESCOLHA. COMBINE. APROVEITE.</span><h2>O que a fome pede?</h2></div><label className="search-field"><Search size={20} /><input type="search" placeholder="Busque um prato, sabor ou bebida" value={query} onChange={e => setQuery(e.target.value)} aria-label="Buscar no cardápio" />{query && <button onClick={() => setQuery('')} aria-label="Limpar busca"><X size={17} /></button>}</label></div>
        <div className="menu-layout"><aside className="category-sidebar"><h2><SlidersHorizontal size={16} />Categorias</h2><nav aria-label="Categorias do cardápio">{availableCategories.map(c => <button key={c.id} className={category === c.id && !query ? 'active' : ''} aria-pressed={category === c.id && !query} onClick={() => chooseCategory(c.id)}><span>{c.name}</span><small>{products.filter(p => p.categoryId === c.id && p.enabled).length}</small></button>)}</nav><div className="sidebar-note"><Flame size={19} /><span>Tem pizza.<br />E tem muito mais.</span></div></aside>
          <div className="menu-content"><div className="mobile-categories"><label htmlFor="mobile-category">Categorias</label><select id="mobile-category" value={category} onChange={e => chooseCategory(e.target.value)}>{availableCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div><div className="category-title"><div><span className="section-number">{query ? 'BUSCA NO CARDÁPIO' : selected.kind === 'pizza' ? 'DO FORNO PARA VOCÊ' : 'DA NOSSA COZINHA'}</span><h2>{query ? 'Encontramos para você' : selected.name}<span>{matching.length}</span></h2></div>{!query && selected.kind === 'pizza' && <Pizza size={28} strokeWidth={1.3} />}</div>
            {!query && selected.id === '274528' && <p className="category-intro">Escolha seu tamanho e combine até 2 sabores nas pizzas Grande e Média. O valor é a média dos sabores escolhidos.</p>}
            {!query && !!selected.pending.length && <div className="notice"><Info size={18} /><p>{selected.pending.join(' ')}</p></div>}
            {query && <p className="category-intro">Resultados em todas as categorias para “{query}”.</p>}
            {matching.length ? <div className="product-grid">{matching.map(p => <ProductCard key={p.id} product={p} open={() => { setProduct(p); setEditing(undefined); }} />)}</div> : <div className="no-results"><Search size={32} strokeWidth={1.3} /><h3>Nenhum item por aqui.</h3><p>Tente outro nome, ingrediente ou categoria.</p><button className="text-button" onClick={() => setQuery('')}>Limpar pesquisa<ArrowRight size={16} /></button></div>}
            <div className="menu-end"><span className="brand-small">Passira</span><p>Bom mesmo é compartilhar.</p><a href="#cardapio">Voltar ao início do cardápio ↑</a></div>
          </div>
          <div className="desktop-cart">{ready ? <CartPanel checkout={() => setCheckout(true)} edit={edit} /> : <div className="cart-loading">Carregando seu pedido…</div>}</div>
        </div>
      </div>
    </main>
    <footer className="site-footer"><div className="page-container footer-content"><div className="footer-brand"><span className="brand-name">Passira</span><span>San Martin, Recife.</span></div><p><MapPin size={16} />{pickupAddress}</p><div><a href="/conferencia/">Cardápio e informações em conferência<ArrowRight size={14} /></a><small>Dados conferidos em 10/11/2026 · <a href="https://loja.neemo.com.br/passira-sanmartin" target="_blank" rel="noreferrer">Fonte do cardápio</a></small></div></div></footer>
    <button className="mobile-cart-bar" onClick={() => setCheckout(true)}><span className="mobile-cart-count">{count}</span><ShoppingBag size={19} /><strong>Ver meu pedido</strong><b>{brl(total)}</b><ChevronRight size={17} /></button>
    {toast && <div className="toast" role="status"><Check size={17} />{toast}</div>}
    {product && <ProductCustomizer key={editing?.id ?? product.id} product={product} edit={editing} close={() => { setProduct(null); setEditing(undefined); }} added={() => setToast(editing ? 'Item atualizado no seu pedido' : 'Adicionado ao seu pedido')} />}
    {checkout && <Checkout close={() => setCheckout(false)} edit={edit} />}
    {information && <Dialog title="Passira - San Martin" close={() => setInformation(false)}><div className="information-body"><span className="eyebrow">SUA PRÓXIMA PARADA</span><h3>Uma mesa em San Martin.</h3><div className="information-row"><MapPin size={22} /><div><strong>Endereço para retirada</strong><p>{pickupAddress}</p><p>{store.address.complement}</p></div></div><div className="information-row"><Clock3 size={22} /><div><strong>Todos os dias, 10h às 23h15</strong><p>Estimativa de retirada: 30 a 40 minutos.<br />Estimativa de entrega: 70 a 90 minutos.</p><small>Estimativas informadas no cardápio original. Confirme com a loja.</small></div></div><div className="information-row"><Info size={22} /><div><strong>Pagamento no recebimento</strong><p>Pix, cartão de débito ou crédito. Você só indica a forma de pagamento; nenhuma cobrança é feita pelo site.</p></div></div><a className="button secondary" href="/conferencia/">Ver conferência do cardápio<ArrowRight size={17} /></a></div></Dialog>}
    {history && <Dialog title="Meus pedidos" close={() => setHistory(false)} drawer><div className="drawer-body">{orders.length ? <><p className="helper">Resumos salvos neste navegador. A confirmação do pedido é feita pela pizzaria no WhatsApp.</p>{orders.map(o => <details className="history-order" key={o.id}><summary><ReceiptText size={18} /><span><strong>{o.id}</strong><small>{new Date(o.createdAt).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</small></span><strong>{brl(o.totalCents)}</strong></summary><OrderReceipt order={o} /></details>)}<button className="text-button" onClick={() => { if (window.confirm('Apagar os resumos salvos neste navegador?')) clearOrders(); }}>Apagar histórico deste navegador</button></> : <div className="no-results"><ReceiptText size={35} strokeWidth={1.2} /><h3>Seu próximo pedido começa aqui.</h3><p>Os resumos dos pedidos que você salvar aparecerão neste navegador.</p><button className="button primary" onClick={() => setHistory(false)}>Explorar cardápio<ArrowRight size={17} /></button></div>}</div></Dialog>}
  </>;
}
