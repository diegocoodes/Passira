import { redirect } from 'next/navigation';
import { currentCustomer } from '@/server/customer-auth';
import { accountLoginHref } from '@/lib/account';
import { AccountOrders } from '@/components/account-orders';

export const metadata = { title: 'Meus pedidos | Passira', robots: { index: false, follow: false } };
export default async function MinhaConta() {
  const user = await currentCustomer();
  if (!user) redirect(accountLoginHref());
  return <AccountOrders user={user} />;
}
