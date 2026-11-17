import type { Metadata } from 'next';
import { connection } from 'next/server';
import { MenuProvider } from '@/components/menu-provider';
import { getCatalog } from '@/server/catalog';
import { currentCustomer } from '@/server/customer-auth';
import { AccountProvider } from '@/components/account-provider';
import './globals.css';
import './brand.css';
import './storefront-sections.css';
import './product-page.css';
import './admin.css';
import './admin-logs.css';
import './order-tracking.css';
import './storefront-campaign.css';
import './experience.css';
import './menu-categories.css';
import './storefront-opening.css';
import './house-reviews.css';
import './customer-account.css';
export const metadata: Metadata = { title: 'Passira San Martin | Pizzaria e Restaurante', description: 'O cardápio da Passira San Martin: pizzas, pratos para compartilhar, petiscos e bebidas. Monte seu pedido para retirada ou entrega.' };
export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  await connection();
  const catalog = await getCatalog();
  const user = await currentCustomer();
  return <html lang="pt-BR" data-type="place" data-scroll-behavior="smooth"><body><meta name="page-type" content="place" /><meta name="site-kind" content="other" /><meta name="page-kind" content="place" /><AccountProvider initialUser={user}><MenuProvider initial={catalog}>{children}</MenuProvider></AccountProvider></body></html>;
}
