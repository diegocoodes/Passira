'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowLeft, MapPin, ShoppingBag } from 'lucide-react';
import { productById } from '@/data/menu';
import type { CartItem } from '@/data/types';
import { useCart } from '@/lib/cart';
import { pickupAddress } from '@/lib/orders';
import { Checkout } from './cart';
import { ProductCustomizer } from './product-customizer';
import { BrandLogo } from './brand-logo';

export function CheckoutPage() {
  const [ready, setReady] = useState(false);
  const [editing, setEditing] = useState<CartItem | null>(null);

  useEffect(() => {
    let mounted = true;
    Promise.resolve(useCart.persist.rehydrate()).then(() => { if (mounted) setReady(true); });
    return () => { mounted = false; };
  }, []);

  return <div className="checkout-page">
    <header className="site-header"><div className="header-inner"><Link href="/" className="brand" aria-label="Passira, início"><BrandLogo /></Link><Link href="/#cardapio" className="checkout-back"><ArrowLeft size={18} /><span>Voltar ao cardápio</span></Link></div></header>
    <main className="checkout-container">
      <div className="checkout-intro"><h1>Finalizar pedido</h1><p>Confira os itens, escolha como receber e preencha seus dados.</p></div>
      {ready ? <Checkout edit={setEditing} /> : <div className="checkout-loading" role="status"><ShoppingBag size={28} /><p>Carregando seu pedido…</p></div>}
      <footer className="checkout-page-footer"><Link href="/" aria-label="Passira, início"><BrandLogo /></Link><p><MapPin size={15} />{pickupAddress}</p></footer>
    </main>
    {editing && productById[editing.productId] && <ProductCustomizer key={editing.id} product={productById[editing.productId]} edit={editing} close={() => setEditing(null)} added={() => {}} />}
  </div>;
}
