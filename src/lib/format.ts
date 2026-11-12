export const brl = (cents: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
export const normalize = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
export const displayMenuText = (value: string) => value
  .split(/((?:https?:\/\/|www\.)\S+)/g)
  .map((part, index) => index % 2 ? part : part
    .replace(/^\s*[-‐‑‒–—]\s+/gm, '')
    .replace(/\s+[-‐‑‒–—]\s*$/gm, '')
    .replace(/\s+[-‐‑‒–—]\s+/g, ', ')
    .replace(/\s*[‒–—]\s*/g, ', ')
    .replace(/(?<=\p{L})[-‐‑](?=\p{L})/gu, ' '))
  .join('')
  .trim();
export function formatPhone(value: string) {
  const d = value.replace(/\D/g, '').slice(0, 11);
  if (!d) return '';
  if (d.length < 3) return `(${d}`;
  const local = d.slice(2), cut = local.length > 8 ? 5 : 4;
  return `(${d.slice(0, 2)}) ${local.slice(0, cut)}${local.length > cut ? '-' + local.slice(cut) : ''}`;
}
export const formatCep = (v: string) => v.replace(/\D/g, '').slice(0, 8).replace(/(\d{5})(\d)/, '$1-$2');
export const formatCpf = (value: string) => value.replace(/\D/g, '').slice(0, 11).replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1-$2');
export function validCpf(value: string) {
  const digits = value.replace(/\D/g, '');
  if (!/^\d{11}$/.test(digits) || /^(\d)\1{10}$/.test(digits)) return false;
  for (const length of [9, 10]) {
    const sum = [...digits.slice(0, length)].reduce((total, digit, index) => total + Number(digit) * (length + 1 - index), 0);
    const remainder = (sum * 10) % 11;
    if ((remainder === 10 ? 0 : remainder) !== Number(digits[length])) return false;
  }
  return true;
}
