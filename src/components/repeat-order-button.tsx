'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RotateCcw } from 'lucide-react';
import type { Order } from '@/data/types';
import { useCart } from '@/lib/cart';
import { prepareRepeatOrder } from '@/lib/repeat-order';
import { useMenu } from './menu-provider';

export function RepeatOrderButton({ order }: { order: Order }) {
  const catalog = useMenu();
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const repeat = () => {
    if (busy) return;
    setBusy(true);
    const cart = useCart.getState();
    const method = cart.items.length ? cart.method : order.fulfillment;
    const result = prepareRepeatOrder(order, catalog, method);
    const unavailable = result.skipped.map(item => `${item.name}: ${item.reason}`).join(' ');
    if (!result.items.length) { setMessage(unavailable || 'Escolha os itens novamente no cardápio.'); setBusy(false); return; }
    cart.appendItems(result.items, method, `Pedido adicionado com os preços atuais.${unavailable ? ` Alguns itens não foram adicionados. ${unavailable}` : ' Confira as opções antes de concluir.'}`);
    router.push('/finalizar/');
  };
  return <div className="repeat-order"><button type="button" className="button secondary full-width" disabled={busy} onClick={repeat}><RotateCcw size={17} />Pedir novamente</button><small>Preços e disponibilidade são conferidos novamente.</small>{message && <p role="status" className="helper">{message}</p>}</div>;
}
