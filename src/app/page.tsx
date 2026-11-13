import { Storefront } from '@/components/storefront';
import { connection } from 'next/server';
import { getStorefrontContent } from '@/server/storefront-content';
export default async function Home() {
  await connection();
  return <Storefront content={await getStorefrontContent()} />;
}
