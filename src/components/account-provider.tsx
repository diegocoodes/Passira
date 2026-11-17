'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { requestJson } from '@/lib/api-client';
import type { AccountUser } from '@/lib/account';

const AccountContext = createContext<{ user: AccountUser | null; loading: boolean }>({ user: null, loading: true });

export function AccountProvider({ initialUser, children }: { initialUser: AccountUser | null; children: React.ReactNode }) {
  const [user, setUser] = useState(initialUser);
  const [loading, setLoading] = useState(false);
  const pathname = usePathname();
  useEffect(() => {
    if (pathname.startsWith('/admin')) return;
    const controller = new AbortController();
    const refresh = () => {
      setLoading(true);
      requestJson<{ user: AccountUser | null }>('/api/account/session/', { signal: controller.signal })
        .then(data => setUser(data.user)).catch(() => {})
        .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    };
    refresh();
    const interval = window.setInterval(refresh, 60000);
    window.addEventListener('focus', refresh);
    return () => { controller.abort(); window.clearInterval(interval); window.removeEventListener('focus', refresh); };
  }, [pathname]);
  return <AccountContext.Provider value={{ user, loading }}>{children}</AccountContext.Provider>;
}

export const useAccount = () => useContext(AccountContext);
