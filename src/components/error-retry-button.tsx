'use client';

import { useTransition } from 'react';
import { RefreshCw } from 'lucide-react';

export function ErrorRetryButton({ retry }: { retry?: () => void }) {
  const [pending, startTransition] = useTransition();
  return <button type="button" className="error-action error-action-secondary" disabled={pending} onClick={() => startTransition(() => { if (retry) retry(); else window.location.reload(); })}><RefreshCw size={17} aria-hidden="true" />{pending ? 'Tentando novamente…' : 'Tentar novamente'}</button>;
}
