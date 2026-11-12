import type { Metadata } from 'next';
import { connection } from 'next/server';
import { MenuProvider } from '@/components/menu-provider';
import { getCatalog } from '@/server/catalog';
import './globals.css';
import './brand.css';
import './storefront-sections.css';
import './product-page.css';
import './admin.css';
import './order-tracking.css';
import './storefront-campaign.css';
import './experience.css';
export const metadata: Metadata = { title: 'Passira San Martin | Pizzaria e Restaurante', description: 'O cardápio da Passira San Martin: pizzas, pratos para compartilhar, petiscos e bebidas. Monte seu pedido para retirada ou entrega.' };
export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  await connection();
  const catalog = await getCatalog();
  return <html lang="pt-BR" data-scroll-behavior="smooth"><body><MenuProvider initial={catalog}>{children}</MenuProvider></body></html>;
}
