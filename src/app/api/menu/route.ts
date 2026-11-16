import { api } from '@/server/http';
import { getCatalog } from '@/server/catalog';
export async function GET(request: Request) { return api(getCatalog, request); }
