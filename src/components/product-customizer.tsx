'use client';
import { useEffect, useRef, useState } from 'react';
import { AlertCircle, ArrowRight, Check, ChefHat, Pizza, Plus, UtensilsCrossed } from 'lucide-react';
import { useMenu } from './menu-provider';
import { getProductImage } from '@/data/illustrative-images';
import type { CartItem, GroupSelection, ItemConfiguration, Product } from '@/data/types';
import { useCart } from '@/lib/cart';
import { brl } from '@/lib/format';

import { Quantity } from './quantity';
import { MethodChoice } from './cart';

export function ProductCustomizer({ product, edit, added }: { product: Product; edit?: CartItem; added: (configuration: ItemConfiguration, quantity: number) => void }) {
  const { additions, categoryById, groupById, prices, productPrices, products, sizeById, availability, calculateItem, priceFor, requiredGroups } = useMenu();
  const method = useCart(s => s.method), add = useCart(s => s.add);
  const variants = productPrices(product.id);
  const [config, setConfig] = useState<ItemConfiguration>(edit ?? { productId: product.id, priceId: variants[0]?.id ?? '', flavorIds: product.kind === 'pizza' ? [product.id] : [], selections: [], note: '' });
  const [quantity, setQuantity] = useState(edit?.quantity ?? 1);
  const [tried, setTried] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const errorMessage = useRef<HTMLParagraphElement>(null);
  const price = prices.find(v => v.id === config.priceId);
  const size = price?.sizeId ? sizeById[price.sizeId] : null;
  const groupRequirements = requiredGroups(config);
  const calculation = calculateItem(config, method);
  const unavailable = availability(product.id);
  const photo = getProductImage(product);
  useEffect(() => { heading.current?.focus({ preventScroll: true }); }, []);
  useEffect(() => {
    if (tried && calculation.error) {
      errorMessage.current?.focus({ preventScroll: true });
      errorMessage.current?.scrollIntoView({ block: 'center', behavior: 'instant' });
    }
  }, [tried, calculation.error]);
  const flavors = products.filter(p => p.categoryId === product.categoryId && p.id !== product.id && p.enabled && !p.blocked && prices.some(v => v.productId === p.id && v.sizeId === size?.id && v.enabled && priceFor(v.id, method) !== null));
  const setOption = (requirement: typeof groupRequirements[number], aid: string, q: number, single = false) => {
    setTried(false);
    setConfig(c => {
      const existing = c.selections.find(s => s.scope === requirement.scope && s.ownerId === requirement.ownerId && s.groupId === requirement.groupId);
      const quantities = single ? { [aid]: q } : { ...(existing?.quantities ?? {}), [aid]: q };
      const selection: GroupSelection = { scope: requirement.scope, ownerId: requirement.ownerId, groupId: requirement.groupId, quantities };
      return { ...c, selections: [...c.selections.filter(s => !(s.scope === requirement.scope && s.ownerId === requirement.ownerId && s.groupId === requirement.groupId)), selection] };
    });
  };
  return <form className="product-detail" onSubmit={event => { event.preventDefault(); setTried(true); if (calculateItem(config, method).cents === null) return; add(config, quantity, edit?.id); added(config, quantity); }}>
    <div className={`product-detail-visual ${product.categoryId === '274513' ? 'product-detail-drink' : ''}`}>
      <div className="product-cover-wrap"><span className="product-photo-badge"><UtensilsCrossed size={15} />Passira San Martin</span><img className="product-cover" src={photo.src} alt={`${photo.illustrative ? 'Foto ilustrativa de ' : ''}${product.name.trim()}`} width={640} height={480} fetchPriority="high" decoding="async" />{photo.illustrative && <span className="photo-label">Foto ilustrativa</span>}</div>
      <div className="product-detail-caption"><ChefHat size={28} strokeWidth={1.5} /><p><strong>Seu próximo favorito.</strong><span>Escolha os detalhes. A gente cuida do sabor.</span></p></div>
    </div>
      <div className="customizer-body"><div className="product-detail-heading"><span className="eyebrow">{categoryById[product.categoryId]?.name}</span><h1 className="product-title" ref={heading} tabIndex={-1}>{product.name}</h1><p className="description full">{product.description || 'Escolha as opções abaixo para montar seu pedido.'}</p></div>
        <div className="product-fulfillment"><span>Como você quer receber?</span><MethodChoice /></div>
        {!!product.pending.length && <div className="notice"><AlertCircle size={18} /><div>{product.pending.map((s, i) => <p key={i}>{s}</p>)}</div></div>}
        <fieldset className="option-section"><legend>{product.kind === 'pizza' ? '1. Escolha o tamanho' : variants.length > 1 ? 'Escolha uma opção' : 'Preço do item'}</legend><div className="size-options">{variants.map(v => {
          const value = priceFor(v.id, method);
          return <label key={v.id} className={`size-option ${config.priceId === v.id ? 'selected' : ''}`}><input type="radio" name="size" checked={config.priceId === v.id} disabled={value === null} onChange={() => { setConfig(c => ({ ...c, priceId: v.id, flavorIds: product.kind === 'pizza' ? [product.id] : [], selections: [] })); setTried(false); }} /><span><strong>{v.name}</strong><small>{value === null ? 'Indisponível' : brl(value)}</small></span>{config.priceId === v.id && <Check size={17} />}</label>;
        })}</div></fieldset>
        {product.kind === 'pizza' && size && <section className="option-section"><h2>2. Escolha os sabores</h2><p className="helper">{size.maxFlavors > 1 ? `Até ${size.maxFlavors} sabores. O preço é a média dos sabores escolhidos.` : 'Este tamanho permite apenas 1 sabor.'}</p><div className="chosen-flavor"><Pizza size={19} /><span>{product.name}</span><span>{price && priceFor(price.id, method) !== null ? brl(priceFor(price.id, method)!) : 'A confirmar'}</span></div>
          {size.maxFlavors > 1 && <label className="field"><span>Segundo sabor <small>opcional</small></span><select value={config.flavorIds[1] ?? ''} onChange={e => { setConfig(c => ({ ...c, flavorIds: e.target.value ? [product.id, e.target.value] : [product.id], selections: [] })); setTried(false); }}><option value="">Manter somente {product.name.trim()}</option>{flavors.map(f => { const fp = prices.find(v => v.productId === f.id && v.sizeId === size.id); return <option key={f.id} value={f.id}>{f.name.trim()} · {fp && brl(priceFor(fp.id, method)!)}</option>; })}</select></label>}
        </section>}
        {groupRequirements.map(r => {
          const group = groupById[r.groupId];
          const choices = additions.filter(a => group.additionIds.includes(a.id) && a.enabled);
          const selected = config.selections.find(s => s.scope === r.scope && s.ownerId === r.ownerId && s.groupId === r.groupId)?.quantities ?? {};
          const count = Object.values(selected).reduce((n, q) => n + q, 0);
          return <fieldset className={`option-section ${count >= group.min && count <= group.max ? 'options-complete' : ''}`} key={r.key}><legend>{group.name} <span className="requirement">{group.min ? 'Obrigatório' : 'Opcional'}</span></legend>{config.flavorIds.length > 1 && <p className="helper">Para {r.ownerName}</p>}<p className="helper">{group.min === group.max ? `Escolha ${group.min} opção(ões)` : `Escolha de ${group.min} a ${group.max} opções`}{group.allowRepeated ? ' · Pode repetir' : ''} <span className="choice-count">{count}/{group.max}</span></p>
            {choices.map(a => <div className="addition-row" key={a.id}>{group.allowRepeated ? <><div><strong>{a.name}</strong>{a.description && <small>{a.description}</small>}<small>{a.cents === null ? 'Preço pendente' : a.cents > 0 ? `+ ${brl(a.cents)}` : 'Incluído'}</small></div><Quantity label={a.name.trim()} value={selected[a.id] ?? 0} min={0} max={count >= group.max ? selected[a.id] ?? 0 : group.max} change={n => setOption(r, a.id, n)} /></> : <label><input type={group.max === 1 && group.min === 1 ? 'radio' : 'checkbox'} name={r.key} checked={(selected[a.id] ?? 0) > 0} disabled={a.cents === null || (!(selected[a.id] ?? 0) && count >= group.max && group.max > 1)} onChange={e => setOption(r, a.id, e.target.checked ? 1 : 0, group.max === 1)} /><span><strong>{a.name}</strong>{a.description && <small>{a.description}</small>}</span><small>{a.cents === null ? 'Pendente' : a.cents > 0 ? `+ ${brl(a.cents)}` : 'Incluído'}</small></label>}</div>)}
          </fieldset>;
        })}
        <label className="field option-section"><span id="product-note-label">Alguma observação? <small>opcional</small></span><textarea aria-labelledby="product-note-label" maxLength={500} value={config.note} onChange={e => setConfig(c => ({ ...c, note: e.target.value }))} placeholder="Ex.: sem cebola, por favor" rows={2} /></label>
        {(unavailable || (tried && calculation.error)) && <p className="form-error" role="alert" ref={errorMessage} tabIndex={-1}>{unavailable || calculation.error}</p>}
      </div>
    <footer className="customizer-footer"><div className="product-quantity"><span>Quantidade</span><Quantity value={quantity} change={setQuantity} /></div><div className="product-line-total" aria-live="polite" aria-atomic="true"><span>Total deste item</span><strong>{calculation.cents === null ? 'Escolha as opções' : brl(calculation.cents * quantity)}</strong><small>{method === 'delivery' ? 'Taxa de entrega no checkout' : 'Retirada sem taxa'}</small></div><button type="submit" className="button primary grow" disabled={!!unavailable || !variants.length}>{edit ? <Check size={18} /> : <Plus size={18} />}<span>{edit ? 'Salvar alterações' : 'Adicionar ao carrinho'}</span><ArrowRight size={18} /></button></footer>
  </form>;
}
