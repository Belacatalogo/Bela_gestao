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

export async function runFirebaseReadonlyProbe(path = '/') {
  const config = getFirebaseLabConfig();
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
    const { database, ref, get } = await getRealtimeDatabaseHelpers(config);
    const snapshot = await get(ref(database, path));
    const value = snapshot.val();
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
