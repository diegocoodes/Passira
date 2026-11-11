import type { Metadata } from 'next';
import './globals.css';
import './brand.css';
import './storefront-sections.css';
export const metadata: Metadata = { title: 'Passira San Martin | Pizzaria e Restaurante', description: 'O cardápio da Passira San Martin: pizzas, pratos para compartilhar, petiscos e bebidas. Monte seu pedido para retirada ou entrega.' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="pt-BR"><body>{children}</body></html>; }
