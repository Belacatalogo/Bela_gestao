import { getFirebaseLabConfig } from './firebaseLabConfigService.js';
import { getFirebaseReadonlyProbeReadiness } from './firebaseReadonlyProbeService.js';
import { getLabProducts, replaceLabProducts } from './labDataService.js';

const FIREBASE_APP_CDN = 'https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js';
const FIREBASE_DATABASE_CDN = 'https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js';

const PLACEHOLDER_IMAGE = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1100" viewBox="0 0 900 1100"><rect width="900" height="1100" fill="%23080808"/><rect x="34" y="34" width="832" height="1032" rx="70" fill="none" stroke="%23c9a84c" stroke-width="8" opacity="0.55"/><text x="450" y="500" text-anchor="middle" font-family="Georgia,serif" font-size="92" fill="%23f0e8dc">Bela</text><text x="450" y="590" text-anchor="middle" font-family="Arial,sans-serif" font-size="30" letter-spacing="12" fill="%23c9a84c">ÓRFÃO LAB</text><text x="450" y="650" text-anchor="middle" font-family="Arial,sans-serif" font-size="22" fill="%238f877b">candidato reconstruído</text></svg>';

function isObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value);
}

function normalizeText(value) {
  return String(value ?? '').trim();
}

function normalizeId(value) {
  return normalizeText(value);
}

function unique(values) {
  return Array.from(new Set(values.map(normalizeId).filter(Boolean)));
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
  return Array.from(new Set(['todos', 'recuperados', ...tabs]));
}

