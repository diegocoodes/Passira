'use client';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowRight, ArrowUp, ChevronRight, Clock3, Heart, Info, Leaf, MapPin, Pizza, Plus, ReceiptText, Search, ShoppingBag, Trophy, X } from 'lucide-react';
import { useMenu } from './menu-provider';
import { getProductImage } from '@/data/illustrative-images';
import store from '@/data/store.json';
import type { Product } from '@/data/types';
import type { StorefrontContent } from '@/lib/storefront-content';
import { useCart } from '@/lib/cart';
import { brl, normalize } from '@/lib/format';
import { pickupAddress } from '@/lib/orders';
import { CartPanel, OrderReceipt } from './cart';
import { CategoryNavigation } from './category-navigation';
import { BrandLogo } from './brand-logo';
import { Dialog } from './dialog';
import { RestaurantStory, RestaurantPhotoCredits } from './restaurant-story';
import { CustomerReviews } from './customer-reviews';
import { StorefrontHero, StorefrontManifesto } from './storefront-hero';
import { FavoriteButton } from './favorite-button';
import { useRevealMotion } from './use-reveal-motion';
import { StorefrontOpening } from './storefront-opening';

function ProductCard({ product, featured = false, at, id }: { product: Product; featured?: boolean; at?: Date; id?: string }) {
  const { minimumPrice, availability, bestSellerIds } = useMenu();
  const method = useCart(s => s.method);
  const price = product.blocked ? null : minimumPrice(product.id, method);
  const reason = at ? availability(product.id, at) : null;
  const photo = getProductImage(product);
  return <article id={id} tabIndex={id ? -1 : undefined} className={`product-card ${product.blocked ? 'needs-review' : ''} ${featured ? 'featured-product' : ''} ${product.categoryId === '274513' ? 'product-card-drink' : ''}`}><Link href={`/produto/${product.id}/`} prefetch={false} className="product-card-link" aria-label={`Ver ${product.name.trim()}`}>
    <div className="product-card-visual"><img src={photo.src} alt="" loading="lazy" decoding="async" draggable={false} width={640} height={480} />{bestSellerIds.includes(product.id) && <span className="best-seller-label" title="Entre os três produtos mais vendidos em pedidos concluídos nos últimos 30 dias"><Trophy size={13} />Mais pedidos</span>}{photo.illustrative && <span className="photo-label">Foto ilustrativa</span>}{product.blocked && <span className="review-label">Em conferência</span>}</div>
    <div className="product-card-copy"><h3>{product.name}</h3><p>{product.description || 'Veja as opções disponíveis.'}</p><div className="product-card-bottom"><div className="product-card-price">{price === null ? <span>Preço em conferência</span> : <>{product.kind === 'pizza' && <small>A partir de</small>}<strong>{brl(price)}</strong></>}{reason && !product.blocked && <span className="availability-label">Consulte os horários</span>}</div><span className="add-circle" aria-hidden="true"><Plus size={18} /><span>Adicionar</span></span></div></div>
  </Link><FavoriteButton productId={product.id} ready={!!at} /></article>;
}
export function Storefront({ content }: { content: StorefrontContent }) {
  const { availableCategories, categoryById, productById, products, cartTotals } = useMenu();
  const houseSelection = content.selection.productIds.map(id => productById[id]).filter(product => product?.enabled && !product.blocked && categoryById[product.categoryId]?.enabled);
  const [category, setCategory] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [scrollTarget, setScrollTarget] = useState<string | null>(null);
  const initialLocationRead = useRef(false);
  const favoriteIds = useCart(state => state.favoriteIds);
  const root = useRef<HTMLDivElement>(null);
  useRevealMotion(root);
  const [information, setInformation] = useState(false);
  const [history, setHistory] = useState(false);
  const [ready, setReady] = useState(false);
  const [now, setNow] = useState(new Date());
  const items = useCart(s => s.items), orders = useCart(s => s.orders), clearOrders = useCart(s => s.clearOrders), method = useCart(s => s.method);
  useEffect(() => { useCart.persist.rehydrate(); setReady(true); const id = window.setInterval(() => setNow(new Date()), 30000); return () => window.clearInterval(id); }, []);
  useEffect(() => {
    const readLocation = (event?: Event) => {
      const url = new URL(window.location.href);
      const requested = url.hash.startsWith('#categoria-') ? url.hash.slice('#categoria-'.length) : !event && (!url.hash || url.hash === '#cardapio') ? url.searchParams.get('categoria') : null;
      if (requested && categoryById[requested]?.enabled) {
        setCategory(requested); setQuery(''); setFavoritesOnly(false); setShowAll(true); setScrollTarget(`categoria-${requested}`);
      } else if (event && !url.hash.startsWith('#categoria-')) {
        setCategory(null);
        if (url.searchParams.has('categoria')) { url.searchParams.delete('categoria'); window.history.replaceState(window.history.state, '', url); }
      }
    };
    if (!initialLocationRead.current) { initialLocationRead.current = true; readLocation(); }
    window.addEventListener('popstate', readLocation); window.addEventListener('hashchange', readLocation);
    return () => { window.removeEventListener('popstate', readLocation); window.removeEventListener('hashchange', readLocation); };
  }, [categoryById]);
  const searchTerm = normalize(query).trim();
  const matching = useMemo(() => availableCategories.flatMap(group => products.filter(p => p.enabled && p.categoryId === group.id && (!favoritesOnly || (ready && favoriteIds.includes(p.id))) && (!searchTerm || normalize(`${p.name} ${p.description} ${group.name}`).includes(searchTerm))).sort((a, b) => a.order - b.order)), [searchTerm, products, availableCategories, favoritesOnly, favoriteIds, ready]);
  const visibleProducts = showAll ? matching : matching.slice(0, 10);
  const filtering = !!searchTerm || favoritesOnly;
  const visibleGroups = availableCategories.map(group => ({ category: group, products: visibleProducts.filter(product => product.categoryId === group.id) })).filter(group => group.products.length || (showAll && group.category.id === category));
  useEffect(() => {
    if (!scrollTarget) return;
    const frame = window.requestAnimationFrame(() => {
      const element = document.getElementById(scrollTarget) || document.getElementById('cardapio');
      element?.focus({ preventScroll: true });
      element?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
      setScrollTarget(null);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [scrollTarget, showAll, filtering]);
  const count = ready ? items.reduce((n, i) => n + i.quantity, 0) : 0;
  const total = ready ? cartTotals(items, method, '').subtotal : 0;
  const clearCategoryLocation = () => {
    setCategory(null);
    const url = new URL(window.location.href);
    if (!url.searchParams.has('categoria') && !url.hash.startsWith('#categoria-')) return;
    url.searchParams.delete('categoria'); if (url.hash.startsWith('#categoria-')) url.hash = 'cardapio';
    window.history.replaceState(window.history.state, '', url);
  };
  const chooseCategory = (id: string) => {
    setCategory(id); setQuery(''); setShowAll(true); setFavoritesOnly(false); setScrollTarget(`categoria-${id}`);
    const url = new URL(window.location.href); url.searchParams.set('categoria', id); url.hash = `categoria-${id}`;
    window.history.replaceState(window.history.state, '', url);
  };
  const searchMenu = (value: string) => { setQuery(value); setShowAll(false); setScrollTarget(null); clearCategoryLocation(); };
  const toggleProducts = () => {
    setShowAll(!showAll);
    if (showAll) { clearCategoryLocation(); setScrollTarget('cardapio'); }
    else if (matching[10]) setScrollTarget(`cardapio-produto-${matching[10].id}`);
  };
  return <div className="passira-storefront" ref={root}>
    <StorefrontOpening />
    <a className="skip-link" href="#cardapio">Ir para o cardápio</a>
    <div className="top-strip"><span>Passira San Martin</span><span>Todos os dias, 10h às 23h15</span></div>
    <header className="site-header"><div className="header-inner"><a href="#" className="brand" aria-label="Passira, início"><BrandLogo /></a><nav className="header-nav" aria-label="Menu principal"><a href="#cardapio" className="current">Cardápio</a><a href="#a-passira">A Passira</a><a href="#avaliacoes">Avaliações</a><button onClick={() => setHistory(true)}><ReceiptText size={17} />Meus pedidos</button><button className="store-information-button" onClick={() => setInformation(true)} aria-label="Informações da loja"><Info size={17} /></button></nav><Link href="/finalizar/" className="header-cart" aria-label={`Abrir carrinho, ${count} itens`}><ShoppingBag size={20} /><span>Meu pedido</span><b key={count} className="cart-count-feedback">{count}</b></Link></div></header>
    <main className="storefront-main">
      <StorefrontHero content={content.hero} />
      <div className="page-container">
        <nav className="section-jump-links" aria-label="Seções da página"><a href="#cardapio">Cardápio</a>{!!houseSelection.length && <a href="#destaques">Destaques</a>}<a href="#a-passira">A Passira</a><a href="#avaliacoes">Avaliações</a></nav>
        <section className="menu-section" aria-label="Cardápio Passira"><div id="cardapio" className="menu-anchor" tabIndex={-1}></div><div className="menu-toolbar"><div><p className="section-kicker">{content.menu.kicker}</p><h2>{content.menu.title}</h2></div><div className="menu-discovery-tools"><label className="search-field"><Search size={20} /><input type="search" placeholder="Buscar prato, pizza ou ingrediente" value={query} onChange={e => searchMenu(e.target.value)} aria-label="Buscar no cardápio" />{query && <button onClick={() => searchMenu('')} aria-label="Limpar busca"><X size={17} /></button>}</label><button className="favorites-filter" aria-pressed={favoritesOnly} onClick={() => { setFavoritesOnly(value => !value); setShowAll(false); setScrollTarget(null); clearCategoryLocation(); }}><Heart size={16} fill={favoritesOnly ? 'currentColor' : 'none'} />Favoritos<span>{ready ? favoriteIds.length : 0}</span></button></div></div>
        <CategoryNavigation selected={filtering ? null : category} choose={chooseCategory} />
        <div className="menu-layout">
          <div className="menu-content">
            {filtering && <div className="category-title"><h2>{favoritesOnly ? 'Seus favoritos' : 'Resultados da busca'}<span>{matching.length} {matching.length === 1 ? 'opção' : 'opções'}</span></h2></div>}
            {searchTerm && <p className="category-intro">Resultados em todas as categorias para “{query}”.</p>}
            {matching.length ? <>
              <div className={filtering ? 'product-grid' : 'menu-category-list'} id="menu-products">
                {filtering ? visibleProducts.map(p => <ProductCard key={p.id} product={p} id={`cardapio-produto-${p.id}`} at={ready ? now : undefined} />) : visibleGroups.map(group => <section className="menu-category" id={`categoria-${group.category.id}`} key={group.category.id} aria-labelledby={`categoria-titulo-${group.category.id}`} tabIndex={-1}>
                  <div className="category-title"><h2 id={`categoria-titulo-${group.category.id}`}>{group.category.name}<span>{group.products.length} {group.products.length === 1 ? 'opção' : 'opções'}</span></h2></div>
                  {group.category.id === '274528' && <p className="category-intro">Escolha seu tamanho e combine até 2 sabores nas pizzas Grande e Média. O valor é a média dos sabores escolhidos.</p>}
                  {!!group.category.pending.length && <div className="notice"><Info size={18} /><p>{group.category.pending.join(' ')}</p></div>}
                  <div className="product-grid">{group.products.map(p => <ProductCard key={p.id} product={p} id={`cardapio-produto-${p.id}`} at={ready ? now : undefined} />)}</div>
                  {!group.products.length && <p className="category-intro">Nenhum produto disponível nesta categoria no momento.</p>}
                </section>)}
              </div>
              <div className="menu-pagination">
                <p aria-live="polite">Mostrando <strong>{visibleProducts.length}</strong> de {matching.length} {matching.length === 1 ? 'opção' : 'opções'}</p>
                {matching.length > 10 && <button className="button menu-show-more" aria-expanded={showAll} aria-controls="menu-products" onClick={toggleProducts}>
                  {showAll ? 'Ver menos' : 'Ver mais'}{showAll ? <ArrowUp size={18} /> : <ArrowDown size={18} />}
                </button>}
              </div>
            </> : favoritesOnly ? <div className="no-results"><Heart size={32} strokeWidth={1.3} /><h3>{query ? 'Nenhum favorito nesta busca.' : 'Seus favoritos ficam aqui.'}</h3><p>Toque no coração de um prato para salvá-lo neste navegador.</p><button className="text-button" onClick={() => { setFavoritesOnly(false); searchMenu(''); }}>Explorar o cardápio<ArrowRight size={16} /></button></div> : <div className="no-results"><Search size={32} strokeWidth={1.3} /><h3>Nenhum item por aqui.</h3><p>Tente outro nome, ingrediente ou categoria.</p><button className="text-button" onClick={() => searchMenu('')}>Limpar pesquisa<ArrowRight size={16} /></button></div>}
            <div className="menu-end"><a href="#cardapio">Voltar às categorias ↑</a></div>
          </div>
          <div className="desktop-cart">{ready ? <CartPanel /> : <div className="cart-loading">Carregando seu pedido…</div>}</div>
        </div></section>
        <StorefrontManifesto content={content.manifesto} />
        {!!houseSelection.length && <section className="house-selection" id="destaques" aria-labelledby="selection-heading">
          <div className="selection-ornament selection-ornament-left" aria-hidden="true"><Pizza size={184} strokeWidth={1} /><Leaf size={72} strokeWidth={1} /></div>
          <div className="selection-ornament selection-ornament-right" aria-hidden="true"><Pizza size={184} strokeWidth={1} /><Leaf size={72} strokeWidth={1} /></div>
          <div className="section-heading"><div><p className="section-kicker">{content.selection.kicker}</p><h2 id="selection-heading">{content.selection.title}</h2></div></div>
          <div className="selection-grid">{houseSelection.map(p => <ProductCard key={p.id} product={p} featured at={ready ? now : undefined} />)}</div>
          <div className="selection-action"><a className="section-link" href="#cardapio">{content.selection.button}<ArrowRight size={18} /></a></div>
        </section>}
      </div>
      <RestaurantStory content={content.story} />
      <CustomerReviews />
    </main>
    <footer className="site-footer"><div className="page-container footer-content"><div className="footer-brand"><a href="#" className="footer-logo" aria-label="Passira, início"><BrandLogo /></a><span>{content.footer.description}</span></div><p><MapPin size={19} />{pickupAddress}</p><div><a href="/conferencia/">Cardápio e informações em conferência<ArrowRight size={14} /></a><small>Dados conferidos em 10/11/2026 · <a href="https://loja.neemo.com.br/passira-sanmartin" target="_blank" rel="noreferrer">Fonte do cardápio</a></small><small>Imagens complementares ilustrativas · <a href="/images/illustrative/credits.html" target="_blank" rel="noreferrer">Créditos das fotos</a></small><RestaurantPhotoCredits image={content.story.image} /></div></div></footer>
    <Link href="/finalizar/" className="mobile-cart-bar"><span className="mobile-cart-count">{count}</span><ShoppingBag size={19} /><strong>Ver meu pedido</strong><b>{brl(total)}</b><ChevronRight size={17} /></Link>
    {information && <Dialog title="Passira San Martin" close={() => setInformation(false)}><div className="information-body"><h3>Informações da loja</h3><div className="information-row"><MapPin size={22} /><div><strong>Endereço para retirada</strong><p>{pickupAddress}</p><p>{store.address.complement}</p></div></div><div className="information-row"><Clock3 size={22} /><div><strong>Todos os dias, 10h às 23h15</strong><p>Estimativa de retirada: 30 a 40 minutos.<br />Estimativa de entrega: 70 a 90 minutos.</p><small>Estimativas informadas no cardápio original. Confirme com a loja.</small></div></div><div className="information-row"><Info size={22} /><div><strong>Pagamento no recebimento</strong><p>Pix, cartão de débito ou crédito. Você só indica a forma de pagamento; nenhuma cobrança é feita pelo site.</p></div></div><a className="button secondary" href="/conferencia/">Ver conferência do cardápio<ArrowRight size={17} /></a></div></Dialog>}
    {history && <Dialog title="Meus pedidos" close={() => setHistory(false)} drawer><div className="drawer-body">{orders.length ? <><p className="helper">Pedidos deste navegador. Abra o acompanhamento para ver a aceitação e as etapas do preparo.</p>{orders.map(o => <details className="history-order" key={o.id}><summary><ReceiptText size={18} /><span><strong>{o.id}</strong><small>{new Date(o.createdAt).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</small></span><strong>{brl(o.totalCents)}</strong></summary><OrderReceipt order={o} /></details>)}<button className="text-button" onClick={() => { if (window.confirm('Apagar os resumos salvos neste navegador?')) clearOrders(); }}>Apagar histórico deste navegador</button></> : <div className="no-results"><ReceiptText size={35} strokeWidth={1.2} /><h3>Nenhum pedido salvo</h3><p>Os resumos dos pedidos que você salvar aparecerão neste navegador.</p><button className="button primary" onClick={() => setHistory(false)}>Ver cardápio<ArrowRight size={17} /></button></div>}</div></Dialog>}
  </div>;
}
