import type { Catalog, Fulfillment, ItemConfiguration, Order } from '@/data/types';
import { createMenu } from './menu';
import { displayMenuText } from './format';

export function prepareRepeatOrder(order: Order, catalog: Catalog, method: Fulfillment, at = new Date()) {
  const menu = createMenu(catalog);
  const items: { configuration: ItemConfiguration; quantity: number }[] = [];
  const skipped: { name: string; reason: string }[] = [];
  let subtotal = 0;
  for (const row of order.items) {
    const config = row.configuration;
    if (!config || !Number.isInteger(config.quantity) || config.quantity < 1 || config.quantity > 99 || !Array.isArray(config.flavorIds) || !Array.isArray(config.selections)) {
      skipped.push({ name: displayMenuText(row.title), reason: 'Este item precisa ser montado novamente.' }); continue;
    }
    const configuration: ItemConfiguration = { productId: config.productId, priceId: config.priceId, flavorIds: [...config.flavorIds], selections: structuredClone(config.selections), note: config.note || '' };
    try {
      const calculated = menu.calculateItem(configuration, method, at);
      if (calculated.error || calculated.cents === null) { skipped.push({ name: displayMenuText(row.title), reason: calculated.error || 'Preço indisponível.' }); continue; }
      items.push({ configuration, quantity: config.quantity });
      subtotal += calculated.cents * config.quantity;
    } catch { skipped.push({ name: displayMenuText(row.title), reason: 'As opções mudaram. Monte este item novamente.' }); }
  }
  return { items, skipped, subtotal };
}
