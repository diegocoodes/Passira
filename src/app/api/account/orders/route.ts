import { api } from '@/server/http';
import { requireCustomer } from '@/server/customer-auth';
import { customerOrders } from '@/server/order-service';

export async function GET(request: Request) {
  return api(async () => {
    const user = await requireCustomer();
    const before = new URL(request.url).searchParams.get('before');
    return customerOrders(user.id, before === null ? undefined : /^\d+$/.test(before) ? Number(before) : NaN);
  }, request);
}
