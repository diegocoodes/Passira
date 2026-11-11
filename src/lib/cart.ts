'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem, Customer, Fulfillment, ItemConfiguration, Order } from '@/data/types';
type CartState = {
  items: CartItem[]; method: Fulfillment; orders: Order[];
  add: (item: ItemConfiguration, quantity: number, editId?: string) => void;
  quantity: (id: string, q: number) => void; remove: (id: string) => void;
  setMethod: (method: Fulfillment) => void; saveOrder: (order: Order) => void;
  clearOrders: () => void;
  customerDraft: Customer | null; setCustomerDraft: (customer: Customer) => void;
};
export const useCart = create<CartState>()(persist((set) => ({
  items: [], method: 'pickup', orders: [], customerDraft: null,
  setCustomerDraft: customerDraft => set({ customerDraft }),
  add: (item, quantity, editId) => set(state => {
    const q = Math.max(1, Math.min(99, Math.trunc(quantity)));
    if (editId) return { items: state.items.map(i => i.id === editId ? { ...item, id: editId, quantity: q } : i) };
    return { items: [...state.items, { ...item, id: crypto.randomUUID(), quantity: q }] };
  }),
  quantity: (id, q) => set(state => ({ items: state.items.map(i => i.id === id ? { ...i, quantity: Math.max(1, Math.min(99, Math.trunc(q))) } : i) })),
  remove: id => set(state => ({ items: state.items.filter(i => i.id !== id) })),
  setMethod: method => set({ method }),
  saveOrder: order => set(state => ({ orders: [order, ...state.orders].slice(0, 20), items: [], customerDraft: null })),
  clearOrders: () => set({ orders: [] }),
}), { name: 'passira-cart-v1', version: 1, skipHydration: true, partialize: s => ({ items: s.items, method: s.method, orders: s.orders, customerDraft: s.customerDraft }) }));
