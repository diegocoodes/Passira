import { api, readJson } from '@/server/http';
import { rateLimit } from '@/server/auth';
import { createOrder } from '@/server/order-service';
export async function POST(request: Request) {
  return api(async () => { const data = await readJson(request); await rateLimit(`order:${request.headers.get('x-forwarded-for') || 'local'}`, 30, 600); return createOrder(data); });
}
