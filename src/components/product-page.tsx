'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, ShoppingBag } from 'lucide-react';
import type { Product } from '@/data/types';
import { useCart } from '@/lib/cart';
import { BrandLogo } from './brand-logo';
import { ProductCustomizer } from './product-customizer';
import { FavoriteButton } from './favorite-button';

export function ProductPage({ product }: { product: Product }) {
  const searchParams = useSearchParams();
  const editId = searchParams.get('editar');
  const items = useCart(state => state.items);
  const [ready, setReady] = useState(false);
  const [completed, setCompleted] = useState(false);
  const confirmation = useRef<HTMLHeadingElement>(null);
  const edit = items.find(item => item.id === editId && item.productId === product.id);
  const menuHref = `/?categoria=${encodeURIComponent(product.categoryId)}#cardapio`;
  const count = ready ? items.reduce((sum, item) => sum + item.quantity, 0) : 0;

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
    <header className="site-header"><div className="header-inner">
      <Link href="/" className="brand" aria-label="Passira, início"><BrandLogo /></Link>
      <Link href="/finalizar/" className="header-cart" aria-label={`Abrir carrinho, ${count} itens`}><ShoppingBag size={20} /><span>Meu pedido</span><b key={count} className="cart-count-feedback">{count}</b></Link>
    </div></header>
    <main id="produto" className="product-page-container">
      <div className="product-page-tools"><Link href={editId ? '/finalizar/' : menuHref} className="checkout-back"><ArrowLeft size={18} />{editId ? 'Voltar ao carrinho' : 'Voltar ao cardápio'}</Link><FavoriteButton productId={product.id} ready={ready} compact={false} /></div>
      {!ready ? <div className="checkout-loading" role="status">Carregando produto…</div> : completed ? <section className="product-added" aria-labelledby="product-added-title">
        <div className="product-added-icon" aria-hidden="true"><Check size={32} /></div>
        <p className="eyebrow">SEU PEDIDO ESTÁ SENDO MONTADO</p>
        <h1 id="product-added-title" ref={confirmation} tabIndex={-1}>{editId ? 'Item atualizado!' : 'Adicionado ao carrinho!'}</h1>
        <p>{product.name.trim()} já está no seu pedido. Você pode escolher mais produtos ou seguir para o carrinho.</p>
        <div className="product-added-actions"><Link href={menuHref} className="button primary">Adicionar mais produtos<ArrowRight size={18} /></Link><Link href="/finalizar/" className="button secondary"><ShoppingBag size={18} />Ver carrinho</Link></div>
      </section> : editId && !edit ? <section className="product-added">
        <h1>Este item não está mais no carrinho</h1><p>Volte ao cardápio para montar seu pedido.</p><Link href={menuHref} className="button primary">Voltar ao cardápio<ArrowRight size={18} /></Link>
      </section> : <ProductCustomizer key={`${product.id}:${editId ?? 'novo'}`} product={product} edit={edit} added={() => setCompleted(true)} />}
    </main>
  </div>;
}
