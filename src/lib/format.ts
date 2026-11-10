export const brl = (cents: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
export const normalize = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
export function formatPhone(value: string) {
  const d = value.replace(/\D/g, '').slice(0, 11);
  if (!d) return '';
  if (d.length < 3) return `(${d}`;
  const local = d.slice(2), cut = local.length > 8 ? 5 : 4;
  return `(${d.slice(0, 2)}) ${local.slice(0, cut)}${local.length > cut ? '-' + local.slice(cut) : ''}`;
}
export const formatCep = (v: string) => v.replace(/\D/g, '').slice(0, 8).replace(/(\d{5})(\d)/, '$1-$2');
