import { ArrowRight, ArrowUpRight, Leaf, Pizza } from 'lucide-react';
import store from '@/data/store.json';
import google from '@/data/google-reviews.json';
import { defaultStorefrontContent, type StorefrontContent } from '@/lib/storefront-content';
import { TasteSectionMotion } from './taste-section-motion';

const mapsUrl = 'https://www.google.com/maps?cid=11558539790381466414';

export function RestaurantStory({ content }: { content: StorefrontContent['story'] }) {
  return <>
    <div className="story-ribbon" aria-hidden="true">{Array.from({ length: 8 }, (_, index) => <span key={index}><span>Feito para reunir</span><Pizza size={18} /><strong>Passira San Martin</strong><Leaf size={18} /><span>Sabor à sua mesa</span><Pizza size={18} /></span>)}</div>
    <section className="restaurant-story" id="a-passira" aria-labelledby="story-heading">
      <TasteSectionMotion />
      <div className="house-section-heading"><div><p className="section-kicker">Passira San Martin</p><h2 id="story-heading">{content.kicker}</h2></div><p>Pizzaria e restaurante<br />em San Martin, Recife.</p></div>
      <div className="house-layout"><div className="house-information"><div className="restaurant-story-copy">
        <h3>{content.title}<br /><span>{content.accent}</span></h3>
        <p>{content.body}</p>
        <dl className="restaurant-details">
          <div><dt>Endereço</dt><dd><address>{store.address.street}, {store.address.number}<br />San Martin, Recife</address></dd></div>
          <div><dt>Horário</dt><dd>Todos os dias, das 10h às 23h15</dd></div>
          <div><dt>Telefone</dt><dd><a className="link" href={`tel:+55${store.phone.replace(/\D/g, '')}`}>(81) 3140 7400</a></dd></div>
        </dl>
        <div className="restaurant-actions"><a className="button btn btn--primary visit-button" href={mapsUrl} target="_blank" rel="noreferrer">Como chegar<ArrowUpRight size={18} /></a><a className="restaurant-menu-link link" href="#cardapio">Ver cardápio<ArrowRight size={17} /></a></div>
      </div><a className="house-facade m-zoom" href={mapsUrl} target="_blank" rel="noreferrer" aria-label="Ver a localização da Passira no Google Maps"><img src="/images/restaurant/fachada-san-martin.webp" alt="Fachada da Passira San Martin, com o salão aberto para a avenida" srcSet="/images/restaurant/fachada-san-martin-640.webp 640w, /images/restaurant/fachada-san-martin.webp 1280w" sizes="(max-width: 640px) calc(100vw - 48px), (max-width: 1000px) 40vw, 46vw" width={1280} height={591} loading="eager" decoding="async" data-source="google-maps" data-subject="Fachada da Passira San Martin" /></a></div>
      <figure className="restaurant-photo"><a className="m-zoom house-interior-link" data-moment="picture-develops" data-moment-opts='{"look":"film","duration":1600}' href={mapsUrl} target="_blank" rel="noreferrer" aria-label="Ver a Passira San Martin no Google Maps"><img className="restaurant-interior" src={content.image} alt={content.imageAlt} srcSet={content.image === defaultStorefrontContent.story.image ? "/images/restaurant/interior-san-martin-800.webp 800w, /images/restaurant/interior-san-martin.webp 1400w" : undefined} sizes="(max-width: 1000px) 90vw, 46vw" loading="eager" decoding="async" width={1400} height={1867} data-source={content.image === defaultStorefrontContent.story.image ? 'google-maps' : 'client'} data-subject="Salão da Passira San Martin" /></a></figure></div>
    </section>
  </>;
}

export function RestaurantPhotoCredits({ image }: { image: string }) {
  return <details className="restaurant-credits"><summary>Créditos das fotos da casa</summary><ul>{image === defaultStorefrontContent.story.image && <li>Salão: <a href={google.interiorPhoto.reviewUrl} target="_blank" rel="noreferrer">{google.interiorPhoto.author}, Google Maps</a>.</li>}<li>Fachada: <a href={google.photo.googlePhotoUrl} target="_blank" rel="noreferrer">{google.photo.author}, Google Maps</a>.</li></ul></details>;
}
