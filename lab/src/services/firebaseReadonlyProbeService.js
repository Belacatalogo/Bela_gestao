import { getFirebaseLabConfig, getFirebaseLabConfigSummary } from './firebaseLabConfigService.js';

const FIREBASE_APP_CDN = 'https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js';
const FIREBASE_DATABASE_CDN = 'https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js';

const SAFE_PROBE_PATHS = [
  { path: '/', label: 'Raiz do Realtime Database', risk: 'read-only-root' },
  { path: '/products', label: 'Produtos', risk: 'read-only-list' },
  { path: '/catalog', label: 'Catálogo', risk: 'read-only-list' },
  { path: '/sales', label: 'Vendas', risk: 'read-only-list' },
  { path: '/pagMeta', label: 'Metadados de pagamentos', risk: 'read-only-list' },
  { path: '/backups', label: 'Backups automáticos', risk: 'read-only-list' },
];

function safeError(error) {
  return {
    name: error?.name || 'Error',
    code: error?.code || '',
    message: String(error?.message || error || 'Erro desconhecido'),
  };
}

function summarizeSnapshot(value) {
  if (value === null || value === undefined) {
    return { exists: false, type: 'empty', keys: [], count: 0 };
  }
  if (Array.isArray(value)) {
    return { exists: true, type: 'array', keys: [], count: value.filter(Boolean).length };
  }
  if (typeof value === 'object') {
    const keys = Object.keys(value).slice(0, 20);
    return { exists: true, type: 'object', keys, count: Object.keys(value).length };
  }
  return { exists: true, type: typeof value, keys: [], count: 1 };
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
    writeBlocked: true,
    loginRequiredNow: false,
    note: hasDatabaseUrl
      ? 'Config tem databaseURL. O próximo passo pode testar leitura do Realtime Database sem escrita.'
      : 'Config não tem databaseURL; para probe do Realtime Database é necessário databaseURL.',
  };
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
    const [{ initializeApp, getApps }, { getDatabase, ref, get }] = await Promise.all([
      import(FIREBASE_APP_CDN),
      import(FIREBASE_DATABASE_CDN),
    ]);

    const app = getApps().find((item) => item.name === 'bela-gestao-lab-readonly')
      || initializeApp(config, 'bela-gestao-lab-readonly');
    const database = getDatabase(app);
    const snapshot = await get(ref(database, path));
    const value = snapshot.val();

    return {
      ok: true,
      blocked: false,
      writeBlocked: true,
      path,
      summary: summarizeSnapshot(value),
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
