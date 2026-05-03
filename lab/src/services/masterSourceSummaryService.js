import { getLabProducts } from './labDataService.js';
import {
  CATALOG_SYNC_STATUS,
  DATA_ORIGINS,
  PRODUCT_RECOVERY_STATUS,
  createMasterCustomerContract,
  createMasterPaymentContract,
  createMasterProductContract,
  createMasterSaleContract,
  deriveCatalogSyncStatus,
  explainCatalogSyncStatus,
} from '../contracts/masterSourceContracts.js';

function normalizeText(value) {
  return String(value ?? '').trim();
}

function normalizeMoney(value) {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number : 0;
}

function originFromProduct(product) {
  const source = `${product.source || ''} ${product.importSource || ''}`.toLowerCase();
  if (source.includes('firebase') || source.includes('produtos_custom')) return DATA_ORIGINS.FIREBASE;
  if (source.includes('backup')) return DATA_ORIGINS.MANUAL_BACKUP;
  if (source.includes('catalog')) return DATA_ORIGINS.PUBLIC_CATALOG;
  return DATA_ORIGINS.LAB;
}

function recoveryFromProduct(product) {
  const status = normalizeText(product.confirmationStatus || product.recoveryStatus);
  if (status === PRODUCT_RECOVERY_STATUS.CONFIRMED) return PRODUCT_RECOVERY_STATUS.CONFIRMED;
  if (status === PRODUCT_RECOVERY_STATUS.PROBABLE) return PRODUCT_RECOVERY_STATUS.PROBABLE;
  if (status === PRODUCT_RECOVERY_STATUS.DOUBTFUL) return PRODUCT_RECOVERY_STATUS.DOUBTFUL;
  if (product.firebaseId) return PRODUCT_RECOVERY_STATUS.CONFIRMED;
  if (product.imageUrl && product.name) return PRODUCT_RECOVERY_STATUS.PROBABLE;
  return PRODUCT_RECOVERY_STATUS.PENDING_REVIEW;
}

function toMasterProduct(product, index) {
  const recoveryStatus = recoveryFromProduct(product);
  const origin = originFromProduct(product);
  const master = createMasterProductContract({
    id: normalizeText(product.id || `master-product-${index + 1}`),
    legacyIds: [product.firebaseId, product.originalCatalogId, product.id].map(normalizeText).filter(Boolean),
    firebaseId: normalizeText(product.firebaseId || ''),
    publicCatalogId: normalizeText(product.originalCatalogId || ''),
    name: normalizeText(product.name),
    brand: normalizeText(product.brand),
    description: normalizeText(product.description),
    price: normalizeMoney(product.price),
    cost: normalizeMoney(product.cost),
    imageUrl: normalizeText(product.imageUrl),
    extraImages: Array.isArray(product.extraImages) ? product.extraImages : [],
    category: normalizeText(product.category || 'catalogo').toLowerCase(),
    catalogTabs: Array.from(new Set([...(product.catalogTabs || []), 'todos'].filter(Boolean))),
    badge: normalizeText(product.badge),
    stock: Math.max(0, Number(product.stock || 0)),
    visibleInGestao: true,
    visibleInCatalog: Boolean(product.visibleInCatalog),
    recoveryStatus,
    origins: Array.from(new Set([origin, ...(product.confirmedSources || [])].filter(Boolean))),
    originDetails: {
      source: product.source || '',
      importSource: product.importSource || '',
      sourcePath: product.sourcePath || '',
    },
    sold: Boolean(product.sold),
    notes: normalizeText(product.notes),
    createdAt: product.createdAt || new Date().toISOString(),
    updatedAt: product.updatedAt || new Date().toISOString(),
  });

  return {
    ...master,
    catalogSyncStatus: deriveCatalogSyncStatus(master),
  };
}

export function buildMasterSourceSummary() {
  const products = getLabProducts().map(toMasterProduct);
  const byRecovery = products.reduce((acc, product) => {
    acc[product.recoveryStatus] = (acc[product.recoveryStatus] || 0) + 1;
    return acc;
  }, {});
  const bySync = products.reduce((acc, product) => {
    acc[product.catalogSyncStatus] = (acc[product.catalogSyncStatus] || 0) + 1;
    return acc;
  }, {});
  const byOrigin = products.reduce((acc, product) => {
    product.origins.forEach((origin) => {
      acc[origin] = (acc[origin] || 0) + 1;
    });
    return acc;
  }, {});

  const examples = {
    product: createMasterProductContract(),
    customer: createMasterCustomerContract(),
    sale: createMasterSaleContract(),
    payment: createMasterPaymentContract(),
  };

  return {
    ok: true,
    message: 'Contratos mestre do Gestão preparados. Nenhuma escrita foi feita.',
    counts: {
      products: products.length,
      withImage: products.filter((product) => product.imageUrl).length,
      withPrice: products.filter((product) => product.price > 0).length,
      readyForCatalog: products.filter((product) => product.catalogSyncStatus === CATALOG_SYNC_STATUS.READY).length,
      needsReview: products.filter((product) => product.catalogSyncStatus === CATALOG_SYNC_STATUS.NEEDS_REVIEW).length,
      missingImage: products.filter((product) => product.catalogSyncStatus === CATALOG_SYNC_STATUS.MISSING_IMAGE).length,
      hidden: products.filter((product) => product.catalogSyncStatus === CATALOG_SYNC_STATUS.HIDDEN).length,
    },
    byRecovery,
    bySync,
    byOrigin,
    samples: {
      readyForCatalog: products.filter((product) => product.catalogSyncStatus === CATALOG_SYNC_STATUS.READY).slice(0, 12),
      needsReview: products.filter((product) => product.catalogSyncStatus === CATALOG_SYNC_STATUS.NEEDS_REVIEW).slice(0, 12),
      missingImage: products.filter((product) => product.catalogSyncStatus === CATALOG_SYNC_STATUS.MISSING_IMAGE).slice(0, 12),
    },
    examples,
    explanations: Object.values(CATALOG_SYNC_STATUS).reduce((acc, status) => {
      acc[status] = explainCatalogSyncStatus(status);
      return acc;
    }, {}),
    writeBlocked: true,
    firebaseWriteExecuted: false,
    catalogWriteExecuted: false,
  };
}
