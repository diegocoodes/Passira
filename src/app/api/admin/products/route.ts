import { api, readJson } from '@/server/http';
import { requireAdmin } from '@/server/auth';
import { saveProduct } from '@/server/admin-service';
export async function POST(request: Request) { return api(async () => { const actor = await requireAdmin(); return saveProduct(await readJson(request), undefined, actor); }, request); }
