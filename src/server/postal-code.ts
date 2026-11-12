import { HttpError } from './auth';

export type PostalAddress = { cep: string; street: string; neighborhood: string; city: string; state: string };

export async function lookupPostalCode(cep: string, fetcher: typeof fetch = fetch): Promise<PostalAddress> {
  if (!/^\d{8}$/.test(cep)) throw new HttpError(400, 'Informe um CEP com 8 dígitos.');
  let response: Response;
  try {
    response = await fetcher(`https://viacep.com.br/ws/${cep}/json/`, { signal: AbortSignal.timeout(5000), next: { revalidate: 86400 } });
  } catch { throw new HttpError(503, 'Não foi possível consultar o CEP. Preencha o endereço manualmente.'); }
  if (!response.ok) throw new HttpError(503, 'A consulta de CEP está indisponível. Preencha o endereço manualmente.');
  let data: Record<string, unknown>;
  try { data = await response.json(); } catch { throw new HttpError(503, 'A consulta de CEP está indisponível. Preencha o endereço manualmente.'); }
  if (!data || data.erro || typeof data.cep !== 'string') throw new HttpError(404, 'CEP não encontrado. Confira os números ou preencha o endereço manualmente.');
  const text = (key: string) => typeof data[key] === 'string' ? data[key].slice(0, 150) : '';
  return { cep, street: text('logradouro'), neighborhood: text('bairro'), city: text('localidade'), state: text('uf') };
}
