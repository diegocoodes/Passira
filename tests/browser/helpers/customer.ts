import { expect, type Page } from '@playwright/test';
import type { AccountUser } from '../../../src/lib/account';

export async function signInCustomer(page: Page, group: string): Promise<AccountUser> {
  const origin = 'http://127.0.0.1:3100';
  const credentials = { email: `${group}@passira.local`, password: 'senha-fixture-cliente-123' };
  let response = await page.request.post('/api/account/login/', { headers: { origin }, data: credentials });
  if (response.status() === 401) response = await page.request.post('/api/account/register/', { headers: { origin }, data: { ...credentials, name: 'Cliente da Passira', phone: '81999999999', cpf: '52998224725' } });
  expect(response.ok()).toBe(true);
  return (await response.json()).user;
}
