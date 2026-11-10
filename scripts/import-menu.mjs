import fs from 'node:fs';
const root = new URL('../', import.meta.url);
const read = n => JSON.parse(fs.readFileSync(new URL(`audit/source/${n}.json`, root), 'utf8').replace(/^\uFEFF/, '')).data;
const raw = read('menu');
const categories = [], products = [], sizes = [], prices = [], groups = new Map(), additions = new Map();
const money = n => Number.isFinite(n) ? Math.round(n * 100) : null;
const schedules = list => (list || []).map(d => ({ day: d.weekday_code, name: d.weekday, shifts: d.shifts.map(s => ({ start: (s.start_time ?? s.start_hour) * 60 + s.start_minute, end: (s.end_time ?? s.end_hour) * 60 + s.end_minute })) }));
function collect(list = []) {
  for (const g of list) {
    groups.set(String(g.id), { id: String(g.id), name: g.title, enabled: g.enabled, min: g.minimum_choice, max: g.maximum_choice, allowRepeated: g.choose_more_than_one, additionIds: g.complements.map(a => String(a.id)) });
    for (const a of g.complements) additions.set(String(a.id), { id: String(a.id), groupId: String(g.id), name: a.title, description: a.description, enabled: a.enabled, cents: money(a.price), image: a.image?.original ?? null, order: a.order });
  }
  return list.map(g => String(g.id));
}
for (const c of raw.categories) {
  const cat = { id: String(c.id), name: c.title, enabled: c.enabled, kind: c.category_type === 2 ? 'pizza' : 'food', image: c.image?.original ?? null, schedule: schedules(c.days_available_in_the_week), pending: [] };
  if (c.id === 365011) cat.pending.push('Categoria cadastrada na fonte, mas não exibida durante a conferência. Grupos SABORES duplicados; revisar antes de liberar.');
  if (!c.enabled) cat.pending.push('Categoria desativada na fonte.');
  categories.push(cat);
  for (const item of c.items) {
    const p = { id: `item-${item.id}`, sourceId: item.id, categoryId: cat.id, kind: 'food', name: item.title, description: item.description, image: item.image?.original ?? null, order: item.order, enabled: item.enabled && item.show_on_menu, schedule: schedules(item.days_available_in_the_week), optionGroupIds: collect(item.complement_categories), pending: [], blocked: false };
    const min = Math.min(...item.prices.filter(v => v.enabled).map(v => v.promotion.enabled ? v.promotion.price : v.value));
    if (min !== item.lower_price.store) { p.pending.push(`Preço divergente: tela do produto R$ ${item.lower_price.store.toFixed(2)}; tabela de preços da fonte R$ ${min.toFixed(2)}. Confirmar com a pizzaria.`); p.blocked = true; }
    if (item.id === 2169236) { p.pending.push('A descrição pede escolher 2 acompanhamentos, mas o grupo Guarnição Filet está desativado e sem opções. Aguardando confirmação.'); p.blocked = true; }
    if (item.id === 2570525) p.pending.push('A descrição termina em “Uma pizza com” na fonte. Texto preservado sem completar.');
    products.push(p);
    for (const v of item.prices) prices.push({ id: `price-${v.id}`, productId: p.id, sizeId: null, name: v.name, cents: money(v.promotion.enabled ? v.promotion.price : v.value), deliveryCents: money(v.enabled_price_by_modality ? (v.delivery.enabled_promotion ? v.delivery.promotion_value : v.delivery.value) : (v.promotion.enabled ? v.promotion.price : v.value)), pickupCents: money(v.enabled_price_by_modality ? (v.store.enabled_promotion ? v.store.promotion_value : v.store.value) : (v.promotion.enabled ? v.promotion.price : v.value)), enabled: v.enabled, deliveryEnabled: !v.enabled_price_by_modality || v.delivery.enabled, pickupEnabled: !v.enabled_price_by_modality || v.store.enabled, observedDisplayCents: item.id === 2169202 ? 850 : item.id === 2172244 ? 6760 : null, optionGroupIds: [] });
  }
  for (const f of c.pizza_flavors) products.push({ id: `flavor-${f.id}`, sourceId: f.id, categoryId: cat.id, kind: 'pizza', name: f.title, description: f.description, image: f.image?.original ?? f.photo?.original ?? null, order: f.order ?? 0, enabled: f.enabled, schedule: [], optionGroupIds: [], pending: f.id === 382530 ? ['Descrição aparentemente truncada na fonte. Texto preservado.'] : [...cat.pending], blocked: cat.pending.length > 0 });
  for (const s of c.pizzas) {
    const allowed = s.quantity_of_flavors_allowed;
    sizes.push({ id: String(s.id), categoryId: cat.id, name: s.title, enabled: s.enabled, maxFlavors: allowed.four ? 4 : allowed.three ? 3 : allowed.two ? 2 : 1, onlyTakeout: s.only_to_takeout, optionGroupIds: collect(s.complement_categories), pending: s.flavors_and_prices.length ? [] : ['Tamanho sem sabores e preços associados na fonte. Não disponível para compra.'] });
    for (const fp of s.flavors_and_prices) prices.push({ id: `pizza-price-${fp.price.id}`, productId: `flavor-${fp.flavor.id}`, sizeId: String(s.id), name: s.title, cents: money(fp.price.price), deliveryCents: money(fp.price.price), pickupCents: money(fp.price.price), enabled: s.enabled && fp.flavor.enabled, deliveryEnabled: !s.only_to_takeout, pickupEnabled: true, optionGroupIds: collect(fp.flavor.complement_categories) });
  }
}
const target = new URL('src/data/menu/', root);
for (const [name, value] of Object.entries({ categories, products, sizes, prices, 'option-groups': [...groups.values()], additions: [...additions.values()], rules: { source: 'https://loja.neemo.com.br/passira-sanmartin', checkedAt: '2026-11-10', pizzaPrice: 'average', flavorAdditionsPrice: 'average', configuration: read('menu_settings') } })) fs.writeFileSync(new URL(`${name}.json`, target), JSON.stringify(value, null, 2) + '\n');
const info = read('general_informations');
fs.writeFileSync(new URL('src/data/store.json', root), JSON.stringify({ name: 'Passira - San Martin', address: info.address, phone: info.contact.phone, whatsapp: info.contact.whatsapp, operationTimes: read('operation_times'), modes: read('operation_modes') }, null, 2));
let report = '# Cardápio conferido — Passira - San Martin\n\nFonte: https://loja.neemo.com.br/passira-sanmartin\n\nData: 10/11/2026. Textos e valores preservados em audit/source/menu.json. Os preços abaixo são os registros da tabela de preços da fonte, em reais. Valores divergentes exibidos na tela são discriminados nas pendências. Espaços dos textos originais permanecem nos JSONs.\n\n';
report += '## Regras e pendências\n\nPizzas com mais de um sabor: média aritmética dos preços dos sabores no tamanho escolhido. Complementos de sabores: média, conforme configuração. Grande (8 Fatias) e Média (6 Fatias): até 2 sabores; Brotinho: 1. Promoção 8 fatias: até 2. Pizza em Dobro: 2 pizzas inteiras, sabores iguais ou diferentes, sem meio a meio; grupo SABORES exige 2 escolhas e permite repetir. Acréscimos confirmados: Frango Catupiry R$ 18,00; Calabresa com Cream Creese R$ 20,00; Costela com Cream cheese R$ 20,00; Trio Nordestino R$ 30,00.\n\nTaxas de entrega: não confirmadas, configuráveis em src/data/delivery.ts. Entrega bloqueada até definir a taxa. HAPPY PIZZA não apareceu na navegação durante a conferência e possui dois grupos SABORES; cadastro preservado, compra bloqueada. PIZZA + REFRI 1 LITRO desativada. Tamanhos sem preços não são vendidos. Campos vazios e descrições truncadas não foram completados. Grupos desativados foram preservados e não são oferecidos.\n\n';
for (const c of categories) {
  const ps = products.filter(p => p.categoryId === c.id);
  report += `## ${c.name} — ${ps.length} produtos/sabores${!c.enabled ? ' (desativada)' : ''}\n\n`;
  if (c.pending.length) report += c.pending.join('\n') + '\n\n';
  if (c.schedule.length) report += 'Dias/horários (America/Recife): ' + c.schedule.map(d => `${d.name}: ${d.shifts.map(s => `${String(Math.floor(s.start / 60)).padStart(2, '0')}:${String(s.start % 60).padStart(2, '0')}–${String(Math.floor(s.end / 60)).padStart(2, '0')}:${String(s.end % 60).padStart(2, '0')}`).join(', ')}`).join('; ') + '\n\n';
  for (const p of ps) {
    report += `### ${p.name}\n\nID: ${p.sourceId}.\n\n${p.description || '(Descrição não informada na fonte.)'}\n\n`;
    for (const v of prices.filter(v => v.productId === p.id)) {
      report += `- ${v.name}: ${v.cents === null ? 'PENDENTE' : (v.cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}\n`;
      if (v.observedDisplayCents !== null && v.observedDisplayCents !== undefined) report += `  - Valor exibido na tela do produto: ${(v.observedDisplayCents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}. Divergência em revisão; compra bloqueada.\n`;
      const ids = [...p.optionGroupIds, ...v.optionGroupIds, ...(sizes.find(s => s.id === v.sizeId)?.optionGroupIds ?? [])];
      for (const id of ids) { const g = groups.get(id); report += `  - ${g.name}: ${g.min}–${g.max} escolhas; repetição ${g.allowRepeated ? 'permitida' : 'não permitida'}; ${g.enabled ? 'ativo' : 'desativado'}\n`; for (const aid of g.additionIds) { const a = additions.get(aid); report += `    - ${a.name}: ${(a.cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}${a.description ? ` — ${a.description}` : ''}\n`; } }
    }
    if (p.pending.length) report += '\n**REVISÃO:** ' + p.pending.join(' ') + '\n';
    report += '\n';
  }
}
fs.writeFileSync(new URL('audit/CARDAPIO.md', root), report);
console.log(`Registrados ${categories.length} categorias, ${products.length} produtos/sabores, ${sizes.length} tamanhos, ${prices.length} preços, ${groups.size} grupos e ${additions.size} opções.`);
