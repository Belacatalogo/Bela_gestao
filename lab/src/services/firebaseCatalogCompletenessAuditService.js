import { getFirebaseLabConfig } from './firebaseLabConfigService.js';
import { getFirebaseReadonlyProbeReadiness } from './firebaseReadonlyProbeService.js';

const FIREBASE_APP_CDN = 'https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js';
const FIREBASE_DATABASE_CDN = 'https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js';

function isObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value);
}

function objectKeys(value) {
  return isObject(value) ? Object.keys(value).map(String) : [];
}

function normalizeId(value) {
  return String(value ?? '').trim();
}

function unique(values) {
  return Array.from(new Set(values.map(normalizeId).filter(Boolean)));
}

function diff(a, b) {
  const bSet = new Set(b.map(normalizeId));
  return a.map(normalizeId).filter((item) => item && !bSet.has(item));
}

function intersect(a, b) {
  const bSet = new Set(b.map(normalizeId));
  return a.map(normalizeId).filter((item) => item && bSet.has(item));
}

function getNested(value, path) {
  return String(path).split('/').filter(Boolean).reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : null), value);
}

function extractPossibleProductObjects(value) {
  const buckets = [];
  const candidates = [
    { label: 'root', value },
    { label: 'produtos', value: value?.produtos },
    { label: 'products', value: value?.products },
    { label: 'produtos_custom', value: value?.produtos_custom },
    { label: 'catalog.products', value: value?.catalog?.products },
    { label: 'catalogo.produtos', value: value?.catalogo?.produtos },
    { label: 'data.produtos', value: value?.data?.produtos },
    { label: 'data.products', value: value?.data?.products },
  ];

  candidates.forEach((candidate) => {
    if (isObject(candidate.value)) {
      buckets.push({ label: candidate.label, keys: objectKeys(candidate.value), count: objectKeys(candidate.value).length });
    }
    if (Array.isArray(candidate.value)) {
      const keys = candidate.value.map((item, index) => normalizeId(item?.id ?? item?.firebaseId ?? item?.key ?? index)).filter(Boolean);
      buckets.push({ label: candidate.label, keys, count: keys.length });
    }
  });

  return buckets.filter((bucket) => bucket.count > 0);
}

function extractCarouselIds(carrossel) {
  if (!carrossel) return [];
  if (Array.isArray(carrossel)) return unique(carrossel.map((item) => (isObject(item) ? item.id ?? item.key ?? item.productId : item)));
  if (Array.isArray(carrossel?.ids)) return unique(carrossel.ids);
  if (isObject(carrossel?.ids)) return unique(Object.values(carrossel.ids));
  if (isObject(carrossel)) return unique(Object.values(carrossel).flatMap((item) => {
    if (Array.isArray(item)) return item;
    if (isObject(item)) return item.id ?? item.key ?? item.productId ?? Object.values(item);
    return item;
  }).flat());
  return [];
}

async function readRealtimePath(path) {
  const config = getFirebaseLabConfig();
  const [{ initializeApp, getApps }, { getDatabase, ref, get }] = await Promise.all([
    import(FIREBASE_APP_CDN),
    import(FIREBASE_DATABASE_CDN),
  ]);
  const app = getApps().find((item) => item.name === 'bela-gestao-lab-readonly')
    || initializeApp(config, 'bela-gestao-lab-readonly');
  const database = getDatabase(app);
  const snapshot = await get(ref(database, path));
  return snapshot.val();
}

function summarizeBackup(label, value, productIds) {
  const buckets = extractPossibleProductObjects(value);
  const largest = buckets.slice().sort((a, b) => b.count - a.count)[0] || { label: 'nenhum', keys: [], count: 0 };
  return {
    label,
    exists: Boolean(value),
    type: Array.isArray(value) ? 'array' : typeof value,
    productBuckets: buckets,
    largestBucket: largest,
    productsOnlyInBackup: diff(largest.keys, productIds).slice(0, 50),
    productsMissingFromBackup: diff(productIds, largest.keys).slice(0, 50),
    overlapWithProdutosCustom: intersect(largest.keys, productIds).length,
  };
}

