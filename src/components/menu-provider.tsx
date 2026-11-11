'use client';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { indexCatalog, initialCatalog } from '@/data/menu';
import type { Catalog } from '@/data/types';
import { createMenu } from '@/lib/menu';

function prepare(catalog: Catalog) { return { ...indexCatalog(catalog), ...createMenu(catalog) }; }
const MenuContext = createContext(prepare(initialCatalog));
export function MenuProvider({ initial, children }: { initial: Catalog; children: React.ReactNode }) {
  const [catalog, setCatalog] = useState(initial);
  const pathname = usePathname();
  useEffect(() => {
    const controller = new AbortController();
    const refresh = () => fetch('/api/menu/', { cache: 'no-store', signal: controller.signal }).then(response => response.ok ? response.json() : null).then(data => { if (data) setCatalog(previous => JSON.stringify(previous) === JSON.stringify(data) ? previous : data); }).catch(() => {});
    refresh();
    const interval = window.setInterval(refresh, 30000);
    window.addEventListener('focus', refresh);
    return () => { controller.abort(); window.clearInterval(interval); window.removeEventListener('focus', refresh); };
  }, [pathname]);
  const value = useMemo(() => prepare(catalog), [catalog]);
  return <MenuContext.Provider value={value}>{children}</MenuContext.Provider>;
}
export const useMenu = () => useContext(MenuContext);
