import { api } from '@/server/http';
import { lookupPostalCode } from '@/server/postal-code';

export async function GET(_request: Request, { params }: { params: Promise<{ cep: string }> }) {
  return api(async () => lookupPostalCode((await params).cep));
}
