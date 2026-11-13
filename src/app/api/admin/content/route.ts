import { requireAdmin } from '@/server/auth';
import { api, readJson } from '@/server/http';
import { getStorefrontContent, saveStorefrontContent } from '@/server/storefront-content';

export async function GET() {
  return api(async () => { await requireAdmin(); return getStorefrontContent(); });
}

export async function PUT(request: Request) {
  return api(async () => { await requireAdmin(); return saveStorefrontContent(await readJson(request)); });
}
