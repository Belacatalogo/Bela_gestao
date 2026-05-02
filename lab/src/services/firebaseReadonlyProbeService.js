import { getFirebaseLabConfig, getFirebaseLabConfigSummary } from './firebaseLabConfigService.js';

const FIREBASE_APP_CDN = 'https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js';
const FIREBASE_DATABASE_CDN = 'https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js';

const SAFE_PROBE_PATHS = [
  { path: '/', label: 'Raiz do Realtime Database', risk: 'read-only-root' },
  { path: '/backup', label: 'Backup real', risk: 'read-only-summary' },
  { path: '/carrossel', label: 'Carrossel / destaques', risk: 'read-only-summary' },
  { path: '/config', label: 'Configurações reais', risk: 'read-only-summary' },
  { path: '/precos', label: 'Preços reais', risk: 'read-only-summary' },
  { path: '/produtos_custom', label: 'Produtos customizados reais', risk: 'read-only-summary' },
  { path: '/products', label: 'Produtos padrão possível', risk: 'read-only-list' },
  { path: '/catalog', label: 'Catálogo padrão possível', risk: 'read-only-list' },
  { path: '/sales', label: 'Vendas padrão possível', risk: 'read-only-list' },
  { path: '/pagMeta', label: 'Metadados de pagamentos possível', risk: 'read-only-list' },
  { path: '/backups', label: 'Backups automáticos possível', risk: 'read-only-list' },
];

export const REAL_KEY_MAP_PATHS = [
  { path: '/backup', label: 'backup', expectedUse: 'backup automático/manual salvo no Firebase' },
  { path: '/carrossel', label: 'carrossel', expectedUse: 'destaques, banners ou produtos destacados do catálogo' },
  { path: '/config', label: 'config', expectedUse: 'configurações do site/catálogo' },
  { path: '/precos', label: 'precos', expectedUse: 'tabela de preços por produto/chave' },
  { path: '/produtos_custom', label: 'produtos_custom', expectedUse: 'produtos reais/customizados do catálogo' },
];

function safeError(error) {
  return {
    name: error?.name || 'Error',
    code: error?.code || '',
    message: String(error?.message || error || 'Erro desconhecido'),
  };
}

function previewPrimitive(value) {
  if (typeof value === 'string') return value.length > 80 ? `${value.slice(0, 80)}…` : value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (value === null || value === undefined) return '';
  return '';
}

function summarizeChild(key, value) {
  const summary = summarizeSnapshot(value);
  return {
    key,
    type: summary.type,
    exists: summary.exists,
    count: summary.count,
    keys: summary.keys.slice(0, 10),
    preview: previewPrimitive(value),
  };
}

function summarizeSnapshot(value) {
  if (value === null || value === undefined) {
    return { exists: false, type: 'empty', keys: [], count: 0, children: [] };
  }
  if (Array.isArray(value)) {
    const children = value
      .map((item, index) => (item === undefined || item === null ? null : summarizeChild(String(index), item)))
      .filter(Boolean)
      .slice(0, 20);
    return { exists: true, type: 'array', keys: [], count: value.filter(Boolean).length, children };
  }
  if (typeof value === 'object') {
    const keys = Object.keys(value).slice(0, 20);
    const children = keys.map((key) => summarizeChild(key, value[key]));
    return { exists: true, type: 'object', keys, count: Object.keys(value).length, children };
  }
  return { exists: true, type: typeof value, keys: [], count: 1, children: [] };
}

function classifyRealKey(path, summary) {
  const normalizedPath = String(path || '').replace(/^\//, '');
  const childKeys = (summary.children || []).flatMap((child) => [child.key, ...child.keys]).join(' ').toLowerCase();
  const ownKeys = (summary.keys || []).join(' ').toLowerCase();
  const text = `${normalizedPath} ${ownKeys} ${childKeys}`;

  if (normalizedPath === 'produtos_custom' || /produto|product|nome|marca|foto|image|categoria|category/.test(text)) {
    return 'provável fonte de produtos/catálogo';
  }
  if (normalizedPath === 'precos' || /preco|price|valor|custo/.test(text)) {
    return 'provável tabela de preços';
  }
  if (normalizedPath === 'carrossel' || /banner|slide|destaque|carrossel|carousel/.test(text)) {
    return 'provável carrossel/destaques do catálogo';
  }
  if (normalizedPath === 'config' || /tema|config|whatsapp|loja|nome|cor|layout/.test(text)) {
    return 'prováveis configurações do site';
  }
  if (normalizedPath === 'backup' || /backup|export|version|schema|created|data/.test(text)) {
    return 'provável backup salvo no Firebase';
  }
  return 'uso ainda indefinido';
}

function isObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value);
}

