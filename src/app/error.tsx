'use client';

import { ErrorScreen } from '@/components/error-screen';

export default function ErrorPage({ retry }: { error: unknown; retry: () => void }) {
  return <><title>Não foi possível carregar a página | Passira</title><meta name="robots" content="noindex, nofollow" /><ErrorScreen code={500} retry={retry} /></>;
}
