import { ArrowLeft, ArrowRight, LockKeyhole, MapPin, PackageSearch, Pizza } from 'lucide-react';
import { errorContent } from '@/lib/error-pages';
import { BrandLogo } from './brand-logo';
import { ErrorRetryButton } from './error-retry-button';
import '@/app/error-pages.css';

function MissingSlice() {
  return <svg viewBox="0 0 360 360" fill="none" aria-hidden="true" focusable="false">
    <circle cx="161" cy="194" r="128" stroke="white" strokeOpacity=".3" strokeWidth="2" strokeDasharray="5 8" />
    <path d="M161 194V84a110 110 0 1 0 95.26 55Z" fill="white" stroke="white" strokeWidth="7" strokeLinejoin="round" />
    <path d="M161 187V101a93 93 0 1 0 78 45Z" fill="#a91622" />
    <path d="M144 113c-41 7-70 40-70 81s30 77 71 83c-20-26 16-29-5-56s21-31 6-54 11-37-2-54Z" fill="#fff0f1" />
    <path d="M187 164c-35 17 11 27-2 54s-28 20-21 56c47-1 83-37 87-83l-44-25Z" fill="#fff0f1" />
    <g fill="#df101b"><circle cx="111" cy="155" r="14" /><circle cx="103" cy="222" r="15" /><circle cx="201" cy="219" r="15" /><circle cx="156" cy="254" r="12" /><circle cx="140" cy="192" r="10" /></g>
    <g fill="#006b36"><path d="M128 143q-12-28 9-30 19 22-9 30Z" /><path d="M134 231q-17-28 4-32 20 20-4 32Z" /><path d="M211 186q-14-28 8-29 17 21-8 29Z" /><path d="M205 256q-15-25 7-28 17 20-7 28Z" /></g>
    <g className="error-loose-slice"><path d="M248 137V57a80 80 0 0 1 69.28 40Z" fill="white" stroke="white" strokeWidth="7" strokeLinejoin="round" /><path d="M252 125V72a65 65 0 0 1 49 29Z" fill="#a91622" /><path d="M259 78q18-1 29 18l-31 17Z" fill="#fff0f1" /><circle cx="269" cy="91" r="10" fill="#df101b" /><path d="M279 108q-11-21 5-24 15 16-5 24Z" fill="#006b36" /></g>
    <path d="m284 190 11 8m-7 20 12-2M66 77l10 8m10-23 4 12" stroke="white" strokeWidth="4" strokeLinecap="round" />
  </svg>;
}

function PausedOven() {
  return <svg viewBox="0 0 360 360" fill="none" aria-hidden="true" focusable="false">
    <path d="M57 281v-98a123 123 0 0 1 246 0v98" fill="#fff0f1" stroke="white" strokeWidth="7" />
    <path d="M99 281v-92a81 81 0 0 1 162 0v92Z" fill="#063f2c" />
    <path d="M45 281h270v22H45Z" fill="white" /><path d="M69 303v25m222-25v25" stroke="white" strokeWidth="7" strokeLinecap="round" />
    <path d="M84 126h26m15-34 18 20m37-40v27m52-7-18 20m37 14h24" stroke="#df101b" strokeWidth="5" strokeLinecap="round" />
    <path d="M141 257c-27-32 5-48 17-65 1 20 18 14 12 34 19-16 27-30 24-50 43 33 42 70 19 81Z" fill="#df101b" />
    <path d="M164 257c-16-17 5-26 8-41 6 11 3 15 12 21 8-9 8-13 8-19 16 16 19 27 8 39Z" fill="white" />
    <g className="error-oven-steam" stroke="white" strokeWidth="4" strokeLinecap="round"><path d="M151 45q-9-10 0-20t0-20M181 38q-9-10 0-20t0-20M211 45q-9-10 0-20t0-20" /></g>
    <g transform="rotate(-12 274 244)"><rect x="235" y="224" width="91" height="46" rx="7" fill="#006b36" stroke="white" strokeWidth="3" /><path d="M266 237v20m14-20v20m14-20v20" stroke="white" strokeWidth="5" strokeLinecap="round" /></g>
  </svg>;
}

export function ErrorScreen({ code = 500, retry }: { code?: number; retry?: () => void }) {
  const content = errorContent(code);
  return <div className="error-page">
    <a className="error-skip" href="#error-main">Ir para a mensagem</a>
    <div className="error-topline"><span>Passira San Martin</span><span>O sabor dos seus bons momentos</span></div>
    <header className="error-header"><a href="/" aria-label="Passira, início"><BrandLogo /></a><a className="error-home" href="/"><ArrowLeft size={16} aria-hidden="true" />Ir para o início</a></header>
    <main className="error-main" id="error-main">
      <section className="error-card" aria-labelledby="error-heading">
        <div className="error-art" aria-hidden="true"><span className="error-art-label"><Pizza size={16} />ATÉ A MELHOR RECEITA TEM IMPREVISTOS</span><span className="error-art-code">{code}</span><div className="error-illustration">{content.art === 'pizza' ? <MissingSlice /> : <PausedOven />}</div><span className="error-art-caption">{content.art === 'pizza' ? 'Faltou uma fatia por aqui.' : 'Já já, de volta ao ponto.'}</span></div>
        <div className="error-copy"><span className="error-status">Erro {code}<span aria-hidden="true">·</span>{content.label}</span><p className="error-kicker">TEM UM CAMINHO DE VOLTA</p><h1 id="error-heading">{content.title}</h1><p className="error-description">{content.description}</p>
          <div className="error-actions"><a className="error-action error-action-primary" href="/#cardapio">Voltar ao cardápio<ArrowRight size={18} aria-hidden="true" /></a>{content.signIn ? <a className="error-action error-action-secondary" href="/admin/entrar/"><LockKeyhole size={17} aria-hidden="true" />Entrar no painel</a> : content.retry ? <ErrorRetryButton retry={retry} /> : <a className="error-action error-action-secondary" href="/rastrear-pedido/"><PackageSearch size={17} aria-hidden="true" />Rastrear pedido</a>}</div>
          <div className="error-help"><PackageSearch size={20} aria-hidden="true" /><p>Já fez seu pedido?<a href="/rastrear-pedido/">Acompanhe por aqui<ArrowRight size={14} aria-hidden="true" /></a></p></div>
        </div>
      </section>
      <p className="error-bottom-note">O seu próximo sabor está no cardápio.</p>
    </main>
    <footer className="error-footer"><span>Pizza para dividir. Sabor para voltar.</span><span><MapPin size={15} aria-hidden="true" />San Martin, Recife</span></footer>
  </div>;
}
