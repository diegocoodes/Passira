import type { Product } from './types';

// Presentation overrides are kept separate from the original menu import.
// These references are illustrative; ingredients and portions come from the menu.
export const illustrativeImages: Record<string, string> = {
  'item-2169127': 'frango-cremoso',
  'item-2172827': 'galeto-assado',
  'item-2169129': 'galeto-assado',
  'item-2172333': 'estrogonofe-file',
  'item-2169264': 'peixe-grelhado',
  'item-2169258': 'cordon-bleu',
  'item-2169257': 'file-grelhado',
  'item-2169254': 'frango-grelhado',
  'item-2169252': 'frango-empanado',
  'item-2169247': 'carne-na-brasa',
  'item-2172829': 'carne-na-brasa',
  'item-2172687': 'carne-na-brasa',
  'item-2169148': 'carne-na-brasa',
  'item-2820048': 'baiao-de-dois',
  'item-2169136': 'espaguete-bolonhesa',
  'item-2172537': 'file-grelhado',
  'item-2169239': 'cordon-bleu',
  'item-2169238': 'file-grelhado',
  'item-2169236': 'file-grelhado',
  'item-2169235': 'file-parmegiana',
  'item-2172270': 'arroz-chop-suey',
  'item-2172260': 'frango-oriental',
  'item-2172259': 'carne-oriental',
  'item-2172253': 'arroz-camarao',
  'item-2172250': 'arroz-camarao',
  'item-2172245': 'camarao-empanado',
  'item-2172244': 'frango-empanado',
  'item-2169173': 'bifum',
  'item-2169172': 'arroz-frango',
  'item-2825748': 'camarao-ao-molho',
  'item-2172808': 'peixe-escabeche',
  'item-2169165': 'camarao-ao-molho',
  'item-2169162': 'camarao-empanado',
  'item-2169160': 'peixe-grelhado',
  'item-2169158': 'bacalhau-gratinado',
  'item-2169156': 'peixe-grelhado',
  'item-2169188': 'salada-bacalhau',
  'item-2169186': 'salada-camarao',
  'item-2169185': 'salada-fresca',
  'item-2169184': 'salada-fresca',
  'item-2825744': 'linguica-grelhada',
  'item-2169266': 'file-grelhado',
};

export function getProductImage(product: Product): { src: string; illustrative: boolean } {
  if (product.photoUrl) return { src: product.photoUrl, illustrative: false };
  if (product.image) return { src: `/images/${product.sourceId}.webp`, illustrative: false };
  const image = illustrativeImages[product.id];
  return { src: image ? `/images/illustrative/${image}.webp` : '/images/product-placeholder.svg', illustrative: true };
}
