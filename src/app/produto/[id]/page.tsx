import type { Metadata } from 'next';
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { indexCatalog } from '@/data/menu';
import { getCatalog } from '@/server/catalog';
import { connection } from 'next/server';
import { ProductPage } from '@/components/product-page';

type ProductPageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  await connection();
  const { productById } = indexCatalog(await getCatalog());
  const product = productById[(await params).id];
  return { title: product ? `${product.name.trim()} | Passira San Martin` : 'Produto indisponível | Passira San Martin', description: product?.description || 'Escolha as opções e adicione ao seu pedido na Passira San Martin.' };
}

export default async function Produto({ params }: ProductPageProps) {
  await connection();
  const { productById, categoryById } = indexCatalog(await getCatalog());
  const product = productById[(await params).id];
  if (!product?.enabled || !categoryById[product.categoryId]?.enabled) notFound();

  return <Suspense fallback={<div className="checkout-loading" role="status">Carregando produto…</div>}><ProductPage key={product.id} product={product} /></Suspense>;
}
