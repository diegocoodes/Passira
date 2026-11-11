import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const sources = JSON.parse(await fs.readFile(path.join(root, 'audit/illustrative-image-sources.json'), 'utf8'));
const directory = path.join(root, 'public/images/illustrative');
await fs.mkdir(directory, { recursive: true });
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
async function get(url) {
  for (let attempt = 0; attempt < 4; attempt++) {
    const response = await fetch(url, { headers: { 'User-Agent': 'PassiraMenuIllustrations/1.0 (food-photo-attribution)' }, signal: AbortSignal.timeout(60000) });
    if (response.ok) return response;
    if (response.status === 429 && attempt < 3) { console.log('Source rate limit; waiting 45 seconds.'); await pause(45000); continue; }
    throw new Error(`${response.status}: ${url}`);
  }
}
const strip = html => (html ?? '').replace(/<[^>]+>/g, '').replace(/&quot;/g, '"').replace(/&amp;/g, '&').trim();
const api = new URL('https://commons.wikimedia.org/w/api.php');
api.search = new URLSearchParams({ action: 'query', format: 'json', titles: sources.filter(s => s.commons).map(s => `File:${s.commons}`).join('|'), prop: 'imageinfo', iiprop: 'url|extmetadata', iiurlwidth: '960' });
const metadata = await (await get(api)).json();
const pages = Object.values(metadata.query.pages);
const credits = [];
const refresh = new Set((process.argv.find(arg => arg.startsWith('--refresh='))?.slice('--refresh='.length) ?? '').split(','));
for (const source of sources) {
  let url, author, license, licenseUrl, sourceUrl;
  if (source.commons) {
    const page = pages.find(p => p.title === `File:${source.commons}`);
    const info = page?.imageinfo?.[0];
    if (!info) throw new Error(`No image information for ${source.commons}`);
    url = (info.thumburl ?? info.url).split('?')[0];
    author = strip(info.extmetadata.Artist?.value);
    license = info.extmetadata.LicenseShortName?.value;
    licenseUrl = info.extmetadata.LicenseUrl?.value || 'https://creativecommons.org/publicdomain/mark/1.0/';
    sourceUrl = info.descriptionurl;
  } else {
    url = `https://images.pexels.com/photos/${source.pexels}/pexels-photo-${source.pexels}.jpeg?auto=compress&cs=tinysrgb&w=960`;
    author = source.author || 'Pexels, autoria na página de origem';
    license = 'Pexels License';
    licenseUrl = 'https://www.pexels.com/license/';
    sourceUrl = source.source;
  }
  const destination = path.join(directory, `${source.slug}.webp`);
  try { if (refresh.has(source.slug)) throw new Error('Refresh requested'); await fs.access(destination); }
  catch {
    const response = await get(url);
    await sharp(Buffer.from(await response.arrayBuffer())).rotate().resize({ width: 960, height: 960, fit: 'inside', withoutEnlargement: true }).webp({ quality: 82 }).toFile(destination);
    console.log(`Downloaded ${source.slug}`);
    await pause(800);
  }
  const { size } = await fs.stat(destination);
  credits.push({ slug: source.slug, title: source.title, src: `/images/illustrative/${source.slug}.webp`, author, license, licenseUrl, sourceUrl, downloadUrl: url, products: source.products, bytes: size });
}
await fs.writeFile(path.join(root, 'src/data/illustrative-image-credits.json'), JSON.stringify(credits, null, 2) + '\n');
const products = JSON.parse(await fs.readFile(path.join(root, 'src/data/menu/products.json'), 'utf8'));
const productNames = ids => ids.map(id => products.find(product => product.id === id)?.name.replace(/\s+[-–—]\s*$/g, '').replace(/\s+[-–—]\s+/g, ', ').trim() ?? id);
const escapeHtml = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const note = 'Fotos ilustrativas de pratos semelhantes, usadas somente nos itens sem foto original. Ingredientes, porções, cortes e acompanhamentos podem diferir da imagem; a descrição do cardápio é a referência do pedido.';
const markdown = [
  '# Créditos das fotografias ilustrativas',
  '', note, '',
  'As fotografias originais do cardápio foram preservadas. As referências abaixo foram encontradas em pesquisa pública na web e baixadas de Wikimedia Commons e Pexels. Não são fotografias da Passira.',
  '',
  'Os arquivos foram redimensionados para no máximo 960 × 960 px, sem cortes, e convertidos para WebP. Fotografias Creative Commons mantêm sua licença original, inclusive a obrigação de compartilhamento pela mesma licença quando aplicável. Não houve geração por IA nem alteração do conteúdo fotografado.',
  '',
  'Crédito público: `/images/illustrative/credits.html`. Mapeamento de apresentação: `src/data/illustrative-images.ts`. O importador do cardápio não sobrescreve esse mapeamento.',
  '',
  ...credits.flatMap(credit => [`## ${credit.title}`, '', `- Arquivo: \`public${credit.src}\``, `- Autor: ${credit.author}`, `- Fonte: [página original](${credit.sourceUrl})`, `- Licença: [${credit.license}](${credit.licenseUrl})`, `- Referência para: ${productNames(credit.products).join('; ')}.`, '']),
].join('\n');
await fs.writeFile(path.join(root, 'audit/IMAGE-CREDITS.md'), markdown);
const html = `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Créditos das fotos | Passira</title>
<style>body{margin:0;background:#ffffff;color:#171717;font:16px/1.6 system-ui,sans-serif}main{max-width:1100px;margin:auto;padding:40px 24px}a{color:#007d40}h1{font-size:clamp(28px,5vw,44px);line-height:1.1}p{max-width:800px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,270px),1fr));gap:32px;margin-top:40px}article{border-top:1px solid #e2e2e2;padding-top:20px}img{width:100%;height:190px;object-fit:cover;border-radius:12px}h2{font-size:20px;margin:12px 0 4px}small{display:block;color:#606060}ul{padding-left:18px}li{margin:5px 0}a:focus-visible{outline:2px solid #007d40;outline-offset:4px}</style></head>
<body><main><a href="/#cardapio">← Voltar ao cardápio</a><h1>Créditos das fotos</h1><p>${escapeHtml(note)}</p><p>As fotografias originais da Passira foram preservadas. As imagens abaixo são referências externas, redimensionadas e convertidas para WebP. Os arquivos Creative Commons mantêm a licença indicada.</p><div class="grid">${credits.map(credit => `<article id="${escapeHtml(credit.slug)}"><img src="${escapeHtml(credit.src)}" alt="${escapeHtml(credit.title)}, foto ilustrativa" loading="lazy" width="400" height="250"><h2>${escapeHtml(credit.title)}</h2><small>${escapeHtml(credit.author)}</small><p><a href="${escapeHtml(credit.sourceUrl)}" target="_blank" rel="noreferrer">Fotografia original</a> · <a href="${escapeHtml(credit.licenseUrl)}" target="_blank" rel="noreferrer">${escapeHtml(credit.license)}</a></p><small>Referência para:</small><ul>${productNames(credit.products).map(name => `<li>${escapeHtml(name)}</li>`).join('')}</ul></article>`).join('')}</div></main></body></html>\n`;
await fs.writeFile(path.join(directory, 'credits.html'), html);
console.log(`Saved ${credits.length} licensed photographs.`);
