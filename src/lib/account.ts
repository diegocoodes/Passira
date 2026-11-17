import type { Customer } from '@/data/types';

export type AccountUser = { id: string; name: string; email: string; phone: string; cpf: string | null };

export const blankCustomer: Customer = { name: '', phone: '', cpf: '', cep: '', street: '', number: '', neighborhood: '', complement: '', note: '', payment: 'pix' };

export function customerForAccount(user: AccountUser, draft: Customer | null, draftAccountId: string | null): Customer {
  const ownedDraft = draftAccountId === user.id;
  const preserved = !draftAccountId || ownedDraft ? draft : null;
  return {
    ...blankCustomer, ...preserved,
    name: ownedDraft && draft?.name ? draft.name : user.name,
    phone: ownedDraft && draft?.phone ? draft.phone : user.phone,
    cpf: ownedDraft && draft?.cpf ? draft.cpf : user.cpf || '',
  };
}

// Only destinations used by the customer flow can follow authentication.
export function accountDestination(value?: string | string[]): string {
  if (typeof value !== 'string') return '/minha-conta/';
  if (['/finalizar/', '/finalizar/?etapa=dados', '/finalizar/?etapa=conferencia', '/minha-conta/'].includes(value)) return value;
  if (/^\/minha-conta\/pedidos\/[1-9]\d{0,9}\/$/.test(value)) return value;
  return '/minha-conta/';
}

export const accountLoginHref = (next = '/minha-conta/') => `/entrar/?next=${encodeURIComponent(accountDestination(next))}`;
