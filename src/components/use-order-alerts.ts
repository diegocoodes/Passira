'use client';
import { useEffect, useRef, useState } from 'react';
import type { Order } from '@/data/types';

export function newlyReceived(known: Set<string>, orders: Order[]) {
  return orders.filter(order => order.status === 'received' && !known.has(String(order.number || order.id)));
}

function playTone(context: AudioContext) {
  if (context.state !== 'running') return;
  [0, .2].forEach((delay, index) => {
    const oscillator = context.createOscillator(), gain = context.createGain();
    const start = context.currentTime + delay;
    oscillator.type = 'sine'; oscillator.frequency.value = index ? 1100 : 880;
    gain.gain.setValueAtTime(0, start); gain.gain.linearRampToValueAtTime(.07, start + .02); gain.gain.linearRampToValueAtTime(0, start + .15);
    oscillator.connect(gain); gain.connect(context.destination);
    oscillator.start(start); oscillator.stop(start + .16);
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
  });
}

export function useOrderAlerts(orders: Order[] | undefined) {
  const [enabled, setEnabled] = useState(false);
  const [message, setMessage] = useState('');
  const [soundError, setSoundError] = useState('');
  const [changing, setChanging] = useState(false);
  const known = useRef<Set<string> | null>(null);
  const audio = useRef<AudioContext | null>(null);
  useEffect(() => {
    if (!orders) return;
    if (!known.current) { known.current = new Set(orders.map(order => String(order.number || order.id))); return; }
    const fresh = newlyReceived(known.current, orders);
    orders.forEach(order => known.current!.add(String(order.number || order.id)));
    if (fresh.length) {
      setMessage(fresh.length === 1 ? `Novo pedido ${fresh[0].id} recebido.` : `${fresh.length} novos pedidos recebidos.`);
      if (enabled && audio.current) playTone(audio.current);
    }
  }, [orders, enabled]);
  useEffect(() => { if (!message) return; const timeout = window.setTimeout(() => setMessage(''), 12000); return () => window.clearTimeout(timeout); }, [message]);
  useEffect(() => () => { if (audio.current && audio.current.state !== 'closed') void audio.current.close().catch(() => {}); }, []);
  const toggle = async () => {
    if (changing) return;
    if (enabled) { setEnabled(false); return; }
    setChanging(true); setSoundError('');
    try {
      if (!window.AudioContext) throw new Error('unsupported');
      audio.current ??= new AudioContext();
      await audio.current.resume();
      if (audio.current.state !== 'running') throw new Error('suspended');
      setEnabled(true); playTone(audio.current);
    } catch { setSoundError('Não foi possível ativar o som neste navegador. Os avisos visuais continuam disponíveis.'); }
    finally { setChanging(false); }
  };
  return { enabled, message, soundError, changing, toggle };
}
