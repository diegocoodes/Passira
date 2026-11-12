'use client';
import { Info, X } from 'lucide-react';
import { useCart } from '@/lib/cart';

export function CartNotice() {
  const notice = useCart(state => state.notice);
  const dismiss = useCart(state => state.dismissNotice);
  if (!notice) return null;
  return <div className="cart-notice" role="status"><Info size={18} /><p>{notice}</p><button type="button" onClick={dismiss} aria-label="Fechar aviso"><X size={17} /></button></div>;
}
