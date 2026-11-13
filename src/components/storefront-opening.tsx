'use client';

import { useEffect, useRef, type CSSProperties } from 'react';
import { ArrowRight, Flame } from 'lucide-react';
import { BrandLogo } from './brand-logo';

const sessionKey = 'passira-opening-seen';

function OpeningPizza() {
  return <svg className="opening-pizza" viewBox="0 0 280 280" aria-hidden="true" focusable="false">
    <circle className="opening-plate" cx="140" cy="140" r="130" fill="none" stroke="currentColor" strokeWidth="1" />
    <g className="opening-pizza-turn" transform="translate(20 20)">
      {Array.from({ length: 6 }, (_, index) => <g key={index} transform={`rotate(${index * 60} 120 120)`}>
        <g className="opening-slice" style={{ '--slice-delay': `${index * 95 + 180}ms` } as CSSProperties}>
          <path d="M120 120 120 24A96 96 0 0 1 203.14 72Z" fill="white" stroke="white" strokeWidth="5" strokeLinejoin="round" />
          <path d="M120 112 124 39A81 81 0 0 1 187 77Z" fill="#bb0d16" />
          <path d="M130 49Q145 43 151 54T173 70L129 103Z" fill="#fff0f1" />
          <circle cx="137" cy="65" r="9" fill="#df101b" /><circle cx="160" cy="77" r="8" fill="#df101b" />
          <path d="M146 85Q142 66 154 64Q164 78 146 85Z" fill="#006b36" />
          <path d="M128 41A80 80 0 0 1 182 71" fill="none" stroke="#fff0f1" strokeWidth="7" strokeLinecap="round" />
        </g>
      </g>)}
    </g>
    <g className="opening-steam" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round">
      <path d="M113 31q-9-10 0-20t0-20" /><path d="M140 24q-9-10 0-20t0-20" /><path d="M167 31q-9-10 0-20t0-20" />
    </g>
  </svg>;
}

export function StorefrontOpening() {
  const dialog = useRef<HTMLDialogElement>(null);
  const shouldPlay = useRef<boolean | null>(null);
  const close = useRef<(() => void) | null>(null);

  useEffect(() => {
    const element = dialog.current;
    if (!element || typeof element.showModal !== 'function') return;
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (shouldPlay.current === null) {
      let seen = false;
      try { seen = sessionStorage.getItem(sessionKey) === '1'; sessionStorage.setItem(sessionKey, '1'); } catch {}
      const directLink = !!window.location.hash || new URLSearchParams(window.location.search).has('categoria');
      shouldPlay.current = !seen && !directLink && !preference.matches;
    }
    if (!shouldPlay.current || preference.matches) return;

    const originalOverflow = document.body.style.overflow;
    let timer: number | undefined;
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      window.clearTimeout(timer);
      element.close();
      document.body.style.overflow = originalOverflow;
      preference.removeEventListener('change', changedPreference);
      document.removeEventListener('visibilitychange', visibilityChanged);
      window.removeEventListener('pagehide', finish);
    };
    const changedPreference = () => { if (preference.matches) finish(); };
    const visibilityChanged = () => { if (document.hidden) finish(); };
    close.current = finish;
    element.showModal();
    document.body.style.overflow = 'hidden';
    timer = window.setTimeout(finish, 2600);
    preference.addEventListener('change', changedPreference);
    document.addEventListener('visibilitychange', visibilityChanged);
    window.addEventListener('pagehide', finish);
    return () => { finish(); close.current = null; };
  }, []);

  return <dialog ref={dialog} className="storefront-opening" aria-label="Boas-vindas à Passira" aria-describedby="opening-message" onCancel={event => { event.preventDefault(); close.current?.(); }}>
    <div className="opening-door opening-door-left" aria-hidden="true" />
    <div className="opening-door opening-door-right" aria-hidden="true" />
    <button type="button" className="opening-skip" onClick={() => close.current?.()}>Pular abertura<ArrowRight size={16} /></button>
    <div className="opening-scene">
      <div className="opening-logo"><BrandLogo /></div>
      <div className="opening-pizza-stage"><OpeningPizza /><span className="opening-pizza-seal" aria-hidden="true"><Flame size={20} /><span>É Passira.</span></span></div>
      <p className="opening-eyebrow">PIZZARIA E RESTAURANTE</p>
      <p className="opening-title" id="opening-message">O sabor está<br /><span>chegando.</span></p>
      <p className="opening-caption">Sua mesa é aqui.</p>
    </div>
    <div className="opening-location" aria-hidden="true"><span>Passira San Martin</span><span>Recife, PE</span></div>
  </dialog>;
}
