import type { Fulfillment, OrderStatus } from '@/data/types';
export const statusLabels: Record<OrderStatus, string> = { received: 'Recebido', accepted: 'Aceito', preparing: 'Em preparo', ready: 'Pronto', out_for_delivery: 'Saiu para entrega', completed: 'Concluído', cancelled: 'Cancelado' };
export function nextStatuses(status: OrderStatus, method: Fulfillment): OrderStatus[] {
  const next: Record<OrderStatus, OrderStatus[]> = { received: ['accepted', 'cancelled'], accepted: ['preparing', 'cancelled'], preparing: ['ready', 'cancelled'], ready: method === 'delivery' ? ['out_for_delivery', 'cancelled'] : ['completed', 'cancelled'], out_for_delivery: ['completed'], completed: [], cancelled: [] };
  return next[status] || [];
}
export function dayBounds(day: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) throw new Error('Data inválida.');
  const start = new Date(`${day}T00:00:00-03:00`);
  if (Number.isNaN(start.getTime()) || start.toISOString().slice(0, 10) !== day) throw new Error('Data inválida.');
  return { start, end: new Date(start.getTime() + 86400000) };
}
export const todayInRecife = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Recife', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
