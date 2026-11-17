import { api, readJson } from '@/server/http';
import { rateLimit } from '@/server/auth';
import { registerCustomer, startCustomerSession } from '@/server/customer-auth';

export async function POST(request: Request) {
  return api(async () => {
    const input = await readJson(request);
    await rateLimit(`customer-register:${request.headers.get('x-forwarded-for') || 'local'}`, 10, 3600);
    const user = await registerCustomer(input);
    await startCustomerSession(user.id);
    return { user };
  }, request);
}
