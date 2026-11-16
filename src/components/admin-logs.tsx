'use client';
import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Download, RefreshCw, ScrollText, Search } from 'lucide-react';
import { logCategories, logLevels, type LogsPage } from '@/lib/system-logs';
import { requestJson } from '@/lib/api-client';
import { todayInRecife, statusLabels } from '@/lib/order-status';
import type { OrderStatus } from '@/data/types';

const detailLabels: Record<string, string> = { previousStatus: 'Etapa anterior', status: 'Nova etapa', totalCents: 'Total em centavos', cents: 'Valor em centavos', itemCount: 'Quantidade de itens', variantCount: 'Opções de preço', rowCount: 'Registros exportados', regionCount: 'Regiões de entrega', code: 'Código do diagnóstico', statusCode: 'Resposta HTTP', method: 'Método', route: 'Rota', changedFields: 'Campos enviados' };
const fieldLabels: Record<string, string> = { name: 'nome', description: 'descrição', categoryId: 'categoria', kind: 'tipo', photoUrl: 'foto', enabled: 'disponibilidade', blocked: 'conferência', optionGroupIds: 'adicionais', variants: 'preços e custos' };
const dateFormat = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Recife', dateStyle: 'short', timeStyle: 'medium' });
function detailValue(key: string, value: unknown) {
  if ((key === 'status' || key === 'previousStatus') && typeof value === 'string') return statusLabels[value as OrderStatus] || value;
  if (Array.isArray(value)) return value.map(item => fieldLabels[String(item)] || String(item)).join(', ');
  return String(value);
}

export function AdminLogs() {
  const [filters, setFilters] = useState(() => ({ from: todayInRecife(), to: todayInRecife(), category: '', level: '', q: '' }));
  const [cursors, setCursors] = useState(['']), [index, setIndex] = useState(0), [revision, setRevision] = useState(0);
  const [page, setPage] = useState<LogsPage | null>(null), [error, setError] = useState(''), [loading, setLoading] = useState(true), [exporting, setExporting] = useState(false);
  const cursor = cursors[index];
  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({ ...filters, cursor });
    setLoading(true); setError(''); setPage(null);
    requestJson<LogsPage>(`/api/admin/logs/?${params}`, { signal: controller.signal })
      .then(setPage).catch(error => { if (error.name !== 'AbortError') setError(error.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [filters, cursor, revision]);

  const exportCsv = async () => {
    setExporting(true); setError('');
    try {
      const response = await fetch(`/api/admin/logs/?${new URLSearchParams({ ...filters, format: 'csv' })}`, { credentials: 'same-origin', cache: 'no-store' });
      if (!response.ok) throw new Error('Não foi possível exportar. Confira sua sessão e tente novamente.');
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement('a'); link.href = url; link.download = 'passira-registros.csv'; document.body.appendChild(link); link.click(); link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) { setError(error instanceof Error ? error.message : 'Não foi possível exportar os registros.'); }
    finally { setExporting(false); }
  };

  return <section className="admin-surface admin-logs" aria-busy={loading}>
    <div className="admin-section-title"><div><p className="eyebrow">HISTÓRICO DA OPERAÇÃO</p><h2>O que aconteceu na loja</h2><p className="admin-help">Acessos, alterações, pedidos e falhas registrados a partir da ativação deste recurso.</p></div><ScrollText size={24} /></div>
    <form className="admin-log-filters" onSubmit={event => {
      event.preventDefault(); const values = new FormData(event.currentTarget);
      setFilters({ from: String(values.get('from') || ''), to: String(values.get('to') || ''), category: String(values.get('category') || ''), level: String(values.get('level') || ''), q: String(values.get('q') || '').trim() }); setIndex(0); setCursors(['']);
    }}>
      <label className="field"><span>Data inicial</span><input type="date" name="from" defaultValue={filters.from} /></label>
      <label className="field"><span>Data final</span><input type="date" name="to" defaultValue={filters.to} /></label>
      <label className="field"><span>Área</span><select name="category" defaultValue=""><option value="">Todas as áreas</option>{Object.entries(logCategories).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
      <label className="field"><span>Nível</span><select name="level" defaultValue=""><option value="">Todos os níveis</option>{Object.entries(logLevels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
      <label className="field admin-log-search"><span>Buscar nos registros</span><input name="q" maxLength={100} placeholder="Evento, responsável ou referência" /></label>
      <button type="submit" className="button primary" disabled={loading}><Search size={17} />Filtrar registros</button>
    </form>
    <div className="admin-log-toolbar"><span aria-live="polite">{page ? `${page.total} registro(s) encontrado(s)` : loading ? 'Buscando registros…' : 'Consulta indisponível'}</span><div><button type="button" className="button secondary" disabled={loading} onClick={() => { setIndex(0); setCursors(['']); setRevision(value => value + 1); }}><RefreshCw size={16} />Atualizar registros</button><button type="button" className="button secondary" disabled={loading || exporting || !page?.total} onClick={exportCsv}><Download size={16} />{exporting ? 'Exportando…' : 'Exportar CSV'}</button></div></div>
    {error && <p className="admin-alert" role="alert">{error}</p>}
    {loading && <p className="admin-empty" role="status">Carregando registros…</p>}
    {page && !page.entries.length && <div className="admin-empty"><ScrollText size={28} /><p>Nenhum registro neste período.</p><small>Altere os filtros para consultar outras datas ou áreas.</small></div>}
    {!!page?.entries.length && <ol className="admin-log-list">{page.entries.map(entry => <li key={entry.id} className={`admin-log-entry ${entry.level}`}>
      <div className="admin-log-moment"><time dateTime={entry.createdAt}>{dateFormat.format(new Date(entry.createdAt))}</time><span className={`admin-log-level ${entry.level}`}>{logLevels[entry.level]}</span></div>
      <div className="admin-log-event"><h3>{entry.summary}</h3><p>{logCategories[entry.category]}{entry.entityId && <span>Referência: {entry.category === 'orders' ? '#' : ''}{entry.entityId}</span>}</p></div>
      <div className="admin-log-actor"><span>Responsável</span><strong>{entry.actorEmail || 'Sistema'}</strong></div>
      <details><summary>Ver detalhes</summary><dl>{Object.entries(entry.details).map(([key, value]) => <div key={key}><dt>{detailLabels[key] || key}</dt><dd>{detailValue(key, value)}</dd></div>)}{entry.requestId && <div><dt>Código da solicitação</dt><dd><code>{entry.requestId}</code></dd></div>}</dl></details>
    </li>)}</ol>}
    {page && <div className="admin-log-pagination"><span>Página {index + 1}</span><div><button type="button" className="button secondary" disabled={loading || index === 0} onClick={() => setIndex(value => value - 1)}><ChevronLeft size={16} />Anterior</button><button type="button" className="button secondary" disabled={loading || !page.nextCursor} onClick={() => { setCursors(values => [...values.slice(0, index + 1), page.nextCursor!]); setIndex(value => value + 1); }}>Próxima<ChevronRight size={16} /></button></div></div>}
    <p className="admin-help">Horários em Recife. O CSV contém até 5.000 registros dos filtros aplicados. Para exportar mais, divida a consulta em períodos menores. Senhas, tokens e dados pessoais dos clientes não são gravados aqui.</p>
  </section>;
}
