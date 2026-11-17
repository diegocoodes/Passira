import { z } from 'zod';
import { api, readJson } from '@/server/http';
import { rateLimit } from '@/server/auth';
import { authenticateCustomer, startCustomerSession } from '@/server/customer-auth';

export async function POST(request: Request) {
  return api(async () => {
    const data = z.object({ email: z.string().trim().max(191), password: z.string().max(128) }).parse(await readJson(request));
    await rateLimit(`customer-login:${data.email.toLowerCase()}`, 10, 900);
    await rateLimit(`customer-login-ip:${request.headers.get('x-forwarded-for') || 'local'}`, 50, 900);
    const user = await authenticateCustomer(data);
    await startCustomerSession(user.id);
    return { user };
  }, request);
}
