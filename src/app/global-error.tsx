'use client';

import { ErrorScreen } from '@/components/error-screen';
import './error-pages.css';

export default function GlobalError({ retry }: { error: unknown; retry: () => void }) {
  return <html lang="pt-BR"><head><title>Falha no sistema | Passira</title><meta name="robots" content="noindex, nofollow" /></head><body className="error-document"><ErrorScreen code={500} retry={retry} /></body></html>;
}
