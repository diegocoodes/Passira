import { notFound } from 'next/navigation';
import { OrderTracker } from '@/components/order-tracker';
export const metadata = { title: 'Acompanhar pedido | Passira', robots: { index: false, follow: false }, referrer: 'no-referrer' as const };
export default async function AcompanharPedido({ params }: { params: Promise<{ token: string }> }) { const { token } = await params; if (!/^[a-f0-9]{48}$/.test(token)) notFound(); return <OrderTracker token={token} />; }
