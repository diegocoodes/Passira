'use client';
import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, ChevronRight, CreditCard, Download, MapPin, MessageCircle, Pencil, QrCode, ShoppingBag, Store, Trash2, Truck } from 'lucide-react';
import { productById } from '@/data/menu';
import { deliveryRegions } from '@/data/delivery';
import type { CartItem, Customer, Fulfillment, Order } from '@/data/types';
import { useCart } from '@/lib/cart';
import { brl, formatCep, formatPhone } from '@/lib/format';
import { cartTotals, itemDetails, storeOpen } from '@/lib/menu';
import { downloadOrder, paymentLabels, pickupAddress, validateCustomer, whatsappLink } from '@/lib/orders';
import { Dialog } from './dialog';
import { Quantity } from './quantity';

export function MethodChoice() {
  const method = useCart(s => s.method), setMethod = useCart(s => s.setMethod);
  return <div className="method-choice" role="group" aria-label="Como receber seu pedido">{(['pickup', 'delivery'] as Fulfillment[]).map(m => <button type="button" key={m} className={method === m ? 'active' : ''} aria-pressed={method === m} onClick={() => setMethod(m)}>{m === 'pickup' ? <Store size={17} /> : <Truck size={17} />}{m === 'pickup' ? 'Retirada' : 'Entrega'}</button>)}</div>;
}
export function CartRows({ edit }: { edit: (item: CartItem) => void }) {
  const items = useCart(s => s.items), method = useCart(s => s.method), quantity = useCart(s => s.quantity), remove = useCart(s => s.remove);
  const totals = cartTotals(items, method, '');
  return <div className="cart-rows">{totals.rows.map(({ item, cents, error }) => { const p = productById[item.productId]; return <article className="cart-row" key={item.id}>
    <div className="cart-row-top"><strong>{p?.name ?? 'Produto indisponível'}</strong><button className="icon-button small" aria-label={`Remover ${p?.name ?? 'item'}`} onClick={() => remove(item.id)}><Trash2 size={16} /></button></div>
    <div className="cart-item-details">{itemDetails(item).map((t, i) => <p key={i}>{t}</p>)}</div>{error && <p className="form-error">{error}</p>}
    <div className="cart-row-bottom"><div className="row-actions"><Quantity value={item.quantity} label={`quantidade de ${p?.name.trim() ?? 'item'}`} change={n => quantity(item.id, n)} />{p && <button className="text-button" onClick={() => edit(item)} aria-label={`Editar ${p.name.trim()}`}><Pencil size={14} /></button>}</div><strong>{cents === null ? 'Revisar' : brl(cents * item.quantity)}</strong></div>
  </article>; })}</div>;
}
export function EmptyCart() { return <div className="empty-cart"><div className="empty-icon"><ShoppingBag size={31} strokeWidth={1.2} /></div><h3>O que vai ser hoje?</h3><p>Escolha seus favoritos no cardápio.<br />A gente cuida do sabor.</p></div>; }
export function CartSummary({ neighborhood = '' }: { neighborhood?: string }) {
  const items = useCart(s => s.items), method = useCart(s => s.method);
  const totals = cartTotals(items, method, neighborhood);
  return <div className="cart-summary"><div><span>Subtotal</span><span>{brl(totals.subtotal)}</span></div><div><span>{method === 'pickup' ? 'Retirada no balcão' : 'Taxa de entrega'}</span><span>{totals.fee === null ? 'A definir' : totals.fee === 0 ? 'Sem taxa' : brl(totals.fee)}</span></div><div className="summary-total"><strong>Total</strong><strong>{totals.total === null ? 'A confirmar' : brl(totals.total)}</strong></div>{method === 'delivery' && totals.fee === null && <p className="helper">A taxa precisa estar definida para seu bairro antes de confirmar a entrega.</p>}</div>;
}
export function CartPanel({ checkout, edit }: { checkout: () => void; edit: (item: CartItem) => void }) {
  const items = useCart(s => s.items), method = useCart(s => s.method);
  return <aside className="cart-panel"><div className="cart-panel-title"><ShoppingBag size={20} /><h2>Seu pedido</h2><span className="count">{items.reduce((n, i) => n + i.quantity, 0)}</span></div><MethodChoice />{items.length ? <><CartRows edit={edit} /><CartSummary /><button className="button primary full-width" onClick={checkout}>Continuar pedido<ArrowRight size={18} /></button></> : <EmptyCart />}<div className="pickup-note"><MapPin size={17} /><div><strong>{method === 'pickup' ? 'Retire na Passira' : 'Entrega para você'}</strong><p>{method === 'pickup' ? 'Av. General San Martin, 1656' : 'Consulte a disponibilidade do seu bairro.'}</p></div></div><p className="payment-note"><CreditCard size={15} />Pagamento {method === 'pickup' ? 'na retirada' : 'no recebimento'}</p></aside>;
}
const blankCustomer: Customer = { name: '', phone: '', cep: '', street: '', number: '', neighborhood: '', complement: '', note: '', payment: 'pix' };
export function Checkout({ close, edit }: { close: () => void; edit: (item: CartItem) => void }) {
  const items = useCart(s => s.items), method = useCart(s => s.method), saveOrder = useCart(s => s.saveOrder);
  const [step, setStep] = useState<'cart' | 'details' | 'review'>('cart');
  const [customer, setCustomer] = useState<Customer>(blankCustomer);
  const [error, setError] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
  const [now, setNow] = useState(new Date());
  useEffect(() => { const id = window.setInterval(() => setNow(new Date()), 30000); return () => window.clearInterval(id); }, []);
  const totals = cartTotals(items, method, customer.neighborhood, now);
  const setField = (key: keyof Customer, value: string) => { setCustomer(c => ({ ...c, [key]: value })); setError(''); };
  const validate = () => {
    const customerError = validateCustomer(customer, method === 'delivery');
    if (customerError) return customerError;
    if (!items.length) return 'Seu carrinho está vazio.';
    if (totals.hasErrors) return 'Revise os itens indisponíveis no carrinho.';
    if (totals.fee === null) return 'A taxa de entrega deste bairro ainda não foi definida. Selecione retirada para continuar.';
    if (!storeOpen()) return 'A pizzaria está fora do horário de atendimento (10h às 23h15). Volte durante o funcionamento para finalizar.';
    return null;
  };
  const confirm = () => {
    const reason = validate(); if (reason) { setError(reason); return; }
    const fresh = cartTotals(items, method, customer.neighborhood);
    if (fresh.total === null || fresh.hasErrors) { setError('O cardápio mudou. Revise seu pedido.'); return; }
    const finalCustomer = { ...customer, name: customer.name.trim(), phone: formatPhone(customer.phone), note: customer.note.trim() };
    if (method === 'pickup') Object.assign(finalCustomer, { cep: '', street: '', number: '', neighborhood: '', complement: '' });
    const saved: Order = { id: `PS-${crypto.randomUUID().slice(0, 8).toUpperCase()}`, createdAt: new Date().toISOString(), status: 'saved-locally', fulfillment: method, customer: finalCustomer, items: fresh.rows.map(r => ({ configuration: r.item, title: productById[r.item.productId].name, details: itemDetails(r.item), unitCents: r.cents! })), subtotalCents: fresh.subtotal, deliveryCents: fresh.fee!, totalCents: fresh.total };
    saveOrder(saved); setOrder(saved);
  };
  if (order) return <Dialog title="Seu pedido está pronto para enviar" close={close} drawer><OrderReceipt order={order} /><div className="drawer-footer"><button className="button secondary full-width" onClick={close}>Voltar ao cardápio</button></div></Dialog>;
  return <Dialog title={step === 'cart' ? 'Seu pedido' : step === 'details' ? 'Como vamos preparar seu pedido?' : 'Confira seu pedido'} close={close} drawer>
    <div className="checkout-steps" aria-label="Etapas do pedido">{['Carrinho', 'Seus dados', 'Conferência'].map((s, i) => <span className={i <= ['cart', 'details', 'review'].indexOf(step) ? 'active' : ''} key={s}><b>{i + 1}</b>{s}</span>)}</div>
    <div className="drawer-body">
      {step === 'cart' && <><MethodChoice />{items.length ? <CartRows edit={edit} /> : <EmptyCart />}<CartSummary />{totals.hasErrors && <p className="form-error">Há itens que precisam ser revisados.</p>}</>}
      {step === 'details' && <form id="customer-form" onSubmit={e => { e.preventDefault(); const reason = validate(); if (reason) setError(reason); else { setError(''); setStep('review'); } }}><MethodChoice /><div className="notice neutral"><MapPin size={19} /><div><strong>{method === 'pickup' ? 'Retirada no estabelecimento' : 'Endereço de entrega'}</strong><p>{method === 'pickup' ? pickupAddress : 'Preencha seu endereço. A taxa será apresentada antes da confirmação.'}</p>{method === 'pickup' && <p>Prox. a Praça de eventos</p>}</div></div>
        <div className="form-grid"><label className="field span-two"><span>Seu nome</span><input name="name" autoComplete="name" required minLength={2} maxLength={100} value={customer.name} onChange={e => setField('name', e.target.value)} placeholder="Como podemos chamar você?" /></label><label className="field span-two"><span>Telefone com DDD</span><input name="phone" type="tel" inputMode="tel" autoComplete="tel-national" required maxLength={15} value={customer.phone} onChange={e => setField('phone', formatPhone(e.target.value))} placeholder="(81) 99999-9999" /></label>
          {method === 'delivery' && <><label className="field span-two"><span>CEP</span><input name="cep" inputMode="numeric" autoComplete="postal-code" required pattern="[0-9]{5}-[0-9]{3}" value={customer.cep} onChange={e => setField('cep', formatCep(e.target.value))} placeholder="00000-000" /></label><label className="field span-two"><span>Endereço</span><input name="street" autoComplete="address-line1" required minLength={2} maxLength={150} value={customer.street} onChange={e => setField('street', e.target.value)} placeholder="Rua ou avenida" /></label><label className="field"><span>Número</span><input name="number" required maxLength={20} value={customer.number} onChange={e => setField('number', e.target.value)} placeholder="Número ou S/N" /></label><label className="field"><span>Bairro</span><input name="neighborhood" required minLength={2} maxLength={100} list="neighborhoods" value={customer.neighborhood} onChange={e => setField('neighborhood', e.target.value)} placeholder="Seu bairro" /><datalist id="neighborhoods">{deliveryRegions.flatMap(r => r.neighborhoods.map(n => <option key={r.id + n} value={n} />))}</datalist></label><label className="field span-two"><span>Complemento <small>opcional</small></span><input name="complement" autoComplete="address-line2" maxLength={150} value={customer.complement} onChange={e => setField('complement', e.target.value)} placeholder="Apartamento, bloco, ponto de referência" /></label></>}
        </div><fieldset className="option-section"><legend>Pagamento {method === 'pickup' ? 'na retirada' : 'no recebimento'}</legend><p className="helper">Selecione como pretende pagar. Nenhum valor será cobrado agora.</p><div className="payment-options">{(['pix', 'debit', 'credit'] as const).map(payment => <label key={payment} className={customer.payment === payment ? 'selected' : ''}><input type="radio" name="payment" value={payment} checked={customer.payment === payment} onChange={() => setField('payment', payment)} />{payment === 'pix' ? <QrCode size={20} /> : <CreditCard size={20} />}<span>{paymentLabels[payment]}</span>{customer.payment === payment && <Check size={16} />}</label>)}</div></fieldset><label className="field"><span>Observação do pedido <small>opcional</small></span><textarea name="note" maxLength={1000} rows={3} value={customer.note} onChange={e => setField('note', e.target.value)} placeholder="Algo que a equipe precisa saber?" /></label><CartSummary neighborhood={customer.neighborhood} />
      </form>}
      {step === 'review' && <><div className="review-block"><span className="eyebrow">{method === 'pickup' ? 'RETIRADA NO BALCÃO' : 'ENTREGA'}</span><h3>{customer.name}</h3><p>{customer.phone}</p><p>{method === 'pickup' ? pickupAddress : `${customer.street}, ${customer.number} · ${customer.neighborhood} · ${customer.cep}${customer.complement ? ' · ' + customer.complement : ''}`}</p></div><CartRows edit={edit} /><div className="review-block"><strong>{paymentLabels[customer.payment]}</strong><p>Pagamento {method === 'pickup' ? 'na retirada' : 'no recebimento'}. Sem cobrança online.</p>{customer.note && <p>Observação: {customer.note}</p>}</div><CartSummary neighborhood={customer.neighborhood} /><p className="helper">O pedido será salvo neste navegador. Na próxima tela, envie o resumo pelo WhatsApp e aguarde a confirmação da pizzaria.</p></>}
      {error && <p className="form-error" role="alert">{error}</p>}
    </div><footer className="drawer-footer">{step !== 'cart' && <button className="text-button back" onClick={() => { setStep(step === 'review' ? 'details' : 'cart'); setError(''); }}><ArrowLeft size={16} />Voltar</button>}{step === 'cart' ? <button className="button primary full-width" disabled={!items.length || totals.hasErrors} onClick={() => setStep('details')}>Continuar<ArrowRight size={18} /></button> : step === 'details' ? <button type="submit" form="customer-form" className="button primary full-width">Conferir pedido<ChevronRight size={18} /></button> : <button className="button primary full-width" onClick={confirm}>Salvar pedido · {totals.total === null ? 'A confirmar' : brl(totals.total)}<Check size={18} /></button>}</footer>
  </Dialog>;
}
export function OrderReceipt({ order }: { order: Order }) {
  return <div className="receipt"><div className="receipt-icon"><Check size={30} /></div><span className="eyebrow">SALVO NESTE NAVEGADOR</span><h3>Falta só enviar à Passira.</h3><p>Seu pedido <strong>{order.id}</strong> está salvo. Envie o resumo pelo WhatsApp e aguarde a confirmação da pizzaria.</p><div className="receipt-lines">{order.items.map(i => <div key={i.configuration.id}><span>{i.configuration.quantity}× {i.title}</span><strong>{brl(i.configuration.quantity * i.unitCents)}</strong></div>)}<div className="receipt-total"><strong>Total</strong><strong>{brl(order.totalCents)}</strong></div></div><p><strong>{paymentLabels[order.customer.payment]}</strong> · {order.fulfillment === 'pickup' ? 'Na retirada' : 'No recebimento'}</p>{order.fulfillment === 'pickup' && <p className="receipt-address"><MapPin size={17} />{pickupAddress}</p>}<a className="button primary full-width" href={whatsappLink(order)} target="_blank" rel="noopener noreferrer"><MessageCircle size={19} />Enviar pelo WhatsApp<ArrowRight size={18} /></a><button className="button secondary full-width" onClick={() => downloadOrder(order)}><Download size={18} />Baixar resumo</button><p className="helper">Salvar ou abrir o WhatsApp não confirma o pedido. A confirmação depende da resposta da loja.</p></div>;
}
