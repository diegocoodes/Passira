import { api } from '@/server/http';
import { rateLimit } from '@/server/auth';
import { trackedOrderByNumber } from '@/server/order-service';

export async function GET(request: Request, { params }: { params: Promise<{ number: string }> }) {
  return api(async () => {
    await rateLimit(`tracking:${request.headers.get('x-forwarded-for') || 'local'}`, 60, 60);
    const value = (await params).number;
    return trackedOrderByNumber(/^\d{1,10}$/.test(value) ? Number(value) : NaN);
  });
}
