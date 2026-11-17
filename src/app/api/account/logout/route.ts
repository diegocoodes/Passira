import { api, checkOrigin } from '@/server/http';
import { endCustomerSession } from '@/server/customer-auth';

export async function POST(request: Request) {
  return api(async () => { checkOrigin(request); await endCustomerSession(); return { ok: true }; }, request);
}
