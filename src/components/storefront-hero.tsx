import Link from 'next/link';
import { ArrowDownRight, ArrowRight, Bike, MapPin, PackageSearch, Pizza } from 'lucide-react';

export function StorefrontHero() {
  return <section className="hero" aria-labelledby="hero-heading">
    <div className="hero-inner">
      <div className="hero-copy">
        <h1 id="hero-heading">Sabor que<br />chega<br /><span>até você.</span></h1>
        <div className="hero-actions">
          <a href="#cardapio" className="button primary">Ver cardápio<ArrowRight size={19} /></a>
          <Link href="/rastrear-pedido/" className="hero-track-order"><PackageSearch size={17} />Rastrear pedido</Link>
        </div>
      </div>
      <figure className="hero-feast">
        <div className="hero-pizza"><img src="/images/campaign/passira-delivery.webp" alt="Composição ilustrativa de uma mão segurando uma caixa vermelha com pizza" fetchPriority="high" decoding="async" width={1000} height={1250} /></div>
        <figcaption className="hero-image-note">Imagem ilustrativa</figcaption>
      </figure>
      <div className="hero-side-copy" aria-hidden="true"><span className="hero-pixels"><i /><i /><i /></span></div>
      <a href="#cardapio" className="hero-quick-order">Bateu a fome?<strong>Peça aqui</strong><ArrowDownRight size={24} aria-hidden="true" /></a>
      <div className="hero-delivery-art" aria-hidden="true"><Pizza className="delivery-pizza" size={38} strokeWidth={1.4} /><Bike size={100} strokeWidth={1.2} /><span>Seu sabor favorito<br />está a caminho.</span></div>
      <div className="hero-bottom"><span><MapPin size={14} />San Martin, Recife</span><span className="hero-food-tags"><span>Pizzas</span><span>Pratos</span><span>Petiscos</span></span></div>
    </div>
  </section>;
}

export function StorefrontManifesto() {
  return <section className="storefront-manifesto" aria-label="O sabor da Passira">
    <span className="manifesto-wordmark">Passira.</span>
    <p>Pizza para dividir. Pratos para reunir.<br />O sabor dos seus bons momentos,<br /><strong>agora na sua mesa.</strong></p>
    <a href="#cardapio">Encontre seu favorito<ArrowRight size={16} /></a>
    <img className="manifesto-photo manifesto-photo-pizza" src="/images/380075.webp" alt="" width={140} height={140} loading="lazy" decoding="async" />
    <img className="manifesto-photo manifesto-photo-dish" src="/images/2169126.webp" alt="" width={140} height={140} loading="lazy" decoding="async" />
  </section>;
}
