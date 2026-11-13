import { z } from 'zod';

const text = (max: number) => z.string().trim().min(1, 'Preencha os textos da seção.').max(max, `Use até ${max} caracteres neste campo.`);
export function isContentImage(value: string) {
  if (/^\/images\/[a-zA-Z0-9/_.-]+$/.test(value) && !value.split('/').includes('..')) return true;
  try { const url = new URL(value); return url.protocol === 'https:' && !!url.hostname && !url.username && !url.password; } catch { return false; }
}
const image = text(2000).refine(isContentImage, 'Use um link HTTPS ou um caminho dentro de /images/.');

export const storefrontContentSchema = z.object({
  hero: z.object({ title: text(60), accent: text(40), button: text(30), image, imageAlt: text(240), quickTitle: text(40), quickButton: text(25), deliveryText: text(100) }),
  menu: z.object({ kicker: text(80), title: text(80) }),
  selection: z.object({ kicker: text(80), title: text(80), button: text(40), productIds: z.array(text(100)).max(6, 'Selecione até seis produtos.').refine(ids => new Set(ids).size === ids.length, 'Selecione produtos diferentes para os destaques.') }),
  manifesto: z.object({ title: text(40), body: text(240), accent: text(120), button: text(40), leftImage: image, rightImage: image }),
  story: z.object({ kicker: text(80), title: text(80), accent: text(80), body: text(1000), image, imageAlt: text(240) }),
  footer: z.object({ description: text(180) }),
});

export type StorefrontContent = z.infer<typeof storefrontContentSchema>;
export const defaultStorefrontContent: StorefrontContent = {
  hero: { title: 'Sabor que\nchega', accent: 'até você.', button: 'Ver cardápio', image: '/images/campaign/passira-delivery.webp', imageAlt: 'Composição ilustrativa de uma mão segurando uma caixa vermelha com pizza', quickTitle: 'Bateu a fome?', quickButton: 'Peça aqui', deliveryText: 'Seu sabor favorito\nestá a caminho.' },
  menu: { kicker: 'Feito para dar água na boca', title: 'Nosso cardápio.' },
  selection: { kicker: 'Para abrir o apetite', title: 'Favoritos da casa', button: 'Ver menu completo', productIds: ['flavor-380075', 'item-2169126', 'item-2172833'] },
  manifesto: { title: 'Passira.', body: 'Pizza para dividir. Pratos para reunir.\nO sabor dos seus bons momentos,', accent: 'agora na sua mesa.', button: 'Encontre seu favorito', leftImage: '/images/380075.webp', rightImage: '/images/2169126.webp' },
  story: { kicker: 'Nossa casa', title: 'Viva o clima.', accent: 'Sinta o sabor.', body: 'Uma pizza para compartilhar, um almoço em família, um encontro sem pressa. Na Passira San Martin, cada visita tem um sabor especial. A nossa mesa espera por você.', image: '/images/restaurant/interior-san-martin.webp', imageAlt: 'Salão da Passira San Martin, com mesas de madeira e clientes reunidos para uma refeição' },
  footer: { description: 'Pizzaria e restaurante em San Martin, Recife.' },
};
