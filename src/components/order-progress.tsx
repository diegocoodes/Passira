import { Check } from 'lucide-react';
import type { Fulfillment, OrderStatus } from '@/data/types';
import { statusLabels } from '@/lib/order-status';

export function OrderProgress({ status, fulfillment, events }: { status: OrderStatus; fulfillment: Fulfillment; events: { status: OrderStatus; createdAt: string }[] }) {
  const steps: OrderStatus[] = ['received', 'accepted', 'preparing', 'ready', ...(fulfillment === 'delivery' ? ['out_for_delivery' as const] : []), 'completed'];
  if (status === 'cancelled') return null;
  return <ol className="tracking-steps" aria-label="Etapas do pedido">{steps.map((step, index) => {
    const event = events.find(event => event.status === step);
    return <li key={step} className={event ? 'done' : ''} aria-current={step === status ? 'step' : undefined}><span>{event ? <Check size={17} /> : index + 1}</span><div><strong>{statusLabels[step]}</strong>{event && <small>{new Date(event.createdAt).toLocaleTimeString('pt-BR', { timeZone: 'America/Recife', hour: '2-digit', minute: '2-digit' })}</small>}</div></li>;
  })}</ol>;
}

export function orderStatusMessage(status: OrderStatus, fulfillment: Fulfillment) {
  return status === 'received' ? 'Recebemos seu pedido. Aguarde a aceitação da equipe.' : status === 'accepted' ? 'A equipe aceitou seu pedido. Logo começa o preparo.' : status === 'preparing' ? 'Seu pedido está sendo preparado com cuidado.' : status === 'ready' ? fulfillment === 'pickup' ? 'Tudo pronto! Você já pode retirar seu pedido na loja.' : 'Tudo pronto! Aguardando a saída para entrega.' : status === 'out_for_delivery' ? 'Seu pedido está a caminho.' : status === 'completed' ? 'Pedido concluído. Obrigado por escolher a Passira!' : 'Este pedido foi cancelado. Fale com a loja se precisar de ajuda.';
}
