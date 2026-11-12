import { api } from '@/server/http';
import { salesHighlights } from '@/server/storefront-insights';

export async function GET() { return api(() => salesHighlights()); }
