'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { requestJson } from '@/lib/api-client';
import type { AccountUser } from '@/lib/account';

const AccountContext = createContext<{ user: AccountUser | null; loading: boolean; refresh: (signal?: AbortSignal) => Promise<AccountUser | null> }>({ user: null, loading: true, refresh: async () => null });

export function AccountProvider({ initialUser, children }: { initialUser: AccountUser | null; children: React.ReactNode }) {
  const [user, setUser] = useState(initialUser);
  const [loading, setLoading] = useState(false);
  const version = useRef(0);
  const pathname = usePathname();
  const refresh = useCallback(async (signal?: AbortSignal) => {
    const requestVersion = ++version.current;
    setLoading(true);
    try {
      const data = await requestJson<{ user: AccountUser | null }>('/api/account/session/', { signal });
      if (!signal?.aborted && requestVersion === version.current) setUser(data.user);
      return data.user;
    } finally {
      if (!signal?.aborted && requestVersion === version.current) setLoading(false);
    }
  }, []);
  useEffect(() => {
    if (pathname.startsWith('/admin')) return;
    const controller = new AbortController();
    const check = () => { refresh(controller.signal).catch(() => {}); };
    check();
    const interval = window.setInterval(check, 60000);
    window.addEventListener('focus', check);
    return () => { controller.abort(); window.clearInterval(interval); window.removeEventListener('focus', check); };
  }, [pathname, refresh]);
  return <AccountContext.Provider value={{ user, loading, refresh }}>{children}</AccountContext.Provider>;
}

export const useAccount = () => useContext(AccountContext);
