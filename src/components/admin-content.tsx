'use client';

import { useEffect, useId, useState } from 'react';
import { ArrowDown, ArrowUp, ArrowUpRight, ImageIcon, Plus, Save, Trash2 } from 'lucide-react';
import type { Catalog } from '@/data/types';
import { getProductImage } from '@/data/illustrative-images';
import { requestJson } from '@/lib/api-client';
import { isContentImage, type StorefrontContent } from '@/lib/storefront-content';

function TextField({ label, value, change, max, multiline = false }: { label: string; value: string; change: (value: string) => void; max: number; multiline?: boolean }) {
  const id = useId();
  return <div className="field"><label htmlFor={id}>{label}</label>{multiline
    ? <textarea id={id} required rows={3} maxLength={max} value={value} onChange={event => change(event.target.value)} />
    : <input id={id} required maxLength={max} value={value} onChange={event => change(event.target.value)} />}</div>;
}

function ImagePreview({ src, alt = '' }: { src: string; alt?: string }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  return isContentImage(src) && !failed
    ? <img src={src} alt={alt} onError={() => setFailed(true)} loading="lazy" />
    : <span className="content-image-empty"><ImageIcon size={28} /><span>{failed ? 'Não foi possível carregar a imagem. Confira o link.' : 'Informe uma imagem para visualizar.'}</span></span>;
}

function ImageField({ label, value, change }: { label: string; value: string; change: (value: string) => void }) {
  return <div className="content-image-field"><TextField label={label} value={value} change={change} max={2000} /><p className="admin-help">Cole um link HTTPS da foto ou use uma imagem existente em /images/.</p><div className="content-image-preview"><ImagePreview src={value} /></div></div>;
}

