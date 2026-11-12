'use client';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { indexCatalog, initialCatalog } from '@/data/menu';
import type { Catalog } from '@/data/types';
import { createMenu } from '@/lib/menu';

function prepare(catalog: Catalog, bestSellerIds: string[] = []) { return { ...indexCatalog(catalog), ...createMenu(catalog), bestSellerIds }; }
const MenuContext = createContext(prepare(initialCatalog));
export function MenuProvider({ initial, children }: { initial: Catalog; children: React.ReactNode }) {
  const [catalog, setCatalog] = useState(initial);
  const [bestSellerIds, setBestSellerIds] = useState<string[]>([]);
  const pathname = usePathname();
  useEffect(() => {
    const controller = new AbortController();
    const refresh = () => fetch('/api/menu/', { cache: 'no-store', signal: controller.signal }).then(response => response.ok ? response.json() : null).then(data => { if (data) setCatalog(previous => JSON.stringify(previous) === JSON.stringify(data) ? previous : data); }).catch(() => {});
    refresh();
    const interval = window.setInterval(refresh, 30000);
    window.addEventListener('focus', refresh);
    return () => { controller.abort(); window.clearInterval(interval); window.removeEventListener('focus', refresh); };
  }, [pathname]);
  useEffect(() => {
    if (pathname.startsWith('/admin')) return;
    const controller = new AbortController();
    const refresh = () => fetch('/api/menu/highlights/', { cache: 'no-store', signal: controller.signal }).then(response => response.ok ? response.json() : null).then(data => {
      if (Array.isArray(data?.productIds) && data.productIds.every((id: unknown) => typeof id === 'string')) setBestSellerIds(data.productIds);
    }).catch(() => {});
    refresh();
    const interval = window.setInterval(refresh, 60000);
    window.addEventListener('focus', refresh);
    return () => { controller.abort(); window.clearInterval(interval); window.removeEventListener('focus', refresh); };
  }, [pathname]);
  const value = useMemo(() => prepare(catalog, bestSellerIds), [catalog, bestSellerIds]);
  return <MenuContext.Provider value={value}>{children}</MenuContext.Provider>;
}
export const useMenu = () => useContext(MenuContext);
