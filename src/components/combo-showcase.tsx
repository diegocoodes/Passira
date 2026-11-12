'use client';
import Link from 'next/link';
import { ArrowUpRight, Check, Pizza } from 'lucide-react';
import { useMenu } from './menu-provider';
import { useCart } from '@/lib/cart';
import { brl } from '@/lib/format';
import { getProductImage } from '@/data/illustrative-images';
import { comboOffer } from '@/lib/combo-offer';

export function ComboShowcase() {
  const catalog = useMenu();
  const method = useCart(state => state.method);
  const offer = comboOffer(catalog, method);
  if (!offer) return null;
  const { product, price, options } = offer;
  const base = options.filter(option => option.cents === 0);
  const extra = options.filter(option => option.cents !== null && option.cents > 0);
  const photo = getProductImage(product);
  return <section className="combo-showcase" aria-labelledby="combo-heading">
    <div className="combo-photo"><img src={photo.src} alt="" loading="lazy" decoding="async" width={640} height={480} />{photo.illustrative && <span className="photo-label">Foto ilustrativa</span>}<span className="combo-photo-label"><Pizza size={16} />Duas pizzas no mesmo pedido</span></div>
    <div className="combo-copy"><p className="section-kicker">Para compartilhar</p><h2 id="combo-heading">Pizza em dobro.</h2><p>O combo reúne duas pizzas grandes. Escolha dois sabores inteiros, iguais ou diferentes.</p>
      <ul><li><Check size={16} />2 pizzas grandes</li><li><Check size={16} />2 escolhas de sabor</li><li><Check size={16} />Valores atualizados no cardápio</li></ul>
      {!!base.length && <p className="combo-options"><strong>Sem acréscimo:</strong> {base.map(option => option.name.trim()).join(', ')}.</p>}
      {!!extra.length && <details className="combo-extras"><summary>Sabores com acréscimo</summary><ul>{extra.map(option => <li key={option.id}>{option.name}<strong>+ {brl(option.cents!)} por pizza</strong></li>)}</ul></details>}
      <div className="combo-bottom"><p><small>O combo a partir de</small><strong>{brl(price)}</strong></p><Link className="button primary" href={`/produto/${product.id}/`} prefetch={false}>Montar meu combo<ArrowUpRight size={18} /></Link></div><small className="combo-note">{catalog.availability(product.id) || 'O total depende dos sabores e adicionais escolhidos.'}</small>
    </div>
  </section>;
}