function collectFieldNames(rows) {
  const fields = new Set();
  rows.forEach((row) => {
    if (!isObject(row.value)) return;
    Object.keys(row.value).forEach((field) => fields.add(field));
  });
  return Array.from(fields).sort();
}

function extractDisplayName(product) {
  if (!isObject(product)) return '';
  return product.nome || product.name || product.titulo || product.title || product.produto || product.label || '';
}

function extractImageField(product) {
  if (!isObject(product)) return '';
  return product.foto || product.imageUrl || product.imagem || product.img || product.url || product.image || '';
}

function normalizePriceValue(value) {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const normalized = value.replace(/R\$\s?/i, '').replace(/\./g, '').replace(',', '.').trim();
    const number = Number(normalized);
    return Number.isFinite(number) ? number : null;
  }
  if (isObject(value)) {
    return normalizePriceValue(value.preco ?? value.price ?? value.valor ?? value.value);
  }
  return null;
}

function mapObjectRows(value) {
  if (!isObject(value)) return [];
  return Object.entries(value).map(([id, item]) => ({ id, value: item }));
}

function buildProductsPricesPreview(productsValue, pricesValue) {
  const productRows = mapObjectRows(productsValue);
  const priceRows = mapObjectRows(pricesValue);
  const priceMap = new Map(priceRows.map((row) => [String(row.id), row.value]));
  const productIds = new Set(productRows.map((row) => String(row.id)));
  const priceIds = new Set(priceRows.map((row) => String(row.id)));

  const matchedIds = productRows.filter((row) => priceIds.has(String(row.id))).map((row) => String(row.id));
  const productsWithoutPrice = productRows.filter((row) => !priceIds.has(String(row.id))).map((row) => String(row.id));
  const pricesWithoutProduct = priceRows.filter((row) => !productIds.has(String(row.id))).map((row) => String(row.id));

  const sampleProducts = productRows.slice(0, 12).map((row) => {
    const priceRaw = priceMap.get(String(row.id));
    return {
      id: String(row.id),
      name: extractDisplayName(row.value),
      hasImage: Boolean(extractImageField(row.value)),
      productFields: isObject(row.value) ? Object.keys(row.value).slice(0, 12) : [],
      price: normalizePriceValue(priceRaw),
      priceType: Array.isArray(priceRaw) ? 'array' : typeof priceRaw,
      priceFields: isObject(priceRaw) ? Object.keys(priceRaw).slice(0, 10) : [],
    };
  });

  return {
    ok: true,
    imported: false,
    writeBlocked: true,
    productCount: productRows.length,
    priceCount: priceRows.length,
    matchedCount: matchedIds.length,
    productsWithoutPrice: productsWithoutPrice.slice(0, 20),
    pricesWithoutProduct: pricesWithoutProduct.slice(0, 20),
    productFields: collectFieldNames(productRows),
    priceFields: collectFieldNames(priceRows),
    sampleProducts,
    message: 'Preview de produtos e preços reais concluído em READ-ONLY. Nada foi importado para o LAB.',
  };
}

