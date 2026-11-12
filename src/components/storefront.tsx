'use client';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowRight, ArrowUp, ChevronRight, Clock3, Info, MapPin, Plus, ReceiptText, Search, ShoppingBag, X } from 'lucide-react';
import { useMenu } from './menu-provider';
import { getProductImage } from '@/data/illustrative-images';
import store from '@/data/store.json';
import type { Product } from '@/data/types';
import { useCart } from '@/lib/cart';
import { brl, normalize } from '@/lib/format';
import { storeOpen } from '@/lib/menu';
import { pickupAddress } from '@/lib/orders';
import { CartPanel, OrderReceipt } from './cart';
import { CategoryNavigation } from './category-navigation';
import { BrandLogo } from './brand-logo';
import { Dialog } from './dialog';
import { RestaurantStory } from './restaurant-story';
import { CustomerReviews } from './customer-reviews';
import { StorefrontHero, StorefrontManifesto } from './storefront-hero';



const selectionLabels: Record<string, string> = {
  'flavor-380075': 'Para compartilhar',
  'item-2169126': 'Um almoço especial',
  'item-2172833': 'Para reunir a mesa',
};

function ProductCard({ product, featured = false, at }: { product: Product; featured?: boolean; at?: Date }) {
  const { minimumPrice, availability } = useMenu();
  const method = useCart(s => s.method);
  const price = product.blocked ? null : minimumPrice(product.id, method);
  const reason = at ? availability(product.id, at) : null;
  const photo = getProductImage(product);
  return <Link href={`/produto/${product.id}/`} prefetch={false} className={`product-card ${product.blocked ? 'needs-review' : ''} ${featured ? 'featured-product' : ''} ${product.categoryId === '274513' ? 'product-card-drink' : ''}`} aria-label={`Ver ${product.name.trim()}`}>
    <div className="product-card-visual"><img src={photo.src} alt="" loading="lazy" decoding="async" draggable={false} width={640} height={480} />{featured && <span className="featured-product-label">{selectionLabels[product.id] || 'Seleção da casa'}</span>}{photo.illustrative && <span className="photo-label">Foto ilustrativa</span>}{product.blocked && <span className="review-label">Em conferência</span>}</div>
    <div className="product-card-copy"><h3>{product.name}</h3><p>{product.description || 'Veja as opções disponíveis.'}</p><div className="product-card-bottom"><div className="product-card-price">{price === null ? <span>Preço em conferência</span> : <>{product.kind === 'pizza' && <small>A partir de</small>}<strong>{brl(price)}</strong></>}{reason && !product.blocked && <span className="availability-label">Consulte os horários</span>}</div><span className="add-circle" aria-hidden="true"><Plus size={18} /><span>Adicionar</span></span></div></div>
  </Link>;
}
export function Storefront() {
  const { categoryById, productById, products, cartTotals } = useMenu();
  const houseSelection = ['flavor-380075', 'item-2169126', 'item-2172833'].map(id => productById[id]).filter(product => product?.enabled && !product.blocked);
  const [category, setCategory] = useState('274528');
  const [query, setQuery] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [information, setInformation] = useState(false);
  const [history, setHistory] = useState(false);
  const [ready, setReady] = useState(false);
  const [now, setNow] = useState(new Date());
  const items = useCart(s => s.items), orders = useCart(s => s.orders), clearOrders = useCart(s => s.clearOrders), method = useCart(s => s.method);
  useEffect(() => { useCart.persist.rehydrate(); setReady(true); const requestedCategory = new URLSearchParams(window.location.search).get('categoria'); if (requestedCategory && categoryById[requestedCategory]?.enabled) setCategory(requestedCategory); const id = window.setInterval(() => setNow(new Date()), 30000); return () => window.clearInterval(id); }, []);
  const matching = useMemo(() => products.filter(p => p.enabled && categoryById[p.categoryId]?.enabled && (query ? normalize(`${p.name} ${p.description} ${categoryById[p.categoryId].name}`).includes(normalize(query)) : p.categoryId === category)).sort((a, b) => a.order - b.order), [category, query, products, categoryById]);
  const visibleProducts = showAll ? matching : matching.slice(0, 6);
  const count = ready ? items.reduce((n, i) => n + i.quantity, 0) : 0;
  const total = ready ? cartTotals(items, method, '').subtotal : 0;
  const selected = categoryById[category];
  const chooseCategory = (id: string) => { setCategory(id); setQuery(''); setShowAll(false); };
  const searchMenu = (value: string) => { setQuery(value); setShowAll(false); };
  return <div className="passira-storefront">
    <a className="skip-link" href="#cardapio">Ir para o cardápio</a>
    <div className="top-strip"><span>Passira San Martin</span><span>Todos os dias, 10h às 23h15</span></div>
    <header className="site-header"><div className="header-inner"><a href="#" className="brand" aria-label="Passira, início"><BrandLogo /></a><nav className="header-nav" aria-label="Menu principal"><a href="#cardapio" className="current">Cardápio</a><a href="#a-passira">A Passira</a><a href="#avaliacoes">Avaliações</a><button onClick={() => setHistory(true)}><ReceiptText size={17} />Meus pedidos</button><button className="store-information-button" onClick={() => setInformation(true)} aria-label="Informações da loja"><Info size={17} /></button></nav><Link href="/finalizar/" className="header-cart" aria-label={`Abrir carrinho, ${count} itens`}><ShoppingBag size={20} /><span>Meu pedido</span><b>{count}</b></Link></div></header>
    <main className="storefront-main">
      <StorefrontHero />
      <div className="store-bar"><div className="store-status"><span className={`status-dot ${ready && !storeOpen(now) ? 'closed' : ''}`}></span><strong>{ready ? storeOpen(now) ? 'Atendimento até 23h15' : 'Fora do horário de atendimento' : 'Passira San Martin'}</strong><span className="store-hours">Todos os dias, 10h às 23h15</span></div><button onClick={() => setInformation(true)}><MapPin size={16} /><span>Av. General San Martin, 1656</span><ChevronRight size={15} /></button><span className="store-estimate"><Clock3 size={16} />{method === 'pickup' ? 'Retirada: 30 a 40 min' : 'Entrega: 70 a 90 min'}</span></div>
      <div className="page-container">
        <nav className="section-jump-links" aria-label="Seções da página"><a href="#cardapio">Cardápio</a><a href="#destaques">Destaques</a><a href="#a-passira">A Passira</a><a href="#avaliacoes">Avaliações</a></nav>
        <section className="menu-section" aria-label="Cardápio Passira"><div id="cardapio" className="menu-anchor"></div><div className="menu-toolbar"><div><p className="section-kicker">Feito para dar água na boca</p><h2>Nosso cardápio.</h2></div><label className="search-field"><Search size={20} /><input type="search" placeholder="Buscar prato, pizza ou ingrediente" value={query} onChange={e => searchMenu(e.target.value)} aria-label="Buscar no cardápio" />{query && <button onClick={() => searchMenu('')} aria-label="Limpar busca"><X size={17} /></button>}</label></div>
        <CategoryNavigation selected={query ? null : category} choose={chooseCategory} />
        <div className="menu-layout">
          <div className="menu-content"><div className="category-title"><h2>{query ? 'Resultados da busca' : selected.name}<span>{matching.length} {matching.length === 1 ? 'opção' : 'opções'}</span></h2></div>
            {!query && selected.id === '274528' && <p className="category-intro">Escolha seu tamanho e combine até 2 sabores nas pizzas Grande e Média. O valor é a média dos sabores escolhidos.</p>}
            {!query && !!selected.pending.length && <div className="notice"><Info size={18} /><p>{selected.pending.join(' ')}</p></div>}
            {query && <p className="category-intro">Resultados em todas as categorias para “{query}”.</p>}
            {matching.length ? <>
              <div className="product-grid" id="menu-products">
                {visibleProducts.map(p => <ProductCard key={p.id} product={p} at={ready ? now : undefined} />)}
              </div>
              <div className="menu-pagination">
                <p aria-live="polite">Mostrando <strong>{visibleProducts.length}</strong> de {matching.length} {matching.length === 1 ? 'opção' : 'opções'}</p>
                {matching.length > 6 && <button className="button menu-show-more" aria-expanded={showAll} aria-controls="menu-products" onClick={() => setShowAll(value => !value)}>
                  {showAll ? 'Ver menos' : 'Ver mais'}{showAll ? <ArrowUp size={18} /> : <ArrowDown size={18} />}
                </button>}
              </div>
            </> : <div className="no-results"><Search size={32} strokeWidth={1.3} /><h3>Nenhum item por aqui.</h3><p>Tente outro nome, ingrediente ou categoria.</p><button className="text-button" onClick={() => searchMenu('')}>Limpar pesquisa<ArrowRight size={16} /></button></div>}
            <div className="menu-end"><a href="#cardapio">Voltar às categorias ↑</a></div>
          </div>
          <div className="desktop-cart">{ready ? <CartPanel /> : <div className="cart-loading">Carregando seu pedido…</div>}</div>
        </div></section>
        <StorefrontManifesto />
        <section className="house-selection" id="destaques" aria-labelledby="selection-heading">
          <div className="section-heading"><div><p className="section-kicker">Para abrir o apetite</p><h2 id="selection-heading">Boas escolhas.<br /><span>Melhores momentos.</span></h2></div><a className="section-link" href="#cardapio">Explorar o cardápio<ArrowRight size={18} /></a></div>
          <p className="section-intro">Da primeira fatia ao almoço em família. Sabores da casa para inspirar o seu pedido.</p>
          <div className="selection-grid">{houseSelection.map(p => <ProductCard key={p.id} product={p} featured at={ready ? now : undefined} />)}</div>
        </section>
        <RestaurantStory />
        <CustomerReviews />
      </div>
    </main>
    <footer className="site-footer"><div className="page-container footer-content"><div className="footer-brand"><a href="#" className="footer-logo" aria-label="Passira, início"><BrandLogo /></a><span>Pizzaria e restaurante em San Martin, Recife.</span></div><p><MapPin size={19} />{pickupAddress}</p><div><a href="/conferencia/">Cardápio e informações em conferência<ArrowRight size={14} /></a><small>Dados conferidos em 10/11/2026 · <a href="https://loja.neemo.com.br/passira-sanmartin" target="_blank" rel="noreferrer">Fonte do cardápio</a></small><small>Imagens complementares ilustrativas · <a href="/images/illustrative/credits.html" target="_blank" rel="noreferrer">Créditos das fotos</a></small></div></div></footer>
    <Link href="/finalizar/" className="mobile-cart-bar"><span className="mobile-cart-count">{count}</span><ShoppingBag size={19} /><strong>Ver meu pedido</strong><b>{brl(total)}</b><ChevronRight size={17} /></Link>
    {information && <Dialog title="Passira San Martin" close={() => setInformation(false)}><div className="information-body"><h3>Informações da loja</h3><div className="information-row"><MapPin size={22} /><div><strong>Endereço para retirada</strong><p>{pickupAddress}</p><p>{store.address.complement}</p></div></div><div className="information-row"><Clock3 size={22} /><div><strong>Todos os dias, 10h às 23h15</strong><p>Estimativa de retirada: 30 a 40 minutos.<br />Estimativa de entrega: 70 a 90 minutos.</p><small>Estimativas informadas no cardápio original. Confirme com a loja.</small></div></div><div className="information-row"><Info size={22} /><div><strong>Pagamento no recebimento</strong><p>Pix, cartão de débito ou crédito. Você só indica a forma de pagamento; nenhuma cobrança é feita pelo site.</p></div></div><a className="button secondary" href="/conferencia/">Ver conferência do cardápio<ArrowRight size={17} /></a></div></Dialog>}
    {history && <Dialog title="Meus pedidos" close={() => setHistory(false)} drawer><div className="drawer-body">{orders.length ? <><p className="helper">Pedidos deste navegador. Abra o acompanhamento para ver a aceitação e as etapas do preparo.</p>{orders.map(o => <details className="history-order" key={o.id}><summary><ReceiptText size={18} /><span><strong>{o.id}</strong><small>{new Date(o.createdAt).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</small></span><strong>{brl(o.totalCents)}</strong></summary><OrderReceipt order={o} /></details>)}<button className="text-button" onClick={() => { if (window.confirm('Apagar os resumos salvos neste navegador?')) clearOrders(); }}>Apagar histórico deste navegador</button></> : <div className="no-results"><ReceiptText size={35} strokeWidth={1.2} /><h3>Nenhum pedido salvo</h3><p>Os resumos dos pedidos que você salvar aparecerão neste navegador.</p><button className="button primary" onClick={() => setHistory(false)}>Ver cardápio<ArrowRight size={17} /></button></div>}</div></Dialog>}
  </div>;
}
