'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, ShoppingBag, UtensilsCrossed } from 'lucide-react';
import type { ItemConfiguration, Product } from '@/data/types';
import { getProductImage } from '@/data/illustrative-images';
import { brl } from '@/lib/format';
import { useCart } from '@/lib/cart';
import { BrandLogo } from './brand-logo';
import { ProductCustomizer } from './product-customizer';
import { FavoriteButton } from './favorite-button';
import { useMenu } from './menu-provider';

export function ProductPage({ product }: { product: Product }) {
  const searchParams = useSearchParams();
  const editId = searchParams.get('editar');
  const items = useCart(state => state.items);
  const [ready, setReady] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [addedItem, setAddedItem] = useState<{ configuration: ItemConfiguration; quantity: number } | null>(null);
  const { calculateItem, cartTotals, itemDetails } = useMenu();
  const method = useCart(state => state.method);
  const confirmation = useRef<HTMLHeadingElement>(null);
  const edit = items.find(item => item.id === editId && item.productId === product.id);
  const menuHref = `/?categoria=${encodeURIComponent(product.categoryId)}#cardapio`;
  const count = ready ? items.reduce((sum, item) => sum + item.quantity, 0) : 0;
  const photo = getProductImage(product);
  const addedPrice = addedItem ? calculateItem(addedItem.configuration, method).cents : null;
  const totals = cartTotals(items, method, '');

  useEffect(() => {
    let mounted = true;
    Promise.resolve(useCart.persist.rehydrate()).then(() => { if (mounted) setReady(true); });
    return () => { mounted = false; };
  }, []);

  useEffect(() => { setCompleted(false); }, [editId]);
  useEffect(() => {
    if (completed) {
      confirmation.current?.focus({ preventScroll: true });
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [completed]);

  return <div className="product-page">
    <a href="#produto" className="skip-link">Ir para o produto</a>
    <div className="product-brand-strip"><span>Passira San Martin</span><span>O sabor dos seus bons momentos</span></div>
    <header className="site-header"><div className="header-inner">
      <Link href="/" className="brand" aria-label="Passira, início"><BrandLogo /></Link>
      <Link href="/finalizar/" className="header-cart" aria-label={`Abrir carrinho, ${count} itens`}><ShoppingBag size={20} /><span>Meu pedido</span><b key={count} className="cart-count-feedback">{count}</b></Link>
    </div></header>
    <main id="produto" className="product-page-container">
      <div className="product-page-tools"><Link href={editId ? '/finalizar/' : menuHref} className="checkout-back"><ArrowLeft size={18} />{editId ? 'Voltar ao carrinho' : 'Voltar ao cardápio'}</Link><FavoriteButton productId={product.id} ready={ready} compact={false} /></div>
      {!ready ? <div className="checkout-loading" role="status">Carregando produto…</div> : completed ? <section className="product-added" aria-labelledby="product-added-title">
        <div className="product-added-layout"><div className="product-added-visual"><span className="eyebrow">BOA ESCOLHA.</span><img src={photo.src} alt={`${photo.illustrative ? 'Foto ilustrativa de ' : ''}${product.name.trim()}`} width={640} height={480} />{photo.illustrative && <small>Foto ilustrativa</small>}<p>Mais sabor.<br /><strong>Mais Passira.</strong></p></div><div className="product-added-content">
          <div className="product-added-icon" aria-hidden="true"><Check size={28} /></div>
          <p className="eyebrow">SEU PEDIDO ESTÁ SENDO MONTADO</p>
          <h1 id="product-added-title" ref={confirmation} tabIndex={-1}>{editId ? 'Item atualizado!' : 'Adicionado ao carrinho!'}</h1>
          <div className="product-added-item"><div><h2>{addedItem?.quantity ?? 1}× {product.name.trim()}</h2>{addedItem && <ul>{itemDetails(addedItem.configuration).map((detail, index) => <li key={index}>{detail}</li>)}</ul>}</div>{addedPrice !== null && addedItem && <strong>{brl(addedPrice * addedItem.quantity)}</strong>}</div>
          <div className="product-added-subtotal"><span>{count} {count === 1 ? 'item no pedido' : 'itens no pedido'}<small>Subtotal sem taxa de entrega</small></span><strong>{totals.hasErrors ? 'A conferir' : brl(totals.subtotal)}</strong></div>
          <div className="product-added-actions"><Link href="/finalizar/?etapa=dados" className="button primary">Finalizar meu pedido<ArrowRight size={18} /></Link><Link href={menuHref} className="button secondary"><UtensilsCrossed size={17} />Adicionar mais produtos</Link><Link href="/finalizar/" className="product-view-cart"><ShoppingBag size={16} />Ver carrinho</Link></div>
          <p className="product-added-note">Na próxima etapa, informe seus dados e confira o pedido antes de enviar à loja.</p>
        </div></div>
      </section> : editId && !edit ? <section className="product-added">
        <h1>Este item não está mais no carrinho</h1><p>Volte ao cardápio para montar seu pedido.</p><Link href={menuHref} className="button primary">Voltar ao cardápio<ArrowRight size={18} /></Link>
      </section> : <ProductCustomizer key={`${product.id}:${editId ?? 'novo'}`} product={product} edit={edit} added={(configuration, quantity) => { setAddedItem({ configuration, quantity }); setCompleted(true); }} />}
    </main>
  </div>;
}
