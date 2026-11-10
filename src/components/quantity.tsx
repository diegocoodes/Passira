import { Minus, Plus } from 'lucide-react';
export function Quantity({ value, change, max = 99, min = 1, label = 'Quantidade' }: { value: number; change: (n: number) => void; max?: number; min?: number; label?: string }) {
  return <div className="quantity" role="group" aria-label={label}><button type="button" disabled={value <= min} onClick={() => change(value - 1)} aria-label={`Diminuir ${label}`}><Minus size={15} /></button><span aria-live="polite">{value}</span><button type="button" disabled={value >= max} onClick={() => change(value + 1)} aria-label={`Aumentar ${label}`}><Plus size={15} /></button></div>;
}
