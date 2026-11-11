export async function requestJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, { cache: 'no-store', ...options, headers: { 'Content-Type': 'application/json', ...options?.headers } });
  const data = await response.json();
  if (!response.ok) {
    if (response.status === 401 && url.startsWith('/api/admin/') && !url.includes('/login/')) window.location.assign('/admin/entrar/');
    throw new Error(data.error || 'Não foi possível concluir a operação.');
  }
  return data as T;
}
export function moneyToCents(value: string): number | null {
  if (!value.trim()) return null;
  const normalized = value.trim().replace(',', '.');
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) throw new Error('Informe valores com até duas casas decimais.');
  return Math.round(Number(normalized) * 100);
}
export const centsToInput = (value: number | null | undefined) => value === null || value === undefined ? '' : (value / 100).toFixed(2);
