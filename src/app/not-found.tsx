import type { Metadata } from 'next';
import { ErrorScreen } from '@/components/error-screen';

export const metadata: Metadata = { title: 'Página não encontrada | Passira', robots: { index: false, follow: false } };

export default function NotFound() { return <ErrorScreen code={404} />; }
