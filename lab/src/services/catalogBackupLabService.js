const CATALOG_BACKUP_KEY = 'belaGestaoLab.catalogBackup.v1';

function canUseStorage() {
  try {
    const key = 'belaGestaoLab.catalogBackupStorageTest';
    window.localStorage.setItem(key, '1');
    window.localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

function safeParse(value, fallback = null) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function normalizeText(value) {
  return String(value || '').trim();
}

function findArrayCandidate(payload) {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object') return [];

  const candidates = [
    payload.products,
    payload.produtos,
    payload.catalogProducts,
    payload.items,
    payload.data?.products,
    payload.data?.produtos,
    payload.catalog?.products,
    payload.catalogo?.produtos,
  ];

  return candidates.find((item) => Array.isArray(item)) || [];
}

function normalizeProduct(raw, index) {
  const name = normalizeText(raw.name || raw.nome || raw.title || raw.titulo || raw.productName);
  const imageUrl = normalizeText(raw.imageUrl || raw.image || raw.img || raw.foto || raw.photo || raw.url);
  const brand = normalizeText(raw.brand || raw.marca || raw.productBrand);
  const description = normalizeText(raw.description || raw.descricao || raw.sub || raw.volume || raw.details);
  const price = raw.price ?? raw.preco ?? raw.valor ?? raw.salePrice ?? '';
  const category = normalizeText(raw.category || raw.categoria || raw.tab || raw.aba || 'catalogo');

  return {
    id: normalizeText(raw.id || raw.slug || raw.sku || `catalog-backup-${index + 1}`),
    name,
    brand,
    description,
    price,
    imageUrl,
    category,
    raw,
  };
}

export function analyzeCatalogBackupPayload(payload) {
  const products = findArrayCandidate(payload).map(normalizeProduct).filter((product) => product.name || product.imageUrl);
  const withImage = products.filter((product) => product.imageUrl).length;
  const withPrice = products.filter((product) => product.price !== '' && product.price !== null && product.price !== undefined).length;
  const categories = [...new Set(products.map((product) => product.category).filter(Boolean))];

  return {
    ok: products.length > 0,
    total: products.length,
    withImage,
    withPrice,
    categories,
    products,
    sourceKeys: payload && typeof payload === 'object' && !Array.isArray(payload) ? Object.keys(payload).slice(0, 20) : [],
  };
}

export function saveCatalogBackupAnalysis(analysis, sourceName = 'catalog-backup.json') {
  if (!canUseStorage()) return { ok: false, error: 'localStorage indisponível.' };
  const record = {
    sourceName,
    savedAt: new Date().toISOString(),
    analysis,
  };
  window.localStorage.setItem(CATALOG_BACKUP_KEY, JSON.stringify(record));
  return { ok: true, record };
}

export function getCatalogBackupAnalysis() {
  if (!canUseStorage()) return null;
  return safeParse(window.localStorage.getItem(CATALOG_BACKUP_KEY), null);
}

export function clearCatalogBackupAnalysis() {
  if (!canUseStorage()) return false;
  window.localStorage.removeItem(CATALOG_BACKUP_KEY);
  return true;
}

export async function readCatalogBackupFile(file) {
  if (!file) return { ok: false, error: 'Selecione um arquivo JSON do catálogo.' };
  const text = await file.text();
  const payload = safeParse(text, null);
  if (!payload) return { ok: false, error: 'Arquivo inválido. O backup precisa ser um JSON válido.' };
  const analysis = analyzeCatalogBackupPayload(payload);
  if (!analysis.ok) return { ok: false, error: 'JSON lido, mas nenhum produto reconhecido foi encontrado.', analysis };
  return { ok: true, analysis };
}

export function buildCatalogBackupExportScript() {
  return `(() => {
  const cards = [...document.querySelectorAll('.product-card, .todos-card, .maes-card, [data-product], [data-produto]')];
  const products = cards.map((card, index) => {
    const img = card.querySelector('img');
    const name = card.querySelector('.product-name, .todos-card-name, [data-name], [data-nome]')?.textContent?.trim() || '';
    const brand = card.querySelector('.product-brand, .todos-card-brand, [data-brand], [data-marca]')?.textContent?.trim() || '';
    const description = card.querySelector('.product-sub, [data-description], [data-descricao]')?.textContent?.trim() || '';
    const price = card.querySelector('.product-price, [data-price], [data-preco]')?.textContent?.trim() || '';
    return {
      id: card.dataset.id || card.dataset.product || card.dataset.produto || 'catalogo-' + (index + 1),
      name,
      brand,
      description,
      price,
      imageUrl: img?.currentSrc || img?.src || '',
      category: card.closest('[id]')?.id || card.closest('.tab-panel')?.id || 'catalogo'
    };
  }).filter((product) => product.name || product.imageUrl);
  const backup = {
    source: 'Bela-catalogo',
    exportedAt: new Date().toISOString(),
    total: products.length,
    products
  };
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'bela-catalogo-backup-' + new Date().toISOString().slice(0,10) + '.json';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 1000);
})();`;
}
