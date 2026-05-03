import { getLabProducts } from './labDataService.js';

const INDEX_SOURCES = [
  { label: 'Catálogo público GitHub Pages', url: 'https://belacatalogo.github.io/Bela-catalogo/', priority: 100 },
  { label: 'GitHub Bela-catalogo main index.html', url: 'https://raw.githubusercontent.com/Belacatalogo/Bela-catalogo/main/index.html', priority: 90 },
  { label: 'GitHub Bela_gestao lab index.html', url: 'https://raw.githubusercontent.com/Belacatalogo/Bela_gestao/rewrite-bela-gestao-lab/index.html', priority: 10 },
  { label: 'GitHub Bela_gestao main index.html', url: 'https://raw.githubusercontent.com/Belacatalogo/Bela_gestao/main/index.html', priority: 5 },
];

const CARD_SELECTORS = ['.product-card', '.todos-card', '.maes-card', '.beleza-card', '.pair-card', '[data-product]', '[data-produto]'].join(',');
const PLACEHOLDER_PATTERN = /\+\s*\(?\s*p\.|\$\{\s*p\.|p\.(?:name|brand|price|sub|image|img)/i;

function normalizeText(value) { return String(value ?? '').replace(/\s+/g, ' ').trim(); }
function normalizeId(value) { return normalizeText(value); }
function isPlaceholder(value) { return PLACEHOLDER_PATTERN.test(String(value || '')); }
function normalizeMoney(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string') {
    if (isPlaceholder(value)) return 0;
    const clean = value.replace(/R\$\s?/i, '').replace(/\./g, '').replace(',', '.').replace(/[^0-9.-]/g, '').trim();
    const number = Number(clean);
    return Number.isFinite(number) ? number : 0;
  }
  return 0;
}
function safeFileDate() { return new Date().toISOString().replaceAll(':', '-').replaceAll('.', '-'); }
function textFrom(root, selector) { return normalizeText(root.querySelector(selector)?.textContent || ''); }
function attrFrom(root, selector, attr) { return normalizeText(root.querySelector(selector)?.getAttribute(attr) || ''); }
function nearestTab(card) {
  const panel = card.closest('.tab-panel,[data-tab-panel],section[id],div[id]');
  const id = normalizeText(panel?.id || panel?.getAttribute?.('data-tab-panel') || '');
  const classes = normalizeText(panel?.className || '');
  if (id) return id.toLowerCase();
  if (/maes/i.test(classes)) return 'maes';
  if (/beleza/i.test(classes)) return 'beleza';
  if (/todos/i.test(classes)) return 'todos';
  return 'todos';
}
function productScore(product) {
  if ([product.name, product.brand, product.description, product.imageUrl, product.category].some(isPlaceholder)) return 0;
  let score = 0;
  if (product.name) score += 5;
  if (product.brand) score += 2;
  if (product.price > 0) score += 3;
  if (product.imageUrl) score += 3;
  if (product.category) score += 2;
  if (product.catalogTabs.length) score += 1;
  return score;
}
function unquote(value) {
  const text = normalizeText(value);
  if ((text.startsWith('"') && text.endsWith('"')) || (text.startsWith("'") && text.endsWith("'"))) return text.slice(1, -1).replace(/\\'/g, "'").replace(/\\"/g, '"').replace(/\\n/g, '\n');
  return text;
}
function extractField(chunk, names) {
  for (const name of names) {
    const regex = new RegExp(`(?:^|[,\\s])${name}\\s*:\\s*("(?:\\\\.|[^"])*"|'(?:\\\\.|[^'])*'|[0-9]+(?:[,.][0-9]+)?|true|false|null)`, 'i');
    const match = chunk.match(regex);
    if (match) return unquote(match[1]);
  }
  return '';
}
function extractArrayField(chunk, names) {
  for (const name of names) {
    const regex = new RegExp(`(?:^|[,\\s])${name}\\s*:\\s*\\[([^\\]]*)\\]`, 'i');
    const match = chunk.match(regex);
    if (!match) continue;
    return match[1].split(',').map((item) => unquote(item)).map((item) => normalizeText(item).toLowerCase()).filter(Boolean);
  }
  return [];
}
function buildProductFromChunk(chunk, index) {
  const id = extractField(chunk, ['id', 'codigo', 'code', 'key']) || `index-${index + 1}`;
  const name = extractField(chunk, ['name', 'nome', 'titulo', 'title', 'produto']);
  const brand = extractField(chunk, ['brand', 'marca']);
  const price = normalizeMoney(extractField(chunk, ['price', 'preco', 'valor']));
  const imageUrl = extractField(chunk, ['foto', 'imageUrl', 'imagem', 'img', 'url', 'image']);
  const category = normalizeText(extractField(chunk, ['category', 'categoria', 'sub', 'tipo'])).toLowerCase();
  const product = { id: normalizeId(id), name: normalizeText(name), brand: normalizeText(brand), description: normalizeText(extractField(chunk, ['description', 'descricao', 'desc', 'sub'])), price, cost: normalizeMoney(extractField(chunk, ['cost', 'custo'])), imageUrl: normalizeText(imageUrl), category, catalogTabs: Array.from(new Set(['todos', ...extractArrayField(chunk, ['catalogTabs', 'categories', 'abas']), category].filter(Boolean))), source: 'index-js-object', extraction: { method: 'object-literal-regex', score: 0, chunkPreview: chunk.slice(0, 280) } };
  product.extraction.score = productScore(product);
  return product;
}
function extractProductChunks(text) {
  const chunks = [];
  const objectRegex = /\{[^{}]{0,2600}(?:name|nome|titulo|title|brand|marca|price|preco|valor|foto|fotos|imageUrl|category|catalogTab|catalogTabs|sub)\s*:[^{}]{0,2600}\}/gi;
  let match;
  while ((match = objectRegex.exec(String(text || '')))) chunks.push(match[0]);
  return chunks;
}
function extractTemplateCardChunks(text) {
  const source = String(text || '');
  const chunks = [];
  const patterns = [
    /<article[\s\S]{0,5000}?<\/article>/gi,
    /<div[^>]+class=["'][^"']*(?:product-card|todos-card|maes-card|beleza-card|pair-card)[^"']*["'][\s\S]{0,5000}?<\/div>/gi,
    /`[\s\S]{0,6000}?(?:product-card|todos-card|maes-card|beleza-card|pair-card)[\s\S]{0,6000}?`/gi,
  ];
  patterns.forEach((pattern) => { let match; while ((match = pattern.exec(source))) chunks.push(match[0]); });
  return chunks;
}
function valueFromTemplate(chunk, labels) {
  for (const label of labels) {
    const attr = new RegExp(`${label}=["']([^"']+)["']`, 'i').exec(chunk);
    if (attr) return normalizeText(attr[1]);
    const cls = new RegExp(`class=["'][^"']*${label}[^"']*["'][^>]*>([\\s\\S]{0,220}?)<`, 'i').exec(chunk);
    if (cls) return normalizeText(cls[1].replace(/<[^>]+>/g, ''));
  }
  return '';
}
function buildProductFromTemplate(chunk, index) {
  const img = /<img[^>]+(?:src|data-src)=["']([^"']+)["']/i.exec(chunk)?.[1] || '';
  const alt = /<img[^>]+alt=["']([^"']+)["']/i.exec(chunk)?.[1] || '';
  const name = valueFromTemplate(chunk, ['product-name', 'todos-card-name', 'maes-name', 'beleza-name', 'prod-name', 'data-product-name']) || alt;
  const brand = valueFromTemplate(chunk, ['product-brand', 'todos-card-brand', 'maes-brand', 'beleza-brand', 'prod-brand', 'data-product-brand']);
  const sub = valueFromTemplate(chunk, ['product-sub', 'product-volume', 'prod-modal-sub', 'data-product-sub']);
  const priceText = valueFromTemplate(chunk, ['product-price', 'pair-price', 'preco', 'price', 'data-product-price']);
  const badge = valueFromTemplate(chunk, ['product-badge', 'badge', 'data-product-badge']);
  const dataId = /data-(?:product-)?id=["']([^"']+)["']/i.exec(chunk)?.[1] || '';
  const category = (/data-(?:category|filter)=["']([^"']+)["']/i.exec(chunk)?.[1] || badge || '').toLowerCase();
  const product = { id: dataId || `template-card-${index + 1}`, name, brand, description: sub, price: normalizeMoney(priceText), cost: 0, imageUrl: img, category, catalogTabs: Array.from(new Set(['todos', category].filter(Boolean))), badge, source: 'public-catalog-template-card', extraction: { method: 'template-card-parser', score: 0, chunkPreview: chunk.slice(0, 280) } };
  product.extraction.score = productScore(product);
  return product;
}
function buildProductFromCard(card, index, sourceUrl) {
  const rawName = textFrom(card, '.product-name,.todos-card-name,.maes-name,.beleza-name,.prod-name,[data-product-name]');
  const fallbackAlt = attrFrom(card, 'img', 'alt');
  const name = rawName || fallbackAlt;
  const brand = textFrom(card, '.product-brand,.todos-card-brand,.maes-brand,.beleza-brand,.prod-brand,[data-product-brand]');
  const sub = textFrom(card, '.product-sub,.prod-modal-sub,.maes-sub,.beleza-sub,.product-volume,[data-product-sub]');
  const priceText = textFrom(card, '.product-price,.pair-price,.preco,.price,[data-product-price]');
  const imageUrl = attrFrom(card, 'img', 'src') || attrFrom(card, 'img', 'data-src');
  const badge = textFrom(card, '.product-badge,.prod-modal-badge,.badge,[data-product-badge]');
  const tab = nearestTab(card);
  const dataId = card.getAttribute('data-id') || card.getAttribute('data-product-id') || card.getAttribute('data-produto-id') || '';
  const id = dataId || `html-card-${index + 1}`;
  const category = normalizeText(card.getAttribute('data-category') || card.getAttribute('data-filter') || tab || badge).toLowerCase();
  const product = { id, name, brand, description: sub, price: normalizeMoney(priceText), cost: 0, imageUrl, category, catalogTabs: Array.from(new Set(['todos', tab, category].filter(Boolean))), badge, source: 'public-catalog-html-card', sourceUrl, extraction: { method: 'dom-card-parser', score: 0, cardClass: normalizeText(card.className || ''), htmlPreview: card.outerHTML.slice(0, 280) } };
  product.extraction.score = productScore(product);
  return product;
}
function extractHtmlCardProducts(text, sourceUrl) {
  if (typeof DOMParser === 'undefined') return [];
  const doc = new DOMParser().parseFromString(String(text || ''), 'text/html');
  return Array.from(doc.querySelectorAll(CARD_SELECTORS)).map((card, index) => buildProductFromCard(card, index, sourceUrl)).filter((product) => product.name && product.extraction.score >= 6);
}
function extractTemplateProducts(text) {
  return extractTemplateCardChunks(text).map((chunk, index) => buildProductFromTemplate(chunk, index)).filter((product) => product.name && !isPlaceholder(product.name) && product.extraction.score >= 6);
}
function dedupeProducts(products) {
  const byKey = new Map();
  products.filter((product) => product.name && !isPlaceholder(product.name)).forEach((product) => {
    const hasGeneratedId = /^(html-card|template-card|index)-/.test(normalizeText(product.id));
    const key = hasGeneratedId ? `${product.name}|${product.brand}|${product.imageUrl}`.toLowerCase() : normalizeText(product.id);
    const current = byKey.get(key);
    if (!current || product.extraction.score > current.extraction.score) byKey.set(key, product);
  });
  return Array.from(byKey.values()).sort((a, b) => a.name.localeCompare(b.name));
}
function buildTabCounts(products) {
  const counts = {};
  products.forEach((product) => (product.catalogTabs?.length ? product.catalogTabs : ['sem-aba']).forEach((tab) => { const key = normalizeText(tab).toLowerCase() || 'sem-aba'; counts[key] = (counts[key] || 0) + 1; }));
  return Object.fromEntries(Object.entries(counts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])));
}
function compareWithLab(products) {
  const labProducts = getLabProducts();
  const labIds = new Set(labProducts.map((product) => normalizeText(product.firebaseId || product.id).replace(/^firebase-(recovered-)?/, '')));
  const indexIds = new Set(products.map((product) => normalizeText(product.id)));
  const overlap = products.filter((product) => labIds.has(normalizeText(product.id))).length;
  return { labCount: labProducts.length, indexCount: products.length, overlap, indexOnlyCount: Math.max(0, products.length - overlap), labOnlyCount: Math.max(0, labProducts.length - overlap), indexOnly: products.filter((product) => !labIds.has(normalizeText(product.id))).map((product) => product.id).slice(0, 80), labOnly: labProducts.filter((product) => !indexIds.has(normalizeText(product.firebaseId || product.id).replace(/^firebase-(recovered-)?/, ''))).map((product) => product.firebaseId || product.id).slice(0, 80) };
}
async function fetchText(url) { const response = await fetch(url, { cache: 'no-store' }); if (!response.ok) throw new Error(`${response.status} ${response.statusText}`); return response.text(); }
async function extractFromSource(source) {
  const text = await fetchText(source.url);
  const htmlProducts = extractHtmlCardProducts(text, source.url);
  const templateProductsRaw = extractTemplateCardChunks(text).map((chunk, index) => buildProductFromTemplate(chunk, index));
  const templateProducts = templateProductsRaw.filter((product) => product.name && !isPlaceholder(product.name) && product.extraction.score >= 6);
  const chunks = extractProductChunks(text);
  const jsProducts = chunks.map((chunk, index) => buildProductFromChunk(chunk, index)).filter((product) => product.extraction.score >= 7 && product.name && !isPlaceholder(product.name));
  const products = dedupeProducts([...htmlProducts, ...templateProducts, ...jsProducts]);
  return { ...source, ok: true, bytes: text.length, chunks: chunks.length, htmlCards: htmlProducts.length, templateCards: templateProducts.length, rejectedTemplateCards: templateProductsRaw.length - templateProducts.length, products, productCount: products.length, tabCounts: buildTabCounts(products), sample: products.slice(0, 12) };
}
function chooseBestSource(attempts) {
  const successful = attempts.filter((attempt) => attempt.ok);
  const catalogSources = successful.filter((attempt) => /Bela-catalogo|Catálogo público/i.test(attempt.label) && attempt.productCount > 0);
  if (catalogSources.length) return catalogSources.sort((a, b) => b.priority - a.priority || b.productCount - a.productCount || b.templateCards - a.templateCards || b.htmlCards - a.htmlCards)[0];
  return successful.sort((a, b) => b.productCount - a.productCount || b.templateCards - a.templateCards || b.htmlCards - a.htmlCards || b.chunks - a.chunks)[0] || null;
}
function downloadJson(filename, payload) { const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' }); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = filename; document.body.appendChild(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1500); }
export async function exportIndexEmbeddedProductsJson() {
  const attempts = [];
  for (const source of INDEX_SOURCES) { try { attempts.push(await extractFromSource(source)); } catch (error) { attempts.push({ ...source, ok: false, error: String(error?.message || error), products: [], productCount: 0, htmlCards: 0, templateCards: 0, rejectedTemplateCards: 0, tabCounts: {} }); } }
  const best = chooseBestSource(attempts);
  if (!best) return { ok: false, downloaded: false, attempts, message: 'Não foi possível ler nenhuma fonte index.html para exportar produtos.' };
  const comparison = compareWithLab(best.products);
  const payload = {
    meta: { schema: 'bela-catalogo-public-template-products-export', schemaVersion: 6, exportedAt: new Date().toISOString(), source: best.label, sourceUrl: best.url, method: 'public-catalog-dom-template-parser-no-placeholders', writeBlocked: true, firebaseWriteExecuted: false, catalogWriteExecuted: false, note: 'Exportação diagnóstica do catálogo público usando DOMParser + templates, rejeitando placeholders p.name/p.brand. Não altera catálogo real e não escreve no Firebase.' },
    counts: { products: best.productCount, htmlCards: best.htmlCards || 0, templateCards: best.templateCards || 0, rejectedTemplateCards: best.rejectedTemplateCards || 0, chunks: best.chunks || 0, bytes: best.bytes || 0, labProducts: comparison.labCount, overlapWithLab: comparison.overlap, indexOnly: comparison.indexOnlyCount, labOnly: comparison.labOnlyCount },
    tabCounts: best.tabCounts,
    comparison,
    products: best.products,
    attempts: attempts.map((attempt) => ({ label: attempt.label, url: attempt.url, ok: attempt.ok, error: attempt.error || '', bytes: attempt.bytes || 0, chunks: attempt.chunks || 0, htmlCards: attempt.htmlCards || 0, templateCards: attempt.templateCards || 0, rejectedTemplateCards: attempt.rejectedTemplateCards || 0, productCount: attempt.productCount || 0, tabCounts: attempt.tabCounts || {} })),
  };
  const filename = `bela-catalogo-public-template-products-${safeFileDate()}.json`;
  downloadJson(filename, payload);
  return { ok: true, downloaded: true, filename, best, comparison, attempts, message: 'Produtos do catálogo público exportados via DOM + templates sem placeholders. Nenhuma escrita foi feita.' };
}
