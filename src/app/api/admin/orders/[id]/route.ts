import { z } from 'zod';
import { api, readJson } from '@/server/http';
import { requireAdmin } from '@/server/auth';
import { changeStatus } from '@/server/order-service';
const status = z.enum(['received', 'accepted', 'preparing', 'ready', 'out_for_delivery', 'completed', 'cancelled']);
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) { return api(async () => {
  await requireAdmin(); const id = z.coerce.number().int().positive().parse((await params).id);
  const data = z.object({ expected: status, status }).parse(await readJson(request));
  return changeStatus(id, data.expected, data.status);
}); }
