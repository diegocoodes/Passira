import { ArrowUpRight, Star } from 'lucide-react';
import google from '@/data/google-reviews.json';

export function CustomerReviews() {
  const checkedOn = new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(new Date(`${google.place.capturedAt}T12:00:00Z`));
  const reviews = [...google.reviews].sort((a, b) => Number(a.isExcerpt) - Number(b.isExcerpt));

  return <section id="avaliacoes" className="customer-reviews" aria-labelledby="reviews-heading">
    <div className="section-heading reviews-heading">
      <div><p className="section-kicker">Quem senta à nossa mesa</p><h2 id="reviews-heading">Histórias de quem já veio.</h2></div>
      <div className="review-rating"><strong>{google.place.rating.toLocaleString('pt-BR', { minimumFractionDigits: 1 })}</strong><p><span>de 5 no Google</span><a href={google.place.googleMapsUrl} target="_blank" rel="noreferrer">Ver todas as avaliações</a></p></div>
    </div>
    <div className="reviews-grid">{reviews.map(review => <article key={review.id} className="review-card">
      <div className="review-author"><img src={review.avatar} alt="" loading="lazy" decoding="async" width={72} height={72} /><div><strong>{review.author}</strong><p>{review.source}{review.isExcerpt ? ' · Trecho da avaliação' : ''}</p></div></div>
      <div className="review-stars" role="img" aria-label={`${review.rating} de 5 estrelas`}>{Array.from({ length: 5 }, (_, index) => <Star key={index} size={15} fill={index < review.rating ? 'currentColor' : 'none'} aria-hidden="true" />)}</div>
      <blockquote>“{review.text.replace(/\s+([,.!?;:])/g, '$1')}”</blockquote>
      <a className="review-source" href={review.sourceUrl} target="_blank" rel="noreferrer">Ler no Google<ArrowUpRight size={15} /></a>
    </article>)}</div>
    <p className="reviews-note">Relatos selecionados de clientes. Nota geral e avaliações consultadas em <time dateTime={google.place.capturedAt}>{checkedOn}</time>. As opiniões completas e as fotos dos autores estão disponíveis nos links do Google.</p>
  </section>;
}
