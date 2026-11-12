import rawCategories from './menu/categories.json';
import rawProducts from './menu/products.json';
import rawSizes from './menu/sizes.json';
import rawPrices from './menu/prices.json';
import rawGroups from './menu/option-groups.json';
import rawAdditions from './menu/additions.json';
import type { Category, Product, Size, Price, OptionGroup, Addition } from './types';
import { displayMenuText } from '@/lib/format';
import { deliveryRegions } from './delivery';
import type { Catalog } from './types';

function presentEntry<T extends { name: string; description?: string }>(entry: T): T {
  return { ...entry, name: displayMenuText(entry.name), ...(typeof entry.description === 'string' ? { description: displayMenuText(entry.description) } : {}) };
}

export const categories: Category[] = rawCategories.map(presentEntry);
export const products: Product[] = rawProducts.map(presentEntry);
export const sizes: Size[] = rawSizes.map(presentEntry);
export const prices: Price[] = rawPrices.map(presentEntry);
export const optionGroups: OptionGroup[] = rawGroups.map(presentEntry);
export const additions: Addition[] = rawAdditions.map(presentEntry);
export const productById = Object.fromEntries(products.map(p => [p.id, p]));
export const sizeById = Object.fromEntries(sizes.map(s => [s.id, s]));
export const groupById = Object.fromEntries(optionGroups.map(g => [g.id, g]));
export const additionById = Object.fromEntries(additions.map(a => [a.id, a]));
export const categoryById = Object.fromEntries(categories.map(c => [c.id, c]));
export const availableCategories = categories.filter(c => c.enabled);
export const productPrices = (id: string) => prices.filter(p => p.productId === id && p.enabled && p.cents !== null);

export const initialCatalog: Catalog = { categories, products, prices, sizes, optionGroups, additions, deliveryRegions };
export function indexCatalog(catalog: Catalog) {
  const presented = { ...catalog,
    categories: catalog.categories.map(presentEntry), products: catalog.products.map(presentEntry),
    prices: catalog.prices.map(presentEntry), sizes: catalog.sizes.map(presentEntry),
    optionGroups: catalog.optionGroups.map(presentEntry), additions: catalog.additions.map(presentEntry),
  };
  return { ...presented,
    productById: Object.fromEntries(presented.products.map(product => [product.id, product])),
    categoryById: Object.fromEntries(presented.categories.map(category => [category.id, category])),
    sizeById: Object.fromEntries(presented.sizes.map(size => [size.id, size])),
    groupById: Object.fromEntries(presented.optionGroups.map(group => [group.id, group])),
    additionById: Object.fromEntries(presented.additions.map(addition => [addition.id, addition])),
    availableCategories: presented.categories.filter(category => category.enabled),
    productPrices: (id: string) => presented.prices.filter(price => price.productId === id && price.enabled && price.cents !== null),
  };
}
