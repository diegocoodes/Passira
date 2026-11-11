import { api } from '@/server/http';
import { getCatalog } from '@/server/catalog';
export async function GET() { return api(getCatalog); }
