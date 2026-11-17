'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserRound } from 'lucide-react';
import { useAccount } from './account-provider';
import { accountLoginHref } from '@/lib/account';

export function AccountLink() {
  const { user } = useAccount();
  const path = usePathname();
  return <Link href={user ? '/minha-conta/' : path === '/finalizar/' || path === '/finalizar' ? accountLoginHref('/finalizar/?etapa=dados') : '/entrar/'} aria-label={user ? 'Minha conta' : 'Entrar'} className="header-account"><UserRound size={18} /><span>{user ? 'Minha conta' : 'Entrar'}</span></Link>;
}
