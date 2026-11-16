import { api } from '@/server/http';
import { requireAdmin } from '@/server/auth';
import { adminCatalog } from '@/server/admin-service';
export async function GET(request: Request) { return api(async () => { await requireAdmin(); return adminCatalog(); }, request); }
