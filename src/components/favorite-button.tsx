'use client';
import { Heart } from 'lucide-react';
import { useCart } from '@/lib/cart';

export function FavoriteButton({ productId, ready, compact = true }: { productId: string; ready: boolean; compact?: boolean }) {
  const selected = useCart(state => state.favoriteIds.includes(productId));
  const toggle = useCart(state => state.toggleFavorite);
  const active = ready && selected;
  return <button type="button" className={`favorite-toggle ${active ? 'is-favorite' : ''} ${compact ? 'compact' : ''}`} aria-pressed={active} aria-label={active ? 'Remover dos favoritos' : 'Salvar nos favoritos'} onClick={() => toggle(productId)}><Heart size={19} fill={active ? 'currentColor' : 'none'} aria-hidden="true" />{!compact && <span>{active ? 'Salvo nos favoritos' : 'Salvar nos favoritos'}</span>}</button>;
}
