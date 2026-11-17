export type AccountUser = { id: string; name: string; email: string; phone: string };

// Only destinations used by the customer flow can follow authentication.
export function accountDestination(value?: string | string[]): string {
  if (typeof value !== 'string') return '/minha-conta/';
  if (['/finalizar/', '/finalizar/?etapa=dados', '/finalizar/?etapa=conferencia', '/minha-conta/'].includes(value)) return value;
  if (/^\/minha-conta\/pedidos\/[1-9]\d{0,9}\/$/.test(value)) return value;
  return '/minha-conta/';
}

export const accountLoginHref = (next = '/minha-conta/') => `/entrar/?next=${encodeURIComponent(accountDestination(next))}`;
