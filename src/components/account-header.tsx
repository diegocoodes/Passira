import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { BrandLogo } from './brand-logo';
import { AccountLink } from './account-link';

export function AccountHeader() {
  return <header className="site-header"><div className="header-inner"><Link href="/" className="brand" aria-label="Passira, início"><BrandLogo /></Link><nav className="account-header-actions" aria-label="Menu da conta"><Link href="/#cardapio" className="checkout-back"><ArrowLeft size={17} /><span>Ver cardápio</span></Link><AccountLink /></nav></div></header>;
}
