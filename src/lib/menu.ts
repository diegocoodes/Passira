import { indexCatalog, initialCatalog } from '@/data/menu';
import type { Catalog } from '@/data/types';
import type { DeliveryRegion } from '@/data/delivery';
import store from '@/data/store.json';
import type { CartItem, Fulfillment, GroupSelection, ItemConfiguration, Schedule } from '@/data/types';
import { normalize } from './format';

export type GroupRequirement = { key: string; scope: GroupSelection['scope']; ownerId: string; groupId: string; ownerName: string };
export function currentLocal(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'America/Recife', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(date);
  const get = (type: string) => parts.find(p => p.type === type)?.value ?? '';
  return { day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].indexOf(get('weekday')) + 1, minute: Number(get('hour')) * 60 + Number(get('minute')) };
}
export function inSchedule(schedule: Schedule, date = new Date()): boolean {
  if (!schedule.length) return true;
  const { day, minute } = currentLocal(date);
  return schedule.some(d => d.day === day && d.shifts.some(s => minute >= s.start && minute < s.end));
}
export function storeOpen(date = new Date()) {
  const { day, minute } = currentLocal(date);
  return store.operationTimes.some(d => d.weekday_code === day && d.opened && d.shifts.some(s => minute >= s.start_hour * 60 + s.start_minute && minute < s.end_hour * 60 + s.end_minute));
}
export function createMenu(catalog: Catalog) {
const { additionById, categoryById, groupById, prices, productById, productPrices, sizeById, deliveryRegions } = indexCatalog(catalog);
function availability(productId: string, date = new Date()): string | null {
  const p = productById[productId];
  if (!p || !p.enabled) return 'Indisponível no cardápio.';
  const c = categoryById[p.categoryId];
  if (!c.enabled) return 'Categoria indisponível.';
  if (p.blocked) return 'Informações em conferência. Compra temporariamente indisponível.';
  if (!inSchedule(c.schedule, date) || !inSchedule(p.schedule, date)) return 'Disponível somente nos dias e horários desta promoção.';
  return null;
}
const priceFor = (id: string, method: Fulfillment) => {
  const p = prices.find(p => p.id === id);
  if (!p?.enabled || !(method === 'pickup' ? p.pickupEnabled : p.deliveryEnabled)) return null;
  return method === 'pickup' ? p.pickupCents : p.deliveryCents;
};
function requiredGroups(config: ItemConfiguration): GroupRequirement[] {
  const p = productById[config.productId], price = prices.find(v => v.id === config.priceId);
  if (!p || !price) return [];
  const list: GroupRequirement[] = [];
  const add = (ids: string[], scope: GroupSelection['scope'], ownerId: string, ownerName: string) => ids.forEach(groupId => {
    const g = groupById[groupId];
    if (g?.enabled) list.push({ key: `${scope}:${ownerId}:${groupId}`, scope, ownerId, groupId, ownerName });
  });
  add(p.optionGroupIds, 'product', p.id, p.name);
  if (price.sizeId) {
    const s = sizeById[price.sizeId];
    add(s.optionGroupIds, 'size', s.id, s.name);
    for (const fid of config.flavorIds) { const fp = prices.find(v => v.productId === fid && v.sizeId === price.sizeId && v.enabled); if (fp) add(fp.optionGroupIds, 'flavor', fid, productById[fid].name); }
  } else add(price.optionGroupIds, 'product', p.id, p.name);
  return list;
}
function calculateItem(config: ItemConfiguration, method: Fulfillment, date = new Date(), checkAvailability = true): { cents: number | null; error: string | null } {
  const fail = (error: string) => ({ cents: null, error });
  const p = productById[config.productId];
  const price = prices.find(v => v.id === config.priceId && v.productId === config.productId);
  if (!p || !price) return fail('Selecione uma opção válida.');
  if (checkAvailability) { const reason = availability(p.id, date); if (reason) return fail(reason); }
  let base = priceFor(price.id, method);
  if (base === null) return fail('Preço indisponível para esta modalidade.');
  let flavorCount = 1;
  if (p.kind === 'pizza') {
    const size = price.sizeId ? sizeById[price.sizeId] : null;
    if (!size?.enabled || size.pending.length || (size.onlyTakeout && method !== 'pickup')) return fail('Tamanho indisponível.');
    const fids = config.flavorIds;
    if (!fids.includes(p.id) || fids.length < 1 || fids.length > size.maxFlavors || new Set(fids).size !== fids.length) return fail(`Escolha de 1 a ${size.maxFlavors} sabores diferentes.`);
    const values: number[] = [];
    for (const fid of fids) {
      const f = productById[fid];
      if (!f || f.categoryId !== p.categoryId) return fail('Sabor não pertence a esta categoria.');
      if (checkAvailability) { const reason = availability(fid, date); if (reason) return fail(reason); }
      const fp = prices.find(v => v.productId === fid && v.sizeId === size.id && v.enabled);
      const value = fp ? priceFor(fp.id, method) : null;
      if (value === null) return fail('Sabor sem preço confirmado neste tamanho.');
      values.push(value);
    }
    flavorCount = fids.length;
    base = values.reduce((n, v) => n + v, 0) / flavorCount;
  }
  const required = requiredGroups(config);
  let common = 0, flavorExtras = 0;
  if (config.selections.some(s => !required.some(r => r.scope === s.scope && r.ownerId === s.ownerId && r.groupId === s.groupId))) return fail('Uma opção foi removida do cardápio. Personalize o item novamente.');
  for (const r of required) {
    const g = groupById[r.groupId];
    const matches = config.selections.filter(s => s.scope === r.scope && s.ownerId === r.ownerId && s.groupId === r.groupId);
    if (matches.length > 1) return fail('Grupo de opções duplicado.');
    const selection = matches[0];
    let count = 0, extra = 0;
    for (const [aid, q] of Object.entries(selection?.quantities ?? {})) {
      const a = additionById[aid];
      if (!Number.isInteger(q) || q < 0 || (!g.allowRepeated && q > 1) || !g.additionIds.includes(aid) || !a?.enabled || a.cents === null) return fail('Adicional inválido ou sem preço confirmado.');
      count += q; extra += a.cents * q;
    }
    if (count < g.min || count > g.max) return fail(`${g.name.trim()}: escolha ${g.min === g.max ? g.min : `${g.min} a ${g.max}`} opção(ões).`);
    if (r.scope === 'flavor') flavorExtras += extra; else common += extra;
  }
  return { cents: Math.round(base + common + flavorExtras / flavorCount), error: null };
}
function itemDetails(config: ItemConfiguration): string[] {
  const price = prices.find(p => p.id === config.priceId);
  const details = [price?.name.trim() ?? ''];
  if (productById[config.productId]?.kind === 'pizza') details.push(config.flavorIds.map(id => productById[id]?.name.trim()).join(' + '));
  for (const r of requiredGroups(config)) {
    const sel = config.selections.find(s => s.scope === r.scope && s.ownerId === r.ownerId && s.groupId === r.groupId);
    const text = Object.entries(sel?.quantities ?? {}).filter(([, q]) => q > 0).map(([id, q]) => `${q > 1 ? q + '× ' : ''}${additionById[id]?.name.trim()}`).join(', ');
    if (text) details.push(`${groupById[r.groupId].name.trim()}: ${text}`);
  }
  if (config.note.trim()) details.push(`Obs.: ${config.note.trim()}`);
  return details.filter(Boolean);
}
function getDeliveryFee(method: Fulfillment, neighborhood: string, regions: DeliveryRegion[] = deliveryRegions): number | null {
  if (method === 'pickup') return 0;
  if (!normalize(neighborhood)) return null;
  const region = regions.find(r => r.neighborhoods.some(n => normalize(n) === normalize(neighborhood)));
  return region && region.feeCents !== null && Number.isSafeInteger(region.feeCents) && region.feeCents >= 0 ? region.feeCents : null;
}
function cartTotals(items: CartItem[], method: Fulfillment, neighborhood: string, date = new Date()) {
  const rows = items.map(item => ({ item, ...calculateItem(item, method, date) }));
  const subtotal = rows.reduce((n, r) => n + (r.cents ?? 0) * r.item.quantity, 0);
  const fee = getDeliveryFee(method, neighborhood);
  const errors = rows.filter(r => r.error || !Number.isInteger(r.item.quantity) || r.item.quantity < 1 || r.item.quantity > 99);
  return { rows, subtotal, fee, total: fee === null || errors.length ? null : subtotal + fee, hasErrors: errors.length > 0 };
}
const minimumPrice = (id: string, method: Fulfillment) => {
  const values = productPrices(id).map(v => priceFor(v.id, method)).filter((v): v is number => v !== null);
  return values.length ? Math.min(...values) : null;
};

return { availability, priceFor, requiredGroups, calculateItem, itemDetails, getDeliveryFee, cartTotals, minimumPrice };
}
export const { availability, priceFor, requiredGroups, calculateItem, itemDetails, getDeliveryFee, cartTotals, minimumPrice } = createMenu(initialCatalog);
