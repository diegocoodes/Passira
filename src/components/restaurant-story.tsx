import { ArrowRight, ArrowUpRight, Clock3, Leaf, MapPin, Phone, Pizza } from 'lucide-react';
import store from '@/data/store.json';
import google from '@/data/google-reviews.json';

const mapsUrl = 'https://www.google.com/maps?cid=11558539790381466414';

export function RestaurantStory() {
  return <>
    <div className="story-ribbon" aria-hidden="true">{[0, 1, 2].map(index => <span key={index}>Feito para reunir<Pizza size={16} />Passira San Martin<Leaf size={16} />Sabor à sua mesa<Pizza size={16} /></span>)}</div>
    <section className="restaurant-story" id="a-passira" aria-labelledby="story-heading">
      <figure className="restaurant-photo">
        <img className="restaurant-interior" src="/images/restaurant/interior-san-martin.webp" alt="Salão da Passira San Martin, com mesas de madeira e clientes reunidos para uma refeição" loading="lazy" decoding="async" width={1400} height={1867} />
        <figcaption>Foto do Google Maps: <a href={google.interiorPhoto.reviewUrl} target="_blank" rel="noreferrer">{google.interiorPhoto.author}, {google.interiorPhoto.publishedLabel}<ArrowUpRight size={13} /></a></figcaption>
      </figure>
      <div className="restaurant-story-copy">
        <p className="section-kicker">Nossa casa</p>
        <h2 id="story-heading">Viva o clima.<br /><span>Sinta o sabor.</span></h2>
        <p>Uma pizza para compartilhar, um almoço em família, um encontro sem pressa. Na Passira San Martin, cada visita tem um sabor especial. A nossa mesa espera por você.</p>
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
