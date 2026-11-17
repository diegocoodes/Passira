import { api } from '@/server/http';
import { requireCustomer } from '@/server/customer-auth';
import { customerOrder } from '@/server/order-service';

export async function GET(request: Request, { params }: { params: Promise<{ number: string }> }) {
  return api(async () => {
    const user = await requireCustomer();
    const { number } = await params;
    return customerOrder(user.id, /^[1-9]\d*$/.test(number) ? Number(number) : NaN);
  }, request);
}
