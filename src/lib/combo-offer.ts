import type { Catalog, Fulfillment, ItemConfiguration } from '@/data/types';
import { indexCatalog } from '@/data/menu';
import { createMenu } from './menu';

export function comboOffer(catalog: Catalog, method: Fulfillment) {
  const indexed = indexCatalog(catalog), menu = createMenu(catalog);
  const product = indexed.productById['flavor-414849'];
  if (!product?.enabled || product.blocked || !indexed.categoryById[product.categoryId]?.enabled) return null;
  const offers = indexed.productPrices(product.id).flatMap(variant => {
    const size = variant.sizeId ? indexed.sizeById[variant.sizeId] : null;
    if (!size?.enabled || size.pending.length || size.categoryId !== product.categoryId) return [];
    const config: ItemConfiguration = { productId: product.id, priceId: variant.id, flavorIds: [product.id], selections: [], note: '' };
    const requirements = menu.requiredGroups(config);
    const flavorRequirement = requirements.find(requirement => {
      const group = indexed.groupById[requirement.groupId];
      return group?.enabled && group.min === 2 && group.max === 2;
    });
    if (!flavorRequirement) return [];
    for (const requirement of requirements) {
      const group = indexed.groupById[requirement.groupId];
      const options = group.additionIds.map(id => indexed.additionById[id]).filter(option => option?.enabled && option.cents !== null).sort((a, b) => a.cents! - b.cents!);
      if (group.min && (!options.length || (!group.allowRepeated && options.length < group.min))) return [];
      const quantities: Record<string, number> = {};
      for (let index = 0; index < group.min; index++) {
        const option = options[group.allowRepeated ? 0 : index];
        quantities[option.id] = (quantities[option.id] || 0) + 1;
      }
      config.selections.push({ scope: requirement.scope, ownerId: requirement.ownerId, groupId: group.id, quantities });
    }
    const calculated = menu.calculateItem(config, method, new Date(), false);
    if (calculated.cents === null || calculated.error) return [];
    const group = indexed.groupById[flavorRequirement.groupId];
    const options = group.additionIds.map(id => indexed.additionById[id]).filter(option => option?.enabled && option.cents !== null);
    return [{ product, price: calculated.cents, group, options, config }];
  });
  return offers.sort((a, b) => a.price - b.price)[0] || null;
}
