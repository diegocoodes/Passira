'use client';

import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useMenu } from './menu-provider';
import { getProductImage } from '@/data/illustrative-images';


const categoryLabels: Record<string, string> = { '274527': 'Promoções de pizzas', '274526': 'Pizza em dobro', '274515': 'Promoções da semana', '336116': 'Pizza de 1 sabor', '365011': 'Happy Pizza' };
const categoryPhotos: Record<string, string> = { '274528': '/images/380075.webp', '274508': '/images/2169126.webp', '274509': '/images/2172833.webp', '274512': '/images/2169141.webp', '274523': '/images/2172237.webp', '274513': '/images/2169207.webp' };
function getCategoryImages(availableCategories: import('@/data/types').Category[], products: import('@/data/types').Product[]) { return new Map(availableCategories.map(category => {
  const product = products.find(product => product.enabled && product.categoryId === category.id);
  return [category.id, categoryPhotos[category.id] || (product ? getProductImage(product).src : '')];
})); }

export function CategoryNavigation({ selected, choose }: { selected: string | null; choose: (id: string) => void }) {
  const { availableCategories, products } = useMenu();
  const counts = new Map(availableCategories.map(category => [category.id, products.filter(product => product.enabled && product.categoryId === category.id).length]));
  const categoryImages = getCategoryImages(availableCategories, products);
  const track = useRef<HTMLElement>(null);
  const drag = useRef({ pointer: -1, start: 0, scroll: 0, moved: false });
  const [edges, setEdges] = useState({ start: true, end: false });
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    const element = track.current;
    if (!element) return;
    const update = () => setEdges({ start: element.scrollLeft <= 2, end: element.scrollLeft + element.clientWidth >= element.scrollWidth - 2 });
    const observer = new ResizeObserver(update);
    observer.observe(element);
    element.addEventListener('scroll', update, { passive: true });
    update();
    return () => { observer.disconnect(); element.removeEventListener('scroll', update); };
  }, []);

  const scroll = (direction: number) => {
    const element = track.current;
    if (element) element.scrollBy({ left: direction * element.clientWidth * .75, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  };
  const startDrag = (event: PointerEvent<HTMLElement>) => {
    drag.current.moved = false;
    if (event.pointerType !== 'mouse' || event.button !== 0) return;
    drag.current = { pointer: event.pointerId, start: event.clientX, scroll: event.currentTarget.scrollLeft, moved: false };
  };
  const moveDrag = (event: PointerEvent<HTMLElement>) => {
    const current = drag.current;
    if (current.pointer !== event.pointerId) return;
    const distance = event.clientX - current.start;
    if (!current.moved && Math.abs(distance) < 6) return;
    current.moved = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
    event.currentTarget.scrollLeft = current.scroll - distance;
  };
  const endDrag = (event: PointerEvent<HTMLElement>) => {
    if (drag.current.pointer !== event.pointerId) return;
    drag.current.pointer = -1;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    setDragging(false);
  };
  const navigate = (event: KeyboardEvent<HTMLElement>) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    const buttons = Array.from(event.currentTarget.querySelectorAll('button'));
    const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
    if (index < 0) return;
    event.preventDefault();
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : Math.max(0, Math.min(buttons.length - 1, index + (event.key === 'ArrowRight' ? 1 : -1)));
    buttons[next].focus();
  };

  return <section className="category-navigation" aria-label="Categorias">
    <div className="category-navigation-heading"><h2>Categorias</h2><div className="category-controls"><span>Deslize para ver mais</span><button type="button" aria-label="Categorias anteriores" aria-controls="category-track" disabled={edges.start} onClick={() => scroll(-1)}><ChevronLeft size={20} /></button><button type="button" aria-label="Próximas categorias" aria-controls="category-track" disabled={edges.end} onClick={() => scroll(1)}><ChevronRight size={20} /></button></div></div>
    <nav id="category-track" ref={track} className={`category-track ${dragging ? 'dragging' : ''}`} aria-label="Categorias do cardápio" onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={endDrag} onLostPointerCapture={() => { drag.current.pointer = -1; setDragging(false); }} onKeyDown={navigate} onClickCapture={event => { if (drag.current.moved && event.detail > 0) { event.preventDefault(); event.stopPropagation(); } }}>
      {availableCategories.map(category => <button type="button" key={category.id} className={selected === category.id ? 'active' : ''} aria-label={`${category.name.trim()} ${counts.get(category.id)} ${counts.get(category.id) === 1 ? 'opção' : 'opções'}`} aria-pressed={selected === category.id} onClick={() => choose(category.id)}><span>{categoryLabels[category.id] || category.name.trim()}</span><small>{counts.get(category.id)} {counts.get(category.id) === 1 ? 'opção' : 'opções'}</small><span className={`category-photo ${category.id === '274513' ? 'category-drinks' : ''}`}><img src={categoryImages.get(category.id)} alt="" width={160} height={140} loading="lazy" decoding="async" draggable={false} /></span></button>)}
    </nav>
  </section>;
}
