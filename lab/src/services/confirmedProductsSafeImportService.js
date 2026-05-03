import { getLabProducts, replaceLabProducts } from './labDataService.js';
import { exportIndexEmbeddedProductsJson } from './indexProductsExportService.js';

const CONFIRMED_IMPORT_META_KEY = 'belaGestaoLab.confirmedProductsImport.v1';
const PLACEHOLDER_PATTERN = /\+\s*\(?\s*p\.|\$\{\s*p\.|p\.(?:name|brand|price|sub|image|img)/i;

function normalizeText(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function normalizeKey(value) {
  return normalizeText(value).toLowerCase();
}

function isPlaceholder(value) {
  return PLACEHOLDER_PATTERN.test(String(value || ''));
}

function isRealProduct(product) {
  if (!product || typeof product !== 'object') return false;
  if (!normalizeText(product.name)) return false;
  if (isPlaceholder(product.name) || isPlaceholder(product.brand) || isPlaceholder(product.description) || isPlaceholder(product.imageUrl)) return false;
  if (normalizeText(product.name).length < 2) return false;
  return true;
}

function sourceRank(product) {
  const source = normalizeText(product.source || product.importSource || '');
  if (/firebase|produtos_custom|backup/i.test(source)) return 100;
  if (/public-catalog|index|catalog/i.test(source)) return 70;
  return 10;
}

function mergeProduct(primary, secondary) {
  const best = sourceRank(primary) >= sourceRank(secondary) ? primary : secondary;
  const other = best === primary ? secondary : primary;
  const sources = Array.from(new Set([
    ...(Array.isArray(primary.confirmedSources) ? primary.confirmedSources : []),
    ...(Array.isArray(secondary.confirmedSources) ? secondary.confirmedSources : []),
    normalizeText(primary.source || primary.importSource || ''),
    normalizeText(secondary.source || secondary.importSource || ''),
  ].filter(Boolean)));

  return {
    ...best,
    name: normalizeText(best.name || other.name),
    brand: normalizeText(best.brand || other.brand),
    description: normalizeText(best.description || other.description),
    price: Number(best.price || 0) > 0 ? best.price : other.price,
    imageUrl: normalizeText(best.imageUrl || other.imageUrl),
    category: normalizeText(best.category || other.category || 'catalogo').toLowerCase(),
    catalogTabs: Array.from(new Set([...(best.catalogTabs || []), ...(other.catalogTabs || []), 'todos'].filter(Boolean))),
    confirmedSources: sources,
    confirmationStatus: sources.length >= 2 ? 'confirmado' : (best.imageUrl ? 'provavel' : 'duvidoso'),
    safeImport: true,
    updatedAt: new Date().toISOString(),
  };
}

function productIdentity(product) {
  const firebaseId = normalizeText(product.firebaseId || '').replace(/^firebase-(recovered-)?/, '');
  if (firebaseId) return `id:${firebaseId}`;
  const id = normalizeText(product.id || '').replace(/^firebase-(recovered-)?/, '');
  if (id && !/^(html-card|template-card|index|lab-prod)-/.test(id)) return `id:${id}`;
  return `name:${normalizeKey(product.name)}|brand:${normalizeKey(product.brand)}|price:${Number(product.price || 0)}`;
}

function normalizeLabProduct(product, index) {
  const source = normalizeText(product.source || product.importSource || 'lab-current');
  return {
    ...product,
    id: normalizeText(product.id || `safe-lab-${index + 1}`),
    firebaseId: normalizeText(product.firebaseId || '').replace(/^firebase-(recovered-)?/, ''),
    name: normalizeText(product.name),
    brand: normalizeText(product.brand),
    description: normalizeText(product.description),
    price: Number(product.price || 0),
    imageUrl: normalizeText(product.imageUrl),
    category: normalizeText(product.category || 'gestao').toLowerCase(),
    catalogTabs: Array.from(new Set([...(product.catalogTabs || []), 'todos'].filter(Boolean))),
    confirmedSources: [source].filter(Boolean),
    confirmationStatus: sourceRank(product) >= 100 ? 'confirmado' : 'provavel',
    safeImport: true,
    order: Number(product.order || index + 1),
  };
}

function normalizeCatalogProduct(product, index) {
  const id = normalizeText(product.id || `catalog-${index + 1}`);
  return {
    id: `catalog-${id}`,
    firebaseId: '',
    name: normalizeText(product.name),
    brand: normalizeText(product.brand),
    description: normalizeText(product.description),
    price: Number(product.price || 0),
    cost: 0,
    imageUrl: normalizeText(product.imageUrl),
    category: normalizeText(product.category || 'catalogo').toLowerCase(),
    catalogTabs: Array.from(new Set([...(product.catalogTabs || []), 'todos'].filter(Boolean))),
    visibleInCatalog: true,
    badge: normalizeText(product.badge || 'Catálogo'),
    stock: 0,
    order: index + 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    source: 'public-catalog-confirmed-extract',
    originalCatalogId: id,
    confirmedSources: ['public-catalog'],
    confirmationStatus: product.imageUrl ? 'provavel' : 'duvidoso',
    safeImport: true,
  };
}

function buildSafeSet(labProducts, catalogProducts) {
  const map = new Map();
  const rejected = [];

  labProducts.forEach((product, index) => {
    if (!isRealProduct(product)) {
      rejected.push({ source: 'lab', reason: 'sem nome real ou template', name: product?.name || '', id: product?.id || '' });
      return;
    }
    const normalized = normalizeLabProduct(product, index);
    map.set(productIdentity(normalized), normalized);
  });

  catalogProducts.forEach((product, index) => {
    if (!isRealProduct(product)) {
      rejected.push({ source: 'catalog', reason: 'sem nome real ou template', name: product?.name || '', id: product?.id || '' });
      return;
    }
    const normalized = normalizeCatalogProduct(product, index);
    const key = productIdentity(normalized);
    const current = map.get(key);
    map.set(key, current ? mergeProduct(current, normalized) : normalized);
  });

  const products = Array.from(map.values()).map((product, index) => ({
    ...product,
    order: index + 1,
    updatedAt: new Date().toISOString(),
  }));

  return { products, rejected };
}

function summarize(products) {
  return products.reduce((acc, product) => {
    const status = product.confirmationStatus || 'duvidoso';
    acc[status] = (acc[status] || 0) + 1;
    if (product.imageUrl) acc.withImage += 1;
    if (Number(product.price || 0) > 0) acc.withPrice += 1;
    return acc;
  }, { confirmado: 0, provavel: 0, duvidoso: 0, withImage: 0, withPrice: 0 });
}

export async function importConfirmedProductsSafelyToLab() {
  const labBefore = getLabProducts();
  const catalogExport = await exportIndexEmbeddedProductsJson();
  const catalogProducts = catalogExport?.best?.products || [];
  const { products, rejected } = buildSafeSet(labBefore, catalogProducts);
  const saved = replaceLabProducts(products);
  const summary = summarize(saved);
  const meta = {
    exportedAt: new Date().toISOString(),
    labBefore: labBefore.length,
    catalogExtracted: catalogProducts.length,
    totalImported: saved.length,
    rejected: rejected.length,
    summary,
    sourceUsed: catalogExport?.best?.label || '',
    sourceUrl: catalogExport?.best?.url || '',
    firebaseWriteExecuted: false,
    catalogWriteExecuted: false,
  };
  try {
    window.localStorage.setItem(CONFIRMED_IMPORT_META_KEY, JSON.stringify(meta));
  } catch {}

  return {
    ok: true,
    message: 'Importação segura de produtos confirmados concluída no LAB. Nada foi apagado e nenhuma escrita foi feita no Firebase.',
    counts: meta,
    samples: {
      confirmed: saved.filter((product) => product.confirmationStatus === 'confirmado').slice(0, 12).map((product) => ({ id: product.id, firebaseId: product.firebaseId, name: product.name, brand: product.brand, price: product.price })),
      probable: saved.filter((product) => product.confirmationStatus === 'provavel').slice(0, 12).map((product) => ({ id: product.id, firebaseId: product.firebaseId, name: product.name, brand: product.brand, price: product.price })),
      doubtful: saved.filter((product) => product.confirmationStatus === 'duvidoso').slice(0, 12).map((product) => ({ id: product.id, firebaseId: product.firebaseId, name: product.name, brand: product.brand, price: product.price })),
      rejected: rejected.slice(0, 20),
    },
    writeBlocked: true,
    firebaseWriteExecuted: false,
    catalogWriteExecuted: false,
  };
}
