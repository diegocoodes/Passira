import type { Metadata } from 'next';
import { CheckoutPage } from '@/components/checkout-page';

export const metadata: Metadata = { title: 'Finalizar pedido | Passira · San Martin', robots: { index: false, follow: false } };

export default async function FinalizarPedido({ searchParams }: { searchParams: Promise<{ etapa?: string | string[] }> }) {
  return <CheckoutPage startAtDetails={(await searchParams).etapa === 'dados'} />;
}