export async function runFirebaseCatalogCompletenessAudit() {
  const readiness = getFirebaseReadonlyProbeReadiness();
  if (!readiness.ready) {
    return {
      ok: false,
      blocked: true,
      message: 'Config Firebase LAB ainda não está pronta para auditoria de completude.',
      readiness,
    };
  }

  try {
    const [produtosCustom, precos, carrossel, backupUltimo, backupDiario] = await Promise.all([
      readRealtimePath('/produtos_custom'),
      readRealtimePath('/precos'),
      readRealtimePath('/carrossel'),
      readRealtimePath('/backup/ultimo'),
      readRealtimePath('/backup/diario'),
    ]);

    const productIds = unique(objectKeys(produtosCustom));
    const priceIds = unique(objectKeys(precos));
    const carouselIds = extractCarouselIds(carrossel);
    const backupUltimoSummary = summarizeBackup('backup/ultimo', backupUltimo, productIds);
    const backupDiarioSummary = summarizeBackup('backup/diario', backupDiario, productIds);

    const productsWithoutPrice = diff(productIds, priceIds);
    const orphanPrices = diff(priceIds, productIds);
    const productsWithMatchingPrice = intersect(productIds, priceIds);
    const carouselMissingProducts = diff(carouselIds, productIds);
    const productsNotInCarousel = diff(productIds, carouselIds);

    const candidateExtraProductIds = unique([
      ...backupUltimoSummary.productsOnlyInBackup,
      ...backupDiarioSummary.productsOnlyInBackup,
    ]);

    const warnings = [];
    if (orphanPrices.length) warnings.push(`${orphanPrices.length} preço(s) não têm produto correspondente em produtos_custom.`);
    if (productsWithoutPrice.length) warnings.push(`${productsWithoutPrice.length} produto(s) em produtos_custom não têm preço correspondente em /precos.`);
    if (carouselMissingProducts.length) warnings.push(`${carouselMissingProducts.length} item(ns) do carrossel não aparecem em produtos_custom.`);
    if (candidateExtraProductIds.length) warnings.push(`${candidateExtraProductIds.length} possível(is) produto(s) aparecem em backup e não aparecem em produtos_custom.`);

    return {
      ok: true,
      imported: false,
      writeBlocked: true,
      firebaseWriteExecuted: false,
      counts: {
        produtosCustom: productIds.length,
        precos: priceIds.length,
        productsWithMatchingPrice: productsWithMatchingPrice.length,
        productsWithoutPrice: productsWithoutPrice.length,
        orphanPrices: orphanPrices.length,
        carouselIds: carouselIds.length,
        carouselMissingProducts: carouselMissingProducts.length,
        backupUltimoProducts: backupUltimoSummary.largestBucket.count,
        backupDiarioProducts: backupDiarioSummary.largestBucket.count,
        candidateExtraProductIds: candidateExtraProductIds.length,
      },
      samples: {
        productsWithoutPrice: productsWithoutPrice.slice(0, 30),
        orphanPrices: orphanPrices.slice(0, 30),
        carouselIds: carouselIds.slice(0, 30),
        carouselMissingProducts: carouselMissingProducts.slice(0, 30),
        candidateExtraProductIds: candidateExtraProductIds.slice(0, 30),
      },
      backups: [backupUltimoSummary, backupDiarioSummary],
      warnings,
      conclusion: candidateExtraProductIds.length
        ? 'Pode haver produtos adicionais nos backups. Não considerar produtos_custom como catálogo completo ainda.'
        : 'Não foram encontrados produtos adicionais claros nos backups comparados, mas ainda vale exportar JSON completo antes da migração final.',
      message: 'Auditoria de completude concluída em READ-ONLY. Nenhuma escrita foi feita no Firebase.',
    };
  } catch (error) {
    return {
      ok: false,
      imported: false,
      writeBlocked: true,
      firebaseWriteExecuted: false,
      error: {
        name: error?.name || 'Error',
        code: error?.code || '',
        message: String(error?.message || error),
      },
      message: 'Auditoria de completude falhou. Nenhuma escrita foi feita.',
    };
  }
}
