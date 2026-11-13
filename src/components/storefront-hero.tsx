import Link from 'next/link';
import { ArrowDownRight, ArrowRight, Bike, MapPin, PackageSearch, Pizza } from 'lucide-react';
import type { StorefrontContent } from '@/lib/storefront-content';

export function StorefrontHero({ content }: { content: StorefrontContent['hero'] }) {
  return <section className="hero" aria-labelledby="hero-heading">
    <div className="hero-inner">
      <div className="hero-copy">
        <h1 id="hero-heading">{content.title}<br /><span>{content.accent}</span></h1>
        <div className="hero-actions">
          <a href="#cardapio" className="button primary">{content.button}<ArrowRight size={19} /></a>
          <Link href="/rastrear-pedido/" className="hero-track-order"><PackageSearch size={17} />Rastrear pedido</Link>
        </div>
      </div>
      <figure className="hero-feast">
        <div className="hero-pizza"><img src={content.image} alt={content.imageAlt} fetchPriority="high" decoding="async" width={1000} height={1250} /></div>
      </figure>
      <div className="hero-side-copy" aria-hidden="true"><span className="hero-pixels"><i /><i /><i /></span></div>
      <a href="#cardapio" className="hero-quick-order">{content.quickTitle}<strong>{content.quickButton}</strong><ArrowDownRight size={24} aria-hidden="true" /></a>
      <div className="hero-delivery-art" aria-hidden="true"><Pizza className="delivery-pizza" size={38} strokeWidth={1.4} /><Bike size={100} strokeWidth={1.2} /><span>{content.deliveryText}</span></div>
      <div className="hero-bottom"><span><MapPin size={14} />San Martin, Recife</span></div>
    </div>
  </section>;
}

export function StorefrontManifesto({ content }: { content: StorefrontContent['manifesto'] }) {
  return <section className="storefront-manifesto" aria-label="O sabor da Passira">
    <span className="manifesto-wordmark">{content.title}</span>
    <p>{content.body}<br /><strong>{content.accent}</strong></p>
    <a href="#cardapio">{content.button}<ArrowRight size={16} /></a>
    <img className="manifesto-photo manifesto-photo-pizza" src={content.leftImage} alt="" width={140} height={140} loading="lazy" decoding="async" />
    <img className="manifesto-photo manifesto-photo-dish" src={content.rightImage} alt="" width={140} height={140} loading="lazy" decoding="async" />
  </section>;
}
