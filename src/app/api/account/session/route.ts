import { api } from '@/server/http';
import { currentCustomer } from '@/server/customer-auth';

export async function GET(request: Request) { return api(async () => ({ user: await currentCustomer() }), request); }
