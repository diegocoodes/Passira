import { api, checkOrigin } from '@/server/http';
import { endSession } from '@/server/auth';
export async function POST(request: Request) { return api(async () => { checkOrigin(request); await endSession(); return { ok: true }; }); }
