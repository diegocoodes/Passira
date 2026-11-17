import { api, readJson } from '@/server/http';
import { rateLimit } from '@/server/auth';
import { requireCustomer, saveCustomerProfile } from '@/server/customer-auth';

export async function PATCH(request: Request) {
  return api(async () => {
    const user = await requireCustomer();
    const input = await readJson(request);
    await rateLimit(`customer-profile:${user.id}`, 30, 600);
    return { user: await saveCustomerProfile(user.id, input) };
  }, request);
}
