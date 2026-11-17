import { notFound, redirect } from 'next/navigation';
import { currentCustomer } from '@/server/customer-auth';
import { customerOrder } from '@/server/order-service';
import { HttpError } from '@/server/auth';
import { accountLoginHref } from '@/lib/account';
import { OrderTracker } from '@/components/order-tracker';

export const metadata = { title: 'Acompanhar meu pedido | Passira', robots: { index: false, follow: false }, referrer: 'no-referrer' as const };
export default async function MeuPedido({ params }: { params: Promise<{ number: string }> }) {
  const { number } = await params;
  if (!/^[1-9]\d{0,9}$/.test(number)) notFound();
  const user = await currentCustomer();
  if (!user) redirect(accountLoginHref(`/minha-conta/pedidos/${number}/`));
  try { await customerOrder(user.id, Number(number)); }
  catch (error) { if (error instanceof HttpError && error.status === 404) notFound(); throw error; }
  return <OrderTracker orderNumber={Number(number)} />;
}
