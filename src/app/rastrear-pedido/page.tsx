import { Suspense } from 'react';
import { NumberOrderTracker } from '@/components/number-order-tracker';
export const metadata = { title: 'Rastrear pedido | Passira San Martin', robots: { index: false, follow: false } };
export default function RastrearPedido() { return <Suspense fallback={<p className="checkout-loading" role="status">Carregando rastreamento…</p>}><NumberOrderTracker /></Suspense>; }
