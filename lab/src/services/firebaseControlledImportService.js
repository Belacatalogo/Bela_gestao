import { replaceLabProducts } from './labDataService.js';
import { runFirebaseReadonlyProbe } from './firebaseReadonlyProbeService.js';

const PLACEHOLDER_IMAGE = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1100" viewBox="0 0 900 1100"><rect width="900" height="1100" fill="%23080808"/><rect x="34" y="34" width="832" height="1032" rx="70" fill="none" stroke="%23c9a84c" stroke-width="8" opacity="0.55"/><text x="450" y="500" text-anchor="middle" font-family="Georgia,serif" font-size="92" fill="%23f0e8dc">Bela</text><text x="450" y="590" text-anchor="middle" font-family="Arial,sans-serif" font-size="30" letter-spacing="12" fill="%23c9a84c">FIREBASE LAB</text><text x="450" y="650" text-anchor="middle" font-family="Arial,sans-serif" font-size="22" fill="%238f877b">sem foto detectada</text></svg>';

function isObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value);
}

function normalizeText(value) {
  return String(value ?? '').trim();
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

function normalizeTabs(product) {
  const raw = product.catalogTabs ?? product.catalogTab ?? product.categories ?? product.category ?? product.sub ?? [];
  const values = Array.isArray(raw) ? raw : String(raw || '').split(/[;,]/g);
  const tabs = values.map((item) => normalizeText(item).toLowerCase()).filter(Boolean);
  return Array.from(new Set(['todos', ...tabs]));
}

function normalizeCategory(product) {
  const value = firstNonEmpty(product.category, Array.isArray(product.categories) ? product.categories[0] : product.categories, product.sub, 'firebase');
  return normalizeText(value).toLowerCase() || 'firebase';
}

function normalizeImage(product) {
  const direct = firstNonEmpty(product.foto, product.imageUrl, product.imagem, product.img, product.url, product.image);
  if (direct) return direct;
  if (Array.isArray(product.fotos) && product.fotos.length) return firstNonEmpty(...product.fotos);
  if (isObject(product.fotos)) return firstNonEmpty(...Object.values(product.fotos));
  return PLACEHOLDER_IMAGE;
}

function normalizeProductEntry([firebaseId, product], prices, index) {
  const source = isObject(product) ? product : {};
  const explicitPrice = normalizePriceValue(source.price ?? source.preco ?? source.valor);
  const fallbackPrice = normalizePriceValue(prices?.[firebaseId]);
  const price = explicitPrice || fallbackPrice;
  const now = new Date().toISOString();

  return {
    id: `firebase-${firebaseId}`,
    firebaseId: String(firebaseId),
    name: normalizeText(firstNonEmpty(source.name, source.nome, source.titulo, source.title, `Produto Firebase ${firebaseId}`)),
    brand: normalizeText(firstNonEmpty(source.brand, source.marca, 'Firebase')),
    description: normalizeText(firstNonEmpty(source.description, source.descricao, source.desc, 'Produto importado em modo LAB a partir do Firebase READ-ONLY.')),
    price,
    cost: normalizePriceValue(source.cost ?? source.custo),
    imageUrl: normalizeImage(source),
    category: normalizeCategory(source),
    catalogTabs: normalizeTabs(source),
    visibleInCatalog: source.visibleInCatalog ?? source.publicado ?? source.visible ?? true,
    badge: normalizeText(firstNonEmpty(source.badge, source.tag, source.selo, 'Firebase')),
    stock: Math.max(0, Number(source.stock ?? source.estoque ?? 0)),
    order: Number(source.order ?? source.ordem ?? index + 1),
    createdAt: normalizeText(source.createdAt) || now,
    updatedAt: now,
    source: 'firebase-readonly-import-lab',
    importedFromFirebase: true,
    priceSource: explicitPrice ? 'product.price' : (fallbackPrice ? '/precos fallback' : 'missing'),
    originalFields: Object.keys(source),
  };
}

async function readRawValue(path) {
  const result = await runFirebaseReadonlyProbe(path);
  if (!result.ok) throw new Error(result.error?.message || result.message || `Falha ao ler ${path}`);
  // runFirebaseReadonlyProbe intentionally returns summary only. For controlled import we use SDK through a hidden raw reader.
  return null;
}

async function readRealtimePath(path) {
  const { getFirebaseLabConfig } = await import('./firebaseLabConfigService.js');
  const config = getFirebaseLabConfig();
  const [{ initializeApp, getApps }, { getDatabase, ref, get }] = await Promise.all([
    import('https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js'),
    import('https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js'),
  ]);
  const app = getApps().find((item) => item.name === 'bela-gestao-lab-readonly')
    || initializeApp(config, 'bela-gestao-lab-readonly');
  const database = getDatabase(app);
  const snapshot = await get(ref(database, path));
  return snapshot.val();
}

export async function importFirebaseProductsToLabControlled() {
  const [productsValue, pricesValue] = await Promise.all([
    readRealtimePath('/produtos_custom'),
    readRealtimePath('/precos'),
  ]);

  if (!isObject(productsValue)) {
    return {
      ok: false,
      imported: false,
      writeBlocked: true,
      message: '/produtos_custom não retornou objeto válido para importação LAB.',
    };
  }

  const rows = Object.entries(productsValue);
  const products = rows.map((entry, index) => normalizeProductEntry(entry, pricesValue || {}, index));
  const saved = replaceLabProducts(products);
  const withPrice = saved.filter((product) => Number(product.price || 0) > 0).length;
  const withImage = saved.filter((product) => !String(product.imageUrl || '').startsWith('data:image/svg+xml')).length;
  const fallbackPrices = saved.filter((product) => product.priceSource === '/precos fallback').length;
  const missingPrices = saved.filter((product) => product.priceSource === 'missing').length;

  return {
    ok: true,
    imported: true,
    writeBlocked: true,
    firebaseWriteExecuted: false,
    catalogWriteExecuted: false,
    productCount: saved.length,
    withPrice,
    withImage,
    fallbackPrices,
    missingPrices,
    sample: saved.slice(0, 8).map((product) => ({
      id: product.id,
      firebaseId: product.firebaseId,
      name: product.name,
      price: product.price,
      priceSource: product.priceSource,
      image: product.imageUrl ? 'sim' : 'não',
      category: product.category,
    })),
    message: 'Produtos Firebase importados para o LAB localStorage. Nenhuma escrita foi feita no Firebase.',
  };
}
