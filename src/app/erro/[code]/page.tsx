import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ErrorScreen } from '@/components/error-screen';
import { errorContent, parseErrorCode } from '@/lib/error-pages';

type Props = { params: Promise<{ code: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const code = parseErrorCode((await params).code) ?? 404;
  return { title: `${code} · ${errorContent(code).label} | Passira`, robots: { index: false, follow: false } };
}

export default async function ErrorPreview({ params }: Props) {
  const code = parseErrorCode((await params).code);
  if (code === null) notFound();
  return <ErrorScreen code={code} />;
}
