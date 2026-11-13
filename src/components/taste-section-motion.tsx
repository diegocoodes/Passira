'use client';

import { useEffect } from 'react';

// Load the original skill modules as public ES modules; keep their lifecycle in sync with React navigation.
export function TasteSectionMotion() {
  useEffect(() => {
    const section = document.getElementById('a-passira');
    if (!section) return;
    let active = true;
    let dispose: (() => void) | undefined;
    const momentsUrl = '/assets/moments/moments.js';
    const motionUrl = '/assets/motion/motion.js';
    import(/* webpackIgnore: true */ momentsUrl).then(module => {
      if (!active) return;
      dispose = () => module.unmountAll(section);
      void module.mountAll(section).then(() => { if (!active) module.unmountAll(section); });
    }).catch(() => {});
    import(/* webpackIgnore: true */ motionUrl).then(module => { if (active) module.refresh(); }).catch(() => {});
    return () => { active = false; dispose?.(); };
  }, []);
  return <>
    <link rel="stylesheet" href="/assets/motion/motion.css" precedence="default" />
    <link rel="modulepreload" href="/assets/moments/moments.js" />
    <link rel="modulepreload" href="/assets/moments/lib.js" />
    <link rel="modulepreload" href="/assets/moments/picture-develops/moment.js" />
  </>;
}
