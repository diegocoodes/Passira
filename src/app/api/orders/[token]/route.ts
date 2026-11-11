import { api } from '@/server/http';
import { trackedOrder } from '@/server/order-service';
export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) { return api(async () => trackedOrder((await params).token)); }
