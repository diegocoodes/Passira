import { api, readJson } from '@/server/http';
import { rateLimit } from '@/server/auth';
import { createOrder } from '@/server/order-service';
import { requireCustomer } from '@/server/customer-auth';
export async function POST(request: Request) {
  return api(async () => { const customer = await requireCustomer(); const data = await readJson(request); await rateLimit(`order:${customer.id}`, 30, 600); return createOrder(data, customer.id); }, request);
}