function normalizeCategory(product) {
  return normalizeText(firstNonEmpty(product.category, Array.isArray(product.categories) ? product.categories[0] : product.categories, product.sub, 'recuperados')).toLowerCase() || 'recuperados';
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

function extractCarouselIds(carrossel) {
  if (!carrossel) return [];
  if (Array.isArray(carrossel)) return unique(carrossel.map((item) => (isObject(item) ? item.id ?? item.key ?? item.productId : item)));
  if (Array.isArray(carrossel.ids)) return unique(carrossel.ids);
  if (isObject(carrossel.ids)) return unique(Object.values(carrossel.ids));
  if (isObject(carrossel)) {
    return unique(Object.values(carrossel).flatMap((item) => {
      if (Array.isArray(item)) return item;
      if (isObject(item)) return [item.id ?? item.key ?? item.productId, ...Object.values(item)];
      return [item];
    }).flat());
  }
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

function collectProductCandidates(root, sourceLabel) {
  const candidates = new Map();
  const visited = new Set();

  function addCandidate(id, value, path) {
    const cleanId = normalizeId(id);
    if (!cleanId || !looksLikeProduct(value)) return;
    candidates.set(cleanId, { id: cleanId, value, sourceLabel, sourcePath: path });
  }

  function visit(node, path, depth = 0) {
    if (!node || depth > 6) return;
    if (typeof node === 'object') {
      if (visited.has(node)) return;
      visited.add(node);
    }

    if (Array.isArray(node)) {
      node.forEach((item, index) => {
        addCandidate(item?.id ?? item?.firebaseId ?? item?.key ?? index, item, `${path}/${index}`);
        visit(item, `${path}/${index}`, depth + 1);
      });
      return;
    }

    if (!isObject(node)) return;

    Object.entries(node).forEach(([key, value]) => {
      addCandidate(value?.id ?? value?.firebaseId ?? value?.key ?? key, value, `${path}/${key}`);
      visit(value, `${path}/${key}`, depth + 1);
    });
  }

  visit(root, sourceLabel);
  return Array.from(candidates.values());
}

function productFromCandidate(candidate, priceRaw, order) {
  const product = candidate.value || {};
  const explicitPrice = normalizePriceValue(product.price ?? product.preco ?? product.valor);
  const fallbackPrice = normalizePriceValue(priceRaw);
  const price = explicitPrice || fallbackPrice;
  const now = new Date().toISOString();

  return {
    id: `firebase-recovered-${candidate.id}`,
    firebaseId: String(candidate.id),
    name: normalizeText(firstNonEmpty(product.name, product.nome, product.titulo, product.title, `Produto recuperado ${candidate.id}`)),
    brand: normalizeText(firstNonEmpty(product.brand, product.marca, 'Firebase')),
    description: normalizeText(firstNonEmpty(product.description, product.descricao, product.desc, `Produto reconstruído no LAB a partir de ${candidate.sourceLabel}.`)),
    price,
    cost: normalizePriceValue(product.cost ?? product.custo),
    imageUrl: normalizeImage(product),
    category: normalizeCategory(product),
    catalogTabs: normalizeTabs(product),
    visibleInCatalog: product.visibleInCatalog ?? product.publicado ?? product.visible ?? true,
    badge: normalizeText(firstNonEmpty(product.badge, product.tag, product.selo, 'Recuperado')),
    stock: Math.max(0, Number(product.stock ?? product.estoque ?? 0)),
    order: Number(product.order ?? product.ordem ?? order),
    createdAt: normalizeText(product.createdAt) || now,
    updatedAt: now,
    source: 'firebase-readonly-orphan-resolution-lab',
    importedFromFirebase: true,
    importSource: candidate.sourceLabel,
    sourcePath: candidate.sourcePath,
    priceSource: explicitPrice ? 'product.price' : (fallbackPrice ? '/precos fallback' : 'missing'),
    recoveredOrphan: true,
    originalFields: Object.keys(product),
  };
}

function candidateScore(candidate) {
  const value = candidate.value || {};
  let score = 0;
  if (firstNonEmpty(value.name, value.nome, value.titulo, value.title)) score += 4;
  if (firstNonEmpty(value.foto, value.imageUrl, value.imagem, value.img, value.image) || value.fotos) score += 3;
  if (firstNonEmpty(value.category, value.categories, value.sub, value.catalogTab, value.catalogTabs)) score += 2;
  if (normalizePriceValue(value.price ?? value.preco ?? value.valor)) score += 1;
  return score;
}

export async function resolveFirebaseOrphansToLab() {
  const readiness = getFirebaseReadonlyProbeReadiness();
  if (!readiness.ready) {
    return {
      ok: false,
      imported: false,
      message: 'Config Firebase LAB ainda não está pronta para resolver órfãos.',
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

    const labProducts = getLabProducts();
    const existingIds = new Set(labProducts.map((product) => normalizeId(product.firebaseId || String(product.id).replace(/^firebase-(recovered-)?/, ''))));
    const productIds = new Set(Object.keys(produtosCustom || {}).map(normalizeId));
    const priceIds = unique(Object.keys(precos || {}));
    const carouselIds = extractCarouselIds(carrossel);
    const orphanPriceIds = priceIds.filter((id) => !existingIds.has(id) && !productIds.has(id));
    const carouselMissingIds = carouselIds.filter((id) => !existingIds.has(id) && !productIds.has(id));

    const candidates = [
      ...collectProductCandidates(backupUltimo, 'backup/ultimo'),
      ...collectProductCandidates(backupDiario, 'backup/diario'),
    ];
    const byId = new Map();
    candidates.forEach((candidate) => {
      const current = byId.get(candidate.id);
      if (!current || candidateScore(candidate) > candidateScore(current)) byId.set(candidate.id, candidate);
    });

    const targetIds = unique([...carouselMissingIds, ...orphanPriceIds]);
    const recovered = [];
    const unresolvedCarousel = [];
    const unresolvedPrices = [];

    targetIds.forEach((id) => {
      if (existingIds.has(id)) return;
      const candidate = byId.get(id);
      if (candidate && candidateScore(candidate) >= 4) {
        recovered.push(productFromCandidate(candidate, precos?.[id], labProducts.length + recovered.length + 1));
        existingIds.add(id);
        return;
      }
      if (carouselMissingIds.includes(id)) unresolvedCarousel.push(id);
      if (orphanPriceIds.includes(id)) unresolvedPrices.push(id);
    });

    const nextProducts = [...labProducts, ...recovered];
    replaceLabProducts(nextProducts);

    return {
      ok: true,
      imported: true,
      writeBlocked: true,
      firebaseWriteExecuted: false,
      catalogWriteExecuted: false,
      counts: {
        labBefore: labProducts.length,
        recovered: recovered.length,
        labAfter: nextProducts.length,
        carouselMissingBefore: carouselMissingIds.length,
        carouselUnresolvedAfter: unresolvedCarousel.length,
        orphanPricesBefore: orphanPriceIds.length,
        orphanPricesUnresolvedAfter: unresolvedPrices.length,
        backupCandidates: candidates.length,
      },
      samples: {
        recovered: recovered.slice(0, 20).map((product) => ({
          firebaseId: product.firebaseId,
          name: product.name,
          price: product.price,
          priceSource: product.priceSource,
          importSource: product.importSource,
        })),
        unresolvedCarousel: unresolvedCarousel.slice(0, 30),
        unresolvedPrices: unresolvedPrices.slice(0, 30),
      },
      conclusion: recovered.length
        ? `Foram recuperados ${recovered.length} produto(s) órfão(s) para o LAB.`
        : 'Nenhum órfão tinha dados suficientes no backup para virar produto com segurança.',
      message: 'Resolução de órfãos concluída no LAB. Nenhuma escrita foi feita no Firebase.',
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
      message: 'Resolução de órfãos falhou. Nenhuma escrita foi feita no Firebase.',
    };
  }
}
