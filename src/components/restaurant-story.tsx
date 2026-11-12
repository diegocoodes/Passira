import { ArrowUpRight, Clock3, MapPin, Phone } from 'lucide-react';
import store from '@/data/store.json';
import google from '@/data/google-reviews.json';

const mapsUrl = 'https://www.google.com/maps?cid=11558539790381466414';

export function RestaurantStory() {
  return <section className="restaurant-story" id="a-passira" aria-labelledby="story-heading">
    <figure className="restaurant-photo">
      <img className="restaurant-interior" src="/images/restaurant/interior-san-martin.webp" alt="Salão da Passira San Martin, com mesas de madeira e clientes reunidos para uma refeição" loading="lazy" decoding="async" width={1400} height={1867} />
      <img className="restaurant-facade" src="/images/restaurant/fachada-san-martin.webp" alt="Fachada da Passira San Martin, com a placa da pizzaria e a entrada do restaurante" loading="lazy" decoding="async" width={1280} height={591} />
      <figcaption>Fotos do Google Maps: <a href={google.interiorPhoto.reviewUrl} target="_blank" rel="noreferrer">{google.interiorPhoto.author}, {google.interiorPhoto.publishedLabel}</a> e <a href={google.photo.googlePhotoUrl} target="_blank" rel="noreferrer">{google.photo.author}, {google.photo.publishedLabel}<ArrowUpRight size={13} /></a>.</figcaption>
    </figure>
    <div className="restaurant-story-copy">
      <p className="section-kicker">A nossa casa</p>
      <h2 id="story-heading">Em San Martin,<br />a mesa está posta.</h2>
      <p>Da pizza ao almoço em família, a Passira faz parte de San Martin, no Recife. O cardápio reúne pratos para compartilhar, massas, petiscos e bebidas.</p>
      <p>Venha ao restaurante, retire seu pedido no balcão ou escolha a entrega para comer em casa.</p>
      <div className="restaurant-details">
        <div><MapPin size={19} /><p><strong>Encontre a Passira</strong><span>{store.address.street}, {store.address.number}<br />San Martin, Recife</span></p></div>
        <div><Clock3 size={19} /><p><strong>Todos os dias</strong><span>Das 10h às 23h15</span></p></div>
        <div><Phone size={19} /><p><strong>Fale com a loja</strong><a href={`tel:+55${store.phone.replace(/\D/g, '')}`}>(81) 3140 7400</a></p></div>
      </div>
      <a className="button visit-button" href={mapsUrl} target="_blank" rel="noreferrer">Como chegar<ArrowUpRight size={18} /></a>
    </div>
  </section>;
}
