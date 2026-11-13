'use client';
import { useEffect, type RefObject } from 'react';

export function useRevealMotion(root: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const element = root.current;
    if (!element || !window.IntersectionObserver || !Element.prototype.animate) return;
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    let observed = new WeakSet<Element>();
    const animations = new Set<Animation>();
    const selector = '.hero h1, .hero-pizza img, .house-selection .section-heading h2, .product-card';
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      observer.unobserve(entry.target);
      if (preference.matches) return;
      const animation = entry.target.animate([{ opacity: .3, transform: 'translateY(10px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 260, easing: 'cubic-bezier(.2,.7,.3,1)' });
      animations.add(animation);
      animation.onfinish = animation.oncancel = () => animations.delete(animation);
    }), { threshold: .08 });
    const scan = () => {
      if (preference.matches) return;
      element.querySelectorAll(selector).forEach(node => { if (!observed.has(node)) { observed.add(node); observer.observe(node); } });
    };
    const changedPreference = () => { if (preference.matches) { observer.disconnect(); animations.forEach(animation => animation.cancel()); } else { observed = new WeakSet<Element>(); scan(); } };
    const mutations = new MutationObserver(scan);
    scan(); mutations.observe(element, { childList: true, subtree: true });
    preference.addEventListener('change', changedPreference);
    return () => { observer.disconnect(); mutations.disconnect(); animations.forEach(animation => animation.cancel()); preference.removeEventListener('change', changedPreference); };
  }, [root]);
}
