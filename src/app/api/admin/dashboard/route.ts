import { api } from '@/server/http';
import { requireAdmin } from '@/server/auth';
import { dashboard } from '@/server/admin-service';
import { todayInRecife } from '@/lib/order-status';
export async function GET(request: Request) { return api(async () => { await requireAdmin(); return dashboard(new URL(request.url).searchParams.get('day') || todayInRecife()); }); }
