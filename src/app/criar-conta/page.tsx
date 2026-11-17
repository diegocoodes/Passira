import { redirect } from 'next/navigation';
import { currentCustomer } from '@/server/customer-auth';
import { accountDestination } from '@/lib/account';
import { CustomerLogin } from '@/components/customer-login';

export const metadata = { title: 'Criar conta | Passira', robots: { index: false, follow: false } };
export default async function CriarConta({ searchParams }: { searchParams: Promise<{ next?: string | string[] }> }) {
  const destination = accountDestination((await searchParams).next);
  if (await currentCustomer()) redirect(destination);
  return <CustomerLogin register destination={destination} />;
}
