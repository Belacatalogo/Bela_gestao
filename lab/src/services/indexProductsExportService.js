import { getLabProducts } from './labDataService.js';

const INDEX_SOURCES = [
  { label: 'Catálogo público GitHub Pages', url: 'https://belacatalogo.github.io/Bela-catalogo/' },
  { label: 'GitHub Bela-catalogo main index.html', url: 'https://raw.githubusercontent.com/Belacatalogo/Bela-catalogo/main/index.html' },
  { label: 'GitHub Bela_gestao lab index.html', url: 'https://raw.githubusercontent.com/Belacatalogo/Bela_gestao/rewrite-bela-gestao-lab/index.html' },
  { label: 'GitHub Bela_gestao main index.html', url: 'https://raw.githubusercontent.com/Belacatalogo/Bela_gestao/main/index.html' },
];

function normalizeText(value) {
  return String(value ?? '').trim();
}

function normalizeId(value) {
  return normalizeText(value);
}

function normalizeMoney(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string') {
    const number = Number(value.replace(/R\$\s?/i, '').replace(/\./g, '').replace(',', '.').trim());
    return Number.isFinite(number) ? number : 0;
  }
  return 0;
}

function safeFileDate() {
  return new Date().toISOString().replaceAll(':', '-').replaceAll('.', '-');
}

function unquote(value) {
  const text = normalizeText(value);
  if ((text.startsWith('"') && text.endsWith('"')) || (text.startsWith("'") && text.endsWith("'"))) {
    return text.slice(1, -1).replace(/\\'/g, "'").replace(/\\"/g, '"').replace(/\\n/g, '\n');
  }
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
    return match[1]
      .split(',')
      .map((item) => unquote(item))
      .map((item) => normalizeText(item).toLowerCase())
      .filter(Boolean);
  }
  return [];
}

function productScore(product) {
  let score = 0;
  if (product.name) score += 5;
  if (product.brand) score += 2;
  if (product.price > 0) score += 3;
  if (product.imageUrl) score += 3;
  if (product.category) score += 2;
  if (product.catalogTabs.length) score += 1;
  return score;
}

function buildProductFromChunk(chunk, index) {
  const id = extractField(chunk, ['id', 'codigo', 'code', 'key']) || `index-${index + 1}`;
  const name = extractField(chunk, ['name', 'nome', 'titulo', 'title', 'produto']);
  const brand = extractField(chunk, ['brand', 'marca']);
  const price = normalizeMoney(extractField(chunk, ['price', 'preco', 'valor']));
  const cost = normalizeMoney(extractField(chunk, ['cost', 'custo']));
  const imageUrl = extractField(chunk, ['foto', 'imageUrl', 'imagem', 'img', 'url', 'image']);
  const category = normalizeText(extractField(chunk, ['category', 'categoria', 'sub', 'tipo'])).toLowerCase();
  const catalogTabs = Array.from(new Set([
    'todos',
    ...extractArrayField(chunk, ['catalogTabs', 'categories', 'abas']),
    normalizeText(extractField(chunk, ['catalogTab', 'category', 'categoria', 'sub', 'tipo'])).toLowerCase(),
  ].filter(Boolean)));
  const description = extractField(chunk, ['description', 'descricao', 'desc', 'sub']);

  const product = {
    id: normalizeId(id),
    name: normalizeText(name),
    brand: normalizeText(brand),
    description: normalizeText(description),
    price,
    cost,
    imageUrl: normalizeText(imageUrl),
    category,
    catalogTabs,
    source: 'index-html-embedded',
    extraction: {
      method: 'object-literal-regex',
      score: 0,
      chunkPreview: chunk.slice(0, 280),
    },
  };
  product.extraction.score = productScore(product);
  return product;
}

function extractProductChunks(text) {
  const source = String(text || '');
  const chunks = [];
  const objectRegex = /\{[^{}]{0,2600}(?:name|nome|titulo|title|brand|marca|price|preco|valor|foto|fotos|imageUrl|category|catalogTab|catalogTabs|sub)\s*:[^{}]{0,2600}\}/gi;
  let match;
  while ((match = objectRegex.exec(source))) chunks.push(match[0]);
  return chunks;
}

function dedupeProducts(products) {
  const byKey = new Map();
  products.forEach((product) => {
    const key = normalizeText(product.id) || `${product.name}|${product.brand}|${product.price}`.toLowerCase();
    const current = byKey.get(key);
    if (!current || product.extraction.score > current.extraction.score) byKey.set(key, product);
  });
  return Array.from(byKey.values()).sort((a, b) => {
    const aNum = Number(String(a.id).replace(/\D/g, '')) || 0;
    const bNum = Number(String(b.id).replace(/\D/g, '')) || 0;
    return aNum - bNum || a.name.localeCompare(b.name);
  });
}

