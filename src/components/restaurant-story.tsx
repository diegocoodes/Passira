import { ArrowRight, ArrowUpRight, Clock3, Leaf, MapPin, Phone, Pizza } from 'lucide-react';
import store from '@/data/store.json';
import google from '@/data/google-reviews.json';
import { defaultStorefrontContent, type StorefrontContent } from '@/lib/storefront-content';

const mapsUrl = 'https://www.google.com/maps?cid=11558539790381466414';

export function RestaurantStory({ content }: { content: StorefrontContent['story'] }) {
  return <>
    <div className="story-ribbon" aria-hidden="true">{Array.from({ length: 8 }, (_, index) => <span key={index}><span>Feito para reunir</span><Pizza size={18} /><strong>Passira San Martin</strong><Leaf size={18} /><span>Sabor à sua mesa</span><Pizza size={18} /></span>)}</div>
    <section className="restaurant-story" id="a-passira" aria-labelledby="story-heading">
      <figure className="restaurant-photo">
        <img className="restaurant-interior" src={content.image} alt={content.imageAlt} loading="lazy" decoding="async" width={1400} height={1867} />
        {content.image === defaultStorefrontContent.story.image && <figcaption>Foto do Google Maps: <a href={google.interiorPhoto.reviewUrl} target="_blank" rel="noreferrer">{google.interiorPhoto.author}, {google.interiorPhoto.publishedLabel}<ArrowUpRight size={13} /></a></figcaption>}
      </figure>
      <div className="restaurant-story-copy">
        <p className="section-kicker">{content.kicker}</p>
        <h2 id="story-heading">{content.title}<br /><span>{content.accent}</span></h2>
        <p>{content.body}</p>
        <div className="restaurant-details">
          <div><MapPin size={19} /><p><strong>Encontre a Passira</strong><span>{store.address.street}, {store.address.number}<br />San Martin, Recife</span></p></div>
          <div><Clock3 size={19} /><p><strong>Todos os dias</strong><span>Das 10h às 23h15</span></p></div>
          <div><Phone size={19} /><p><strong>Fale com a loja</strong><a href={`tel:+55${store.phone.replace(/\D/g, '')}`}>(81) 3140 7400</a></p></div>
        </div>
        <div className="restaurant-actions"><a className="button visit-button" href={mapsUrl} target="_blank" rel="noreferrer">Como chegar<ArrowUpRight size={18} /></a><a className="restaurant-menu-link" href="#cardapio">Ver cardápio<ArrowRight size={17} /></a></div>
      </div>
    </section>
  </>;
}