export function AdminContent({ catalog }: { catalog: Catalog }) {
  const [draft, setDraft] = useState<StorefrontContent | null>(null);
  const [saved, setSaved] = useState<StorefrontContent | null>(null);
  const [error, setError] = useState(''), [message, setMessage] = useState(''), [saving, setSaving] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);

  useEffect(() => {
    const controller = new AbortController();
    setError('');
    requestJson<StorefrontContent>('/api/admin/content/', { signal: controller.signal })
      .then(content => { setDraft(content); setSaved(content); })
      .catch(error => { if (error.name !== 'AbortError') setError(error.message); });
    return () => controller.abort();
  }, [attempt]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  if (!draft) return error ? <div className="admin-alert" role="alert">{error}<button type="button" className="text-button" onClick={() => setAttempt(value => value + 1)}>Tentar novamente</button></div> : <p className="admin-empty" role="status">Carregando conteúdo da loja…</p>;

  function update<K extends keyof StorefrontContent>(section: K, values: Partial<StorefrontContent[K]>) {
    setDraft(current => current ? { ...current, [section]: { ...current[section], ...values } } : current);
    setMessage(''); setError('');
  }
  const eligible = catalog.products.filter(product => product.enabled && !product.blocked && catalog.categories.some(category => category.id === product.categoryId && category.enabled)).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  const nextProduct = eligible.find(product => !draft.selection.productIds.includes(product.id));
  const move = (index: number, offset: number) => {
    const ids = [...draft.selection.productIds];
    [ids[index], ids[index + offset]] = [ids[index + offset], ids[index]];
    update('selection', { productIds: ids });
  };

  return <form className="content-editor" onSubmit={async event => {
    event.preventDefault(); if (saving) return;
    setSaving(true); setError(''); setMessage('');
    try {
      const content = await requestJson<StorefrontContent>('/api/admin/content/', { method: 'PUT', body: JSON.stringify(draft) });
      setDraft(content); setSaved(content); setMessage('Conteúdo salvo. As alterações já estão disponíveis ao abrir ou atualizar a loja.');
    } catch (error) { setError(error instanceof Error ? error.message : 'Não foi possível salvar o conteúdo.'); }
    finally { setSaving(false); }
  }}>
    <div className="admin-welcome"><div><p className="eyebrow">A PASSIRA DO SEU JEITO</p><h2>Conte a história da sua casa.</h2><p>Edite a página inicial e escolha o que merece destaque.</p></div><a className="button secondary" href="/" target="_blank" rel="noreferrer">Abrir loja<ArrowUpRight size={16} /></a></div>
    <fieldset disabled={saving} className="content-fields">
      <section className="admin-surface" aria-labelledby="content-hero-heading">
        <div className="admin-section-title"><div><p className="eyebrow">01 · PRIMEIRA IMPRESSÃO</p><h2 id="content-hero-heading">Banner principal</h2><p className="admin-help">A prévia acompanha sua edição. Use títulos curtos para a leitura no celular.</p></div><ImageIcon size={23} /></div>
        <div className="content-hero-layout"><div className="admin-form-grid">
          <TextField label="Título do banner" value={draft.hero.title} change={title => update('hero', { title })} max={60} multiline />
          <TextField label="Trecho em destaque do banner" value={draft.hero.accent} change={accent => update('hero', { accent })} max={40} />
          <TextField label="Texto do botão principal" value={draft.hero.button} change={button => update('hero', { button })} max={30} />
          <TextField label="Texto do selo" value={draft.hero.quickTitle} change={quickTitle => update('hero', { quickTitle })} max={40} />
          <TextField label="Chamada do selo" value={draft.hero.quickButton} change={quickButton => update('hero', { quickButton })} max={25} />
          <TextField label="Mensagem de entrega no banner" value={draft.hero.deliveryText} change={deliveryText => update('hero', { deliveryText })} max={100} multiline />
          <TextField label="Link da imagem principal" value={draft.hero.image} change={image => update('hero', { image })} max={2000} />
          <TextField label="Descrição da imagem principal" value={draft.hero.imageAlt} change={imageAlt => update('hero', { imageAlt })} max={240} />
        </div><div className="content-hero-preview" aria-label="Prévia do banner"><span className="content-preview-label">Prévia do conteúdo</span><strong>{draft.hero.title}<span>{draft.hero.accent}</span></strong><div className="content-hero-photo"><ImagePreview src={draft.hero.image} alt={draft.hero.imageAlt} /></div><span className="content-preview-button">{draft.hero.button}</span></div></div>
        <p className="admin-help">Imagens aceitam links HTTPS ou caminhos em /images/. Prefira uma composição vertical para o banner. A descrição deve contar o que aparece na foto.</p>
      </section>

      <section className="admin-surface" aria-labelledby="content-selection-heading">
        <div className="admin-section-title"><div><p className="eyebrow">02 · ESCOLHAS DA CASA</p><h2 id="content-selection-heading">Cardápio e destaques</h2></div><span className="admin-pill">{draft.selection.productIds.length} de 6 destaques</span></div>
        <div className="admin-form-grid">
          <TextField label="Chamada do cardápio" value={draft.menu.kicker} change={kicker => update('menu', { kicker })} max={80} />
          <TextField label="Título do cardápio" value={draft.menu.title} change={title => update('menu', { title })} max={80} />
          <TextField label="Chamada dos destaques" value={draft.selection.kicker} change={kicker => update('selection', { kicker })} max={80} />
          <TextField label="Título dos destaques" value={draft.selection.title} change={title => update('selection', { title })} max={80} />
          <TextField label="Texto do botão dos destaques" value={draft.selection.button} change={button => update('selection', { button })} max={40} />
        </div>
        <p className="admin-help">Escolha até seis produtos e organize a ordem com as setas. Produtos indisponíveis ficam ocultos na loja. Remova todos para ocultar a seção. Edite as fotos dos pratos na área Produtos.</p>
        <ol className="content-product-list">{draft.selection.productIds.map((id, index) => {
          const product = catalog.products.find(product => product.id === id);
          const available = eligible.some(product => product.id === id);
          return <li className="content-product-row" key={id}>
            <span className="content-product-number">{String(index + 1).padStart(2, '0')}</span>
            {product && <img src={getProductImage(product).src} alt="" width={56} height={56} loading="lazy" />}
            <div className="field"><label htmlFor={`content-product-${index}`}>Produto em destaque {index + 1}</label><select id={`content-product-${index}`} value={id} onChange={event => update('selection', { productIds: draft.selection.productIds.map((current, position) => position === index ? event.target.value : current) })}>
              {!available && <option value={id}>{product?.name || 'Produto removido'} (oculto na loja)</option>}
              {eligible.map(product => <option key={product.id} value={product.id} disabled={product.id !== id && draft.selection.productIds.includes(product.id)}>{product.name}</option>)}
            </select></div>
            <div className="admin-row-actions"><button type="button" className="icon-button" aria-label={`Subir destaque ${index + 1}`} disabled={index === 0} onClick={() => move(index, -1)}><ArrowUp size={16} /></button><button type="button" className="icon-button" aria-label={`Descer destaque ${index + 1}`} disabled={index === draft.selection.productIds.length - 1} onClick={() => move(index, 1)}><ArrowDown size={16} /></button><button type="button" className="icon-button danger" aria-label={`Remover destaque ${index + 1}`} onClick={() => update('selection', { productIds: draft.selection.productIds.filter(current => current !== id) })}><Trash2 size={16} /></button></div>
          </li>;
        })}</ol>
        {!draft.selection.productIds.length && <p className="admin-empty">Nenhum produto em destaque. A seção ficará oculta na loja.</p>}
        <button type="button" className="button secondary" disabled={!nextProduct || draft.selection.productIds.length >= 6} onClick={() => { if (nextProduct) update('selection', { productIds: [...draft.selection.productIds, nextProduct.id] }); }}><Plus size={16} />Adicionar destaque</button>
      </section>

      <section className="admin-surface" aria-labelledby="content-manifesto-heading">
        <div className="admin-section-title"><div><p className="eyebrow">03 · SABOR EM PALAVRAS</p><h2 id="content-manifesto-heading">Apresentação da marca</h2></div></div>
        <div className="admin-form-grid">
          <TextField label="Nome na apresentação" value={draft.manifesto.title} change={title => update('manifesto', { title })} max={40} />
          <TextField label="Texto da apresentação" value={draft.manifesto.body} change={body => update('manifesto', { body })} max={240} multiline />
          <TextField label="Trecho final da apresentação" value={draft.manifesto.accent} change={accent => update('manifesto', { accent })} max={120} />
          <TextField label="Texto do botão da apresentação" value={draft.manifesto.button} change={button => update('manifesto', { button })} max={40} />
          <ImageField label="Foto à esquerda da apresentação" value={draft.manifesto.leftImage} change={leftImage => update('manifesto', { leftImage })} />
          <ImageField label="Foto à direita da apresentação" value={draft.manifesto.rightImage} change={rightImage => update('manifesto', { rightImage })} />
        </div>
      </section>

      <section className="admin-surface" aria-labelledby="content-story-heading">
        <div className="admin-section-title"><div><p className="eyebrow">04 · PORTAS ABERTAS</p><h2 id="content-story-heading">Sobre a Passira</h2></div></div>
        <div className="admin-form-grid">
          <TextField label="Chamada sobre a Passira" value={draft.story.kicker} change={kicker => update('story', { kicker })} max={80} />
          <TextField label="Título sobre a Passira" value={draft.story.title} change={title => update('story', { title })} max={80} />
          <TextField label="Trecho em destaque sobre a Passira" value={draft.story.accent} change={accent => update('story', { accent })} max={80} />
          <TextField label="Texto sobre a Passira" value={draft.story.body} change={body => update('story', { body })} max={1000} multiline />
          <ImageField label="Foto do restaurante" value={draft.story.image} change={image => update('story', { image })} />
          <TextField label="Descrição da foto do restaurante" value={draft.story.imageAlt} change={imageAlt => update('story', { imageAlt })} max={240} />
        </div>
      </section>

      <section className="admin-surface" aria-labelledby="content-footer-heading"><div className="admin-section-title"><h2 id="content-footer-heading">Rodapé</h2></div><TextField label="Descrição no rodapé" value={draft.footer.description} change={description => update('footer', { description })} max={180} /></section>
    </fieldset>
    {error && <div className="admin-alert" role="alert">{error}</div>}
    {message && <div className="admin-success" role="status">{message}</div>}
    <div className="content-save-bar"><p>{saving ? 'Salvando conteúdo…' : dirty ? 'Você tem alterações não salvas.' : 'Conteúdo atualizado.'}<small>As alterações aparecem na loja depois de salvar e atualizar a página.</small></p><div><button type="button" className="button secondary" disabled={saving || !dirty} onClick={() => { setDraft(saved); setMessage(''); setError(''); }}>Desfazer edição</button><button className="button primary" disabled={saving || !dirty}><Save size={16} />{saving ? 'Salvando…' : 'Salvar conteúdo da loja'}</button></div></div>
  </form>;
}