function buildTabCounts(products) {
  const counts = {};
  products.forEach((product) => {
    const tabs = product.catalogTabs?.length ? product.catalogTabs : ['sem-aba'];
    tabs.forEach((tab) => {
      const key = normalizeText(tab).toLowerCase() || 'sem-aba';
      counts[key] = (counts[key] || 0) + 1;
    });
  });
  return Object.fromEntries(Object.entries(counts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])));
}

function compareWithLab(products) {
  const labProducts = getLabProducts();
  const labIds = new Set(labProducts.map((product) => normalizeText(product.firebaseId || product.id).replace(/^firebase-(recovered-)?/, '')));
  const indexIds = new Set(products.map((product) => normalizeText(product.id)));
  const indexOnly = products.filter((product) => !labIds.has(normalizeText(product.id))).map((product) => product.id).slice(0, 80);
  const labOnly = labProducts.filter((product) => !indexIds.has(normalizeText(product.firebaseId || product.id).replace(/^firebase-(recovered-)?/, ''))).map((product) => product.firebaseId || product.id).slice(0, 80);
  const overlap = products.filter((product) => labIds.has(normalizeText(product.id))).length;

  return {
    labCount: labProducts.length,
    indexCount: products.length,
    overlap,
    indexOnlyCount: Math.max(0, products.length - overlap),
    labOnlyCount: Math.max(0, labProducts.length - overlap),
    indexOnly,
    labOnly,
  };
}

async function fetchText(url) {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return response.text();
}

async function extractFromSource(source) {
  const text = await fetchText(source.url);
  const chunks = extractProductChunks(text);
  const products = dedupeProducts(chunks
    .map((chunk, index) => buildProductFromChunk(chunk, index))
    .filter((product) => product.extraction.score >= 7 && product.name));
  const tabCounts = buildTabCounts(products);

  return {
    ...source,
    ok: true,
    bytes: text.length,
    chunks: chunks.length,
    products,
    productCount: products.length,
    tabCounts,
    sample: products.slice(0, 12),
  };
}

function downloadJson(filename, payload) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export async function exportIndexEmbeddedProductsJson() {
  const attempts = [];
  for (const source of INDEX_SOURCES) {
    try {
      const result = await extractFromSource(source);
      attempts.push(result);
    } catch (error) {
      attempts.push({ ...source, ok: false, error: String(error?.message || error), products: [], productCount: 0, tabCounts: {} });
    }
  }

  const successful = attempts.filter((attempt) => attempt.ok);
  const best = successful.slice().sort((a, b) => b.productCount - a.productCount || b.chunks - a.chunks)[0] || null;

  if (!best) {
    return { ok: false, downloaded: false, attempts, message: 'Não foi possível ler nenhuma fonte index.html para exportar produtos.' };
  }

  const comparison = compareWithLab(best.products);
  const payload = {
    meta: {
      schema: 'bela-catalogo-index-embedded-products-export',
      schemaVersion: 2,
      exportedAt: new Date().toISOString(),
      source: best.label,
      sourceUrl: best.url,
      method: 'index-html-embedded-regex-extraction',
      writeBlocked: true,
      firebaseWriteExecuted: false,
      catalogWriteExecuted: false,
      note: 'Exportação diagnóstica do catálogo público. Não altera catálogo real e não escreve no Firebase.',
    },
    counts: {
      products: best.productCount,
      chunks: best.chunks,
      bytes: best.bytes,
      labProducts: comparison.labCount,
      overlapWithLab: comparison.overlap,
      indexOnly: comparison.indexOnlyCount,
      labOnly: comparison.labOnlyCount,
    },
    tabCounts: best.tabCounts,
    comparison,
    products: best.products,
    attempts: attempts.map((attempt) => ({
      label: attempt.label,
      url: attempt.url,
      ok: attempt.ok,
      error: attempt.error || '',
      bytes: attempt.bytes || 0,
      chunks: attempt.chunks || 0,
      productCount: attempt.productCount || 0,
      tabCounts: attempt.tabCounts || {},
    })),
  };

  const filename = `bela-catalogo-index-products-${safeFileDate()}.json`;
  downloadJson(filename, payload);

  return { ok: true, downloaded: true, filename, best, comparison, attempts, message: 'Produtos embutidos do catálogo público exportados em JSON. Nenhuma escrita foi feita.' };
}
