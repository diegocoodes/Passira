import type { Metadata } from 'next';
import { CheckoutPage } from '@/components/checkout-page';

export const metadata: Metadata = { title: 'Finalizar pedido | Passira · San Martin', robots: { index: false, follow: false } };

export default function FinalizarPedido() {
  return <CheckoutPage />;
}
