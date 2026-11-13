import { ArrowRight, ArrowUpRight, Quote, Star } from 'lucide-react';
import google from '@/data/google-reviews.json';

export function CustomerReviews() {
  const checkedOn = new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(new Date(`${google.place.capturedAt}T12:00:00Z`));
  const featured = google.reviews.find(review => review.id === 'erica') ?? google.reviews[0];
  const reviews = [featured, ...google.reviews.filter(review => review.id !== featured.id).sort((a, b) => Number(a.isExcerpt) - Number(b.isExcerpt))];

  return <section id="avaliacoes" className="customer-reviews" aria-labelledby="reviews-heading">
    <div className="section-heading reviews-heading">
      <div><p className="section-kicker">Quem já veio à Passira</p><h2 id="reviews-heading">Avaliações dos clientes.</h2></div>
      <div className="review-rating"><strong>{google.place.rating.toLocaleString('pt-BR', { minimumFractionDigits: 1 })}<small>/5</small></strong><p><span>Nota no Google Maps</span><a className="link" href={google.place.googleMapsUrl} target="_blank" rel="noreferrer">Ver todas as avaliações<ArrowUpRight size={14} /></a></p></div>
    </div>
    <div className="reviews-grid">{reviews.map((review, index) => <article key={review.id} className={`card review-card ${index === 0 ? 'review-card-featured' : ''}`}>
      <div className="review-card-top"><div className="review-stars" role="img" aria-label={`${review.rating} de 5 estrelas`}>{Array.from({ length: 5 }, (_, index) => <Star key={index} size={15} fill={index < review.rating ? 'currentColor' : 'none'} aria-hidden="true" />)}</div><Quote size={27} strokeWidth={1.3} aria-hidden="true" /></div>
      <blockquote>“{review.text.replace(/\s+([,.!?;:])/g, '$1')}”</blockquote>
      <div className="review-card-bottom"><div className="review-author"><img src={review.avatar} alt="" loading="lazy" decoding="async" width={72} height={72} data-source="google-maps" data-subject={`Retrato de ${review.author}`} /><div><strong>{review.author}</strong><p>{review.source}{review.isExcerpt ? ' · Trecho da avaliação' : ''}</p></div></div>
      <a className="review-source link" href={review.sourceUrl} target="_blank" rel="noreferrer" aria-label={`Ler avaliação de ${review.author} no Google`}><span>Ler no Google</span><ArrowUpRight size={17} /></a></div>
    </article>)}</div>
    <p className="reviews-note">Avaliações selecionadas do Google Maps, consultadas em <time dateTime={google.place.capturedAt}>{checkedOn}</time>. A nota geral e os relatos correspondem a essa consulta.</p>
    <a className="button primary btn btn--primary reviews-menu-button" href="#cardapio">Escolher meu pedido<ArrowRight size={18} /></a>
  </section>;
}