export function getFirebaseReadonlyProbeReadiness() {
  const config = getFirebaseLabConfig();
  const summary = getFirebaseLabConfigSummary();
  const hasDatabaseUrl = Boolean(config?.databaseURL);

  return {
    ready: Boolean(summary.hasConfig && summary.missingFields.length === 0 && hasDatabaseUrl),
    hasConfig: summary.hasConfig,
    missingFields: summary.missingFields,
    hasDatabaseUrl,
    sdkMode: 'dynamic-import-cdn',
    appCdn: FIREBASE_APP_CDN,
    databaseCdn: FIREBASE_DATABASE_CDN,
    safeProbePaths: SAFE_PROBE_PATHS,
    realKeyMapPaths: REAL_KEY_MAP_PATHS,
    writeBlocked: true,
    loginRequiredNow: false,
    note: hasDatabaseUrl
      ? 'Config tem databaseURL. O próximo passo pode testar leitura do Realtime Database sem escrita.'
      : 'Config não tem databaseURL; para probe do Realtime Database é necessário databaseURL.',
  };
}

async function getRealtimeDatabaseHelpers(config) {
  const [{ initializeApp, getApps }, { getDatabase, ref, get }] = await Promise.all([
    import(FIREBASE_APP_CDN),
    import(FIREBASE_DATABASE_CDN),
  ]);

  const app = getApps().find((item) => item.name === 'bela-gestao-lab-readonly')
    || initializeApp(config, 'bela-gestao-lab-readonly');
  const database = getDatabase(app);
  return { database, ref, get };
}

async function readPath(path) {
  const config = getFirebaseLabConfig();
  const { database, ref, get } = await getRealtimeDatabaseHelpers(config);
  const snapshot = await get(ref(database, path));
  return snapshot.val();
}

export async function runFirebaseReadonlyProbe(path = '/') {
  const readiness = getFirebaseReadonlyProbeReadiness();

  if (!readiness.ready) {
    return {
      ok: false,
      blocked: true,
      stage: 'readiness',
      message: 'Config Firebase LAB ainda não está pronta para probe READ-ONLY.',
      readiness,
    };
  }

  try {
    const value = await readPath(path);
    const summary = summarizeSnapshot(value);

    return {
      ok: true,
      blocked: false,
      writeBlocked: true,
      path,
      summary,
      classification: classifyRealKey(path, summary),
      message: 'Probe READ-ONLY concluído. Nenhuma escrita foi executada.',
    };
  } catch (error) {
    return {
      ok: false,
      blocked: false,
      writeBlocked: true,
      path,
      error: safeError(error),
      message: 'Probe READ-ONLY falhou. Isso pode ser regra do Firebase, falta de permissão, databaseURL errado ou bloqueio de rede.',
    };
  }
}

export async function runFirebaseRealKeysMapProbe() {
  const readiness = getFirebaseReadonlyProbeReadiness();
  if (!readiness.ready) {
    return {
      ok: false,
      blocked: true,
      stage: 'readiness',
      message: 'Config Firebase LAB ainda não está pronta para mapear chaves reais.',
      readiness,
      rows: [],
    };
  }

  const rows = [];
  for (const item of REAL_KEY_MAP_PATHS) {
    const result = await runFirebaseReadonlyProbe(item.path);
    rows.push({
      ...item,
      ok: result.ok,
      error: result.error || null,
      summary: result.summary || null,
      classification: result.classification || 'não classificado',
      message: result.message,
    });
  }

  return {
    ok: rows.some((row) => row.ok),
    blocked: false,
    writeBlocked: true,
    rows,
    message: 'Mapa de chaves reais concluído em modo READ-ONLY. Nenhuma escrita foi executada.',
  };
}

export async function runFirebaseProductsPricesPreview() {
  const readiness = getFirebaseReadonlyProbeReadiness();
  if (!readiness.ready) {
    return {
      ok: false,
      blocked: true,
      stage: 'readiness',
      message: 'Config Firebase LAB ainda não está pronta para preview de produtos/preços.',
      readiness,
    };
  }

  try {
    const [productsValue, pricesValue] = await Promise.all([
      readPath('/produtos_custom'),
      readPath('/precos'),
    ]);

    return buildProductsPricesPreview(productsValue, pricesValue);
  } catch (error) {
    return {
      ok: false,
      blocked: false,
      writeBlocked: true,
      imported: false,
      error: safeError(error),
      message: 'Preview READ-ONLY de produtos/preços falhou. Nenhuma escrita foi feita.',
    };
  }
}
