export const logCategories = { access: 'Acessos', orders: 'Pedidos', products: 'Produtos', expenses: 'Despesas', settings: 'Configurações', system: 'Sistema' } as const;
export const logLevels = { info: 'Informação', warning: 'Atenção', error: 'Erro' } as const;
export const logActions = {
  'access.login': ['access', 'Entrada no painel'],
  'access.login_failed': ['access', 'Tentativa de acesso recusada'],
  'access.logout': ['access', 'Saída do painel'],
  'access.password_changed': ['access', 'Senha administrativa alterada'],
  'access.password_rejected': ['access', 'Alteração de senha recusada'],
  'orders.created': ['orders', 'Pedido recebido'],
  'orders.status_changed': ['orders', 'Etapa do pedido alterada'],
  'products.created': ['products', 'Produto criado'],
  'products.updated': ['products', 'Produto atualizado'],
  'products.deleted': ['products', 'Produto excluído'],
  'expenses.created': ['expenses', 'Despesa cadastrada'],
  'expenses.deleted': ['expenses', 'Despesa excluída'],
  'settings.delivery_updated': ['settings', 'Taxas de entrega e custos atualizados'],
  'settings.content_updated': ['settings', 'Conteúdo da loja atualizado'],
  'system.request_failed': ['system', 'Falha em uma solicitação'],
  'system.request_blocked': ['system', 'Solicitação bloqueada'],
  'system.logs_exported': ['system', 'Registros exportados'],
} as const;
export type LogAction = keyof typeof logActions;
export type LogCategory = keyof typeof logCategories;
export type LogLevel = keyof typeof logLevels;
export type LogEntry = { id: string; createdAt: string; level: LogLevel; category: LogCategory; action: LogAction; summary: string; actorEmail: string | null; entityId: string | null; requestId: string | null; details: Record<string, unknown> };
export type LogsPage = { entries: LogEntry[]; total: number; nextCursor: string | null };
