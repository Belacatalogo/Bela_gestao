import { getFirebaseLabConfig } from './firebaseLabConfigService.js';
import { getFirebaseReadonlyProbeReadiness } from './firebaseReadonlyProbeService.js';
import { replaceLabProducts } from './labDataService.js';

const FIREBASE_APP_CDN = 'https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js';
const FIREBASE_DATABASE_CDN = 'https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js';

const PLACEHOLDER_IMAGE = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1100" viewBox="0 0 900 1100"><rect width="900" height="1100" fill="%23080808"/><rect x="34" y="34" width="832" height="1032" rx="70" fill="none" stroke="%23c9a84c" stroke-width="8" opacity="0.55"/><text x="450" y="500" text-anchor="middle" font-family="Georgia,serif" font-size="92" fill="%23f0e8dc">Bela</text><text x="450" y="590" text-anchor="middle" font-family="Arial,sans-serif" font-size="30" letter-spacing="12" fill="%23c9a84c">IMPORT LAB</text><text x="450" y="650" text-anchor="middle" font-family="Arial,sans-serif" font-size="22" fill="%238f877b">sem foto detectada</text></svg>';

function isObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value);
}

function normalizeText(value) {
  return String(value ?? '').trim();
}

function normalizeId(value) {
  return normalizeText(value);
}

function normalizePriceValue(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string') {
    const normalized = value.replace(/R\$\s?/i, '').replace(/\./g, '').replace(',', '.').trim();
    const number = Number(normalized);
    return Number.isFinite(number) ? number : 0;
  }
  if (isObject(value)) {
    return normalizePriceValue(value.preco ?? value.price ?? value.valor ?? value.value);
  }
  return 0;
}

function firstNonEmpty(...values) {
  return values.find((value) => normalizeText(value)) ?? '';
}

function normalizeArrayLike(value) {
  if (Array.isArray(value)) return value;
  if (isObject(value)) return Object.values(value);
  if (normalizeText(value)) return String(value).split(/[;,]/g);
  return [];
}

function normalizeTabs(product) {
  const rawValues = [
    ...normalizeArrayLike(product.catalogTabs),
    ...normalizeArrayLike(product.catalogTab),
    ...normalizeArrayLike(product.categories),
    ...normalizeArrayLike(product.category),
    ...normalizeArrayLike(product.sub),
  ];
  const tabs = rawValues.map((item) => normalizeText(item).toLowerCase()).filter(Boolean);
  return Array.from(new Set(['todos', ...tabs]));
}

function normalizeCategory(product) {
  const value = firstNonEmpty(
    product.category,
    Array.isArray(product.categories) ? product.categories[0] : product.categories,
    product.sub,
    'firebase'
  );
  return normalizeText(value).toLowerCase() || 'firebase';
}

function normalizeImage(product) {
  const direct = firstNonEmpty(product.foto, product.imageUrl, product.imagem, product.img, product.url, product.image);
  if (direct) return direct;
  if (Array.isArray(product.fotos) && product.fotos.length) return firstNonEmpty(...product.fotos);
  if (isObject(product.fotos)) return firstNonEmpty(...Object.values(product.fotos));
  return PLACEHOLDER_IMAGE;
}

function looksLikeProduct(value) {
  if (!isObject(value)) return false;
  const keys = Object.keys(value).map((key) => key.toLowerCase());
  const productSignals = ['name', 'nome', 'titulo', 'title', 'brand', 'marca', 'foto', 'fotos', 'image', 'imageurl', 'category', 'categories', 'catalogtab', 'catalogtabs', 'sub'];
  return productSignals.some((signal) => keys.includes(signal));
}

