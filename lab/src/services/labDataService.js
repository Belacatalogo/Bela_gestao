import { createId } from '../utils/ids.js';
import { normalizeMoney, normalizeTabs, normalizeText, validateProductDraft } from '../utils/validators.js';

const LAB_PRODUCTS_KEY = 'belaGestaoLab.products.v1';
const LAB_PLACEHOLDER_IMAGE = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1100" viewBox="0 0 900 1100"><rect width="900" height="1100" fill="%23080808"/><rect x="34" y="34" width="832" height="1032" rx="70" fill="none" stroke="%23c9a84c" stroke-width="8" opacity="0.55"/><text x="450" y="500" text-anchor="middle" font-family="Georgia,serif" font-size="92" fill="%23f0e8dc">Bela</text><text x="450" y="590" text-anchor="middle" font-family="Arial,sans-serif" font-size="30" letter-spacing="12" fill="%23c9a84c">PRODUTO LAB</text><text x="450" y="650" text-anchor="middle" font-family="Arial,sans-serif" font-size="22" fill="%238f877b">imagem provisória</text></svg>';

const SAMPLE_PRODUCTS = [
  {
    id: 'lab-prod-001',
    name: 'Perfume Floral Lumière',
    brand: 'Bela LAB',
    description: 'Fragrância floral sofisticada para demonstração do catálogo fictício.',
    price: 89.9,
    cost: 52,
    imageUrl: 'https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=900&q=80',
    category: 'perfumes',
    catalogTabs: ['todos', 'perfumes', 'destaques'],
    visibleInCatalog: true,
    badge: 'Destaque',
    stock: 3,
    order: 1,
    createdAt: '2026-04-30T00:00:00.000Z',
    updatedAt: '2026-04-30T00:00:00.000Z',
  },
  {
    id: 'lab-prod-002',
    name: 'Kit Cuidados Rosé',
    brand: 'Bela LAB',
    description: 'Kit fictício com hidratante, sabonete e creme para testes visuais.',
    price: 119.9,
    cost: 74,
    imageUrl: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=900&q=80',
    category: 'kits',
    catalogTabs: ['todos', 'kits', 'presentes'],
    visibleInCatalog: true,
    badge: 'Presente',
    stock: 2,
    order: 2,
    createdAt: '2026-04-30T00:00:00.000Z',
    updatedAt: '2026-04-30T00:00:00.000Z',
  },
  {
    id: 'lab-prod-003',
    name: 'Hidratante Velvet',
    brand: 'Bela LAB',
    description: 'Produto oculto usado para testar se itens invisíveis somem do catálogo.',
    price: 49.9,
    cost: 28,
    imageUrl: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=900&q=80',
    category: 'cuidados',
    catalogTabs: ['todos', 'cuidados'],
    visibleInCatalog: false,
    badge: 'Oculto',
    stock: 1,
    order: 3,
    createdAt: '2026-04-30T00:00:00.000Z',
    updatedAt: '2026-04-30T00:00:00.000Z',
  },
];

function safeParse(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function canUseStorage() {
  try {
    const testKey = 'belaGestaoLab.storageTest';
    window.localStorage.setItem(testKey, '1');
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

function normalizeProductDraft(draft, existingProduct = null) {
  const now = new Date().toISOString();
  const baseOrder = existingProduct?.order || getLabProducts().length + 1;

  return {
    id: existingProduct?.id || createId('lab-prod'),
    name: normalizeText(draft.name),
    brand: normalizeText(draft.brand),
    description: normalizeText(draft.description) || 'Produto cadastrado no modo LAB.',
    price: normalizeMoney(draft.price),
    cost: normalizeMoney(draft.cost),
    imageUrl: normalizeText(draft.imageUrl) || LAB_PLACEHOLDER_IMAGE,
    category: normalizeText(draft.category).toLowerCase(),
    catalogTabs: normalizeTabs(draft.catalogTabs).length ? normalizeTabs(draft.catalogTabs) : ['todos'],
    visibleInCatalog: Boolean(draft.visibleInCatalog),
    badge: normalizeText(draft.badge),
    stock: Math.max(0, Number(draft.stock || 0)),
    order: Number(draft.order || baseOrder),
    createdAt: existingProduct?.createdAt || now,
    updatedAt: now,
  };
}

export function getLabProducts() {
  if (!canUseStorage()) return SAMPLE_PRODUCTS;

  const stored = safeParse(window.localStorage.getItem(LAB_PRODUCTS_KEY));
  if (!Array.isArray(stored) || stored.length === 0) {
    window.localStorage.setItem(LAB_PRODUCTS_KEY, JSON.stringify(SAMPLE_PRODUCTS));
    return SAMPLE_PRODUCTS;
  }

  return stored;
}

export function getLabProductById(productId) {
  return getLabProducts().find((product) => product.id === productId) || null;
}

export function saveLabProducts(products) {
  if (!canUseStorage()) return false;
  window.localStorage.setItem(LAB_PRODUCTS_KEY, JSON.stringify(products));
  return true;
}

export function resetLabProducts() {
  if (!canUseStorage()) return SAMPLE_PRODUCTS;
  window.localStorage.setItem(LAB_PRODUCTS_KEY, JSON.stringify(SAMPLE_PRODUCTS));
  return SAMPLE_PRODUCTS;
}

export function getVisibleCatalogProducts() {
  return getLabProducts()
    .filter((product) => product.visibleInCatalog)
    .sort((a, b) => Number(a.order || 0) - Number(b.order || 0));
}

export function updateLabProductVisibility(productId, visibleInCatalog) {
  const products = getLabProducts().map((product) => {
    if (product.id !== productId) return product;
    return {
      ...product,
      visibleInCatalog,
      updatedAt: new Date().toISOString(),
    };
  });

  saveLabProducts(products);
  return products;
}

export function upsertLabProduct(draft) {
  const validation = validateProductDraft(draft);
  if (!validation.ok) {
    return {
      ok: false,
      errors: validation.errors,
      products: getLabProducts(),
    };
  }

  const products = getLabProducts();
  const existingProduct = draft.id ? products.find((product) => product.id === draft.id) : null;
  const normalized = normalizeProductDraft(draft, existingProduct);
  const nextProducts = existingProduct
    ? products.map((product) => (product.id === existingProduct.id ? normalized : product))
    : [...products, normalized];

  saveLabProducts(nextProducts);

  return {
    ok: true,
    errors: [],
    product: normalized,
    products: nextProducts,
  };
}

export function getLabStorageInfo() {
  return {
    key: LAB_PRODUCTS_KEY,
    mode: 'visitor-localStorage',
    affectsRealCatalog: false,
    affectsFirebase: false,
  };
}
