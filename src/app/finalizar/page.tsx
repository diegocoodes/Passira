import type { Metadata } from 'next';
import { CheckoutPage } from '@/components/checkout-page';
import { redirect } from 'next/navigation';
import { currentCustomer } from '@/server/customer-auth';
import { accountLoginHref } from '@/lib/account';

export const metadata: Metadata = { title: 'Finalizar pedido | Passira · San Martin', robots: { index: false, follow: false } };

export default async function FinalizarPedido({ searchParams }: { searchParams: Promise<{ etapa?: string | string[] }> }) {
  const { etapa } = await searchParams;
  if ((etapa === 'dados' || etapa === 'conferencia') && !await currentCustomer()) redirect(accountLoginHref(`/finalizar/?etapa=${etapa}`));
  return <CheckoutPage startAtDetails={etapa === 'dados'} startAtReview={etapa === 'conferencia'} />;
}