function objectEntries(value) {
  return isObject(value) ? Object.entries(value) : [];
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

function extractCarouselIds(carrossel) {
  if (!carrossel) return [];
  if (Array.isArray(carrossel)) return carrossel.map((item) => normalizeId(isObject(item) ? item.id ?? item.key ?? item.productId : item)).filter(Boolean);
  if (Array.isArray(carrossel.ids)) return carrossel.ids.map(normalizeId).filter(Boolean);
  if (isObject(carrossel.ids)) return Object.values(carrossel.ids).map(normalizeId).filter(Boolean);
  if (isObject(carrossel)) {
    return Object.values(carrossel).flatMap((item) => {
      if (Array.isArray(item)) return item;
      if (isObject(item)) return [item.id ?? item.key ?? item.productId, ...Object.values(item)];
      return [item];
    }).map(normalizeId).filter(Boolean);
  }
  return [];
}

function collectBackupProductCandidates(root, sourceLabel) {
  const candidates = new Map();
  const visited = new Set();

  function visit(node, path, depth = 0) {
    if (!node || depth > 5) return;
    if (typeof node === 'object') {
      if (visited.has(node)) return;
      visited.add(node);
    }

    if (Array.isArray(node)) {
      node.forEach((item, index) => {
        if (looksLikeProduct(item)) {
          const id = normalizeId(item.id ?? item.firebaseId ?? item.key ?? index);
          if (id) candidates.set(id, { id, value: item, sourceLabel, sourcePath: `${path}/${index}` });
        }
        visit(item, `${path}/${index}`, depth + 1);
      });
      return;
    }

    if (!isObject(node)) return;

    const entries = Object.entries(node);
    const productLikeChildren = entries.filter(([, value]) => looksLikeProduct(value));
    if (productLikeChildren.length >= 1) {
      productLikeChildren.forEach(([key, value]) => {
        const id = normalizeId(value.id ?? value.firebaseId ?? value.key ?? key);
        if (id) candidates.set(id, { id, value, sourceLabel, sourcePath: `${path}/${key}` });
      });
    }

    entries.forEach(([key, value]) => visit(value, `${path}/${key}`, depth + 1));
  }

  visit(root, sourceLabel);
  return Array.from(candidates.values());
}

function normalizeProduct(firebaseId, source, prices, index, importSource, sourcePath = '') {
  const product = isObject(source) ? source : {};
  const explicitPrice = normalizePriceValue(product.price ?? product.preco ?? product.valor);
  const fallbackPrice = normalizePriceValue(prices?.[firebaseId]);
  const price = explicitPrice || fallbackPrice;
  const now = new Date().toISOString();

  return {
    id: `firebase-${firebaseId}`,
    firebaseId: String(firebaseId),
    name: normalizeText(firstNonEmpty(product.name, product.nome, product.titulo, product.title, `Produto Firebase ${firebaseId}`)),
    brand: normalizeText(firstNonEmpty(product.brand, product.marca, 'Firebase')),
    description: normalizeText(firstNonEmpty(product.description, product.descricao, product.desc, `Produto importado de ${importSource} em modo LAB READ-ONLY.`)),
    price,
    cost: normalizePriceValue(product.cost ?? product.custo),
    imageUrl: normalizeImage(product),
    category: normalizeCategory(product),
    catalogTabs: normalizeTabs(product),
    visibleInCatalog: product.visibleInCatalog ?? product.publicado ?? product.visible ?? true,
    badge: normalizeText(firstNonEmpty(product.badge, product.tag, product.selo, importSource.includes('backup') ? 'Backup' : 'Firebase')),
    stock: Math.max(0, Number(product.stock ?? product.estoque ?? 0)),
    order: Number(product.order ?? product.ordem ?? index + 1),
    createdAt: normalizeText(product.createdAt) || now,
    updatedAt: now,
    source: 'firebase-readonly-unified-import-lab',
    importedFromFirebase: true,
    importSource,
    sourcePath,
    priceSource: explicitPrice ? 'product.price' : (fallbackPrice ? '/precos fallback' : 'missing'),
    originalFields: Object.keys(product),
  };
}

function buildUnifiedProducts({ produtosCustom, precos, carrossel, backupUltimo, backupDiario }) {
  const productsByFirebaseId = new Map();
  const addedFromBase = [];
  const addedFromBackup = [];
  const carouselMissing = [];
  const ignoredBackupCandidates = [];

  objectEntries(produtosCustom).forEach(([id, value], index) => {
    const normalizedId = normalizeId(id);
    productsByFirebaseId.set(normalizedId, normalizeProduct(normalizedId, value, precos || {}, index, 'produtos_custom', `/produtos_custom/${normalizedId}`));
    addedFromBase.push(normalizedId);
  });

  const backupCandidates = [
    ...collectBackupProductCandidates(backupUltimo, 'backup/ultimo'),
    ...collectBackupProductCandidates(backupDiario, 'backup/diario'),
  ];

  backupCandidates.forEach((candidate) => {
    if (!candidate.id) return;
    if (productsByFirebaseId.has(candidate.id)) {
      ignoredBackupCandidates.push(candidate.id);
      return;
    }
    const product = normalizeProduct(candidate.id, candidate.value, precos || {}, productsByFirebaseId.size, candidate.sourceLabel, candidate.sourcePath);
    productsByFirebaseId.set(candidate.id, product);
    addedFromBackup.push(candidate.id);
  });

  const carouselIds = Array.from(new Set(extractCarouselIds(carrossel)));
  carouselIds.forEach((id) => {
    if (!productsByFirebaseId.has(id)) carouselMissing.push(id);
  });

  const products = Array.from(productsByFirebaseId.values()).sort((a, b) => Number(a.order || 0) - Number(b.order || 0));
  const priceIds = Object.keys(precos || {});
  const productIdSet = new Set(products.map((product) => product.firebaseId));
  const orphanPriceIds = priceIds.filter((id) => !productIdSet.has(String(id)));

  return {
    products,
    addedFromBase,
    addedFromBackup,
    ignoredBackupCandidates: Array.from(new Set(ignoredBackupCandidates)),
    carouselIds,
    carouselMissing,
    orphanPriceIds,
  };
}

export async function importFirebaseUnifiedSmartToLab() {
  const readiness = getFirebaseReadonlyProbeReadiness();
  if (!readiness.ready) {
    return {
      ok: false,
      imported: false,
      message: 'Config Firebase LAB ainda não está pronta para importação inteligente.',
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

    const unified = buildUnifiedProducts({ produtosCustom, precos, carrossel, backupUltimo, backupDiario });
    const saved = replaceLabProducts(unified.products);
    const withPrice = saved.filter((product) => Number(product.price || 0) > 0).length;
    const missingPrice = saved.filter((product) => Number(product.price || 0) <= 0).length;
    const withImage = saved.filter((product) => product.imageUrl && !String(product.imageUrl).startsWith('data:image/svg+xml')).length;
    const fromBackup = saved.filter((product) => String(product.importSource || '').startsWith('backup/')).length;

    return {
      ok: true,
      imported: true,
      writeBlocked: true,
      firebaseWriteExecuted: false,
      catalogWriteExecuted: false,
      counts: {
        baseProdutosCustom: unified.addedFromBase.length,
        addedFromBackup: unified.addedFromBackup.length,
        totalImported: saved.length,
        withPrice,
        missingPrice,
        withImage,
        fromBackup,
        carouselIds: unified.carouselIds.length,
        carouselStillMissing: unified.carouselMissing.length,
        orphanPrices: unified.orphanPriceIds.length,
      },
      samples: {
        addedFromBackup: unified.addedFromBackup.slice(0, 30),
        carouselStillMissing: unified.carouselMissing.slice(0, 30),
        orphanPrices: unified.orphanPriceIds.slice(0, 30),
        imported: saved.slice(0, 10).map((product) => ({
          name: product.name,
          firebaseId: product.firebaseId,
          price: product.price,
          priceSource: product.priceSource,
          importSource: product.importSource,
          category: product.category,
        })),
      },
      conclusion: unified.addedFromBackup.length
        ? `Importação unificada adicionou ${unified.addedFromBackup.length} produto(s) vindos do backup além de produtos_custom.`
        : 'Importação unificada não encontrou produto extra válido no backup além de produtos_custom.',
      message: 'Importação inteligente unificada concluída no LAB. Nenhuma escrita foi feita no Firebase.',
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
      message: 'Importação inteligente unificada falhou. Nenhuma escrita foi feita no Firebase.',
    };
  }
}
