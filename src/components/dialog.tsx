'use client';
import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
export function Dialog({ title, close, children, drawer = false }: { title: string; close: () => void; children: ReactNode; drawer?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    d?.showModal();
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { d?.close(); document.body.style.overflow = original; };
  }, []);
  return <dialog ref={ref} className={`dialog ${drawer ? 'drawer' : ''}`} aria-label={title} onCancel={e => { e.preventDefault(); close(); }} onClick={e => { if (e.target === e.currentTarget) close(); }}>
    <div className="dialog-inner"><header className="dialog-heading"><h2>{title}</h2><button type="button" className="icon-button" onClick={close} aria-label="Fechar"><X size={22} /></button></header>{children}</div>
  </dialog>;
}
