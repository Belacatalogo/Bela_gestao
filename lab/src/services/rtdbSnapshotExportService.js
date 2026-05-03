import { getFirebaseLabConfig } from './firebaseLabConfigService.js';
import { getGoogleLoginGateState, markRealDataReadAttempt } from './googleLoginGateService.js';

const FIREBASE_APP_NAME = 'bela-gestao-lab-real';
const EXPORT_TIMEOUT_MS = 15000;

let modulesPromise = null;
let app = null;
let rtdb = null;
let firebaseProjectId = '';

async function loadModules() {
  if (!modulesPromise) {
    modulesPromise = Promise.all([
      import('https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js'),
      import('https://www.gstatic.com/firebasejs/10.12.4/firebase-database.js'),
    ]);
  }
  return modulesPromise;
}

function getRequiredConfig() {
  const config = getFirebaseLabConfig();
  if (!config?.apiKey || !config?.authDomain || !config?.projectId || !config?.appId || !config?.databaseURL) {
    throw new Error('Config Firebase LAB incompleta. Para exportar o RTDB, a config precisa incluir databaseURL.');
  }
  return config;
}

function getNamedApp(appModule, config) {
  const existing = appModule.getApps().find((item) => item.name === FIREBASE_APP_NAME);
  if (existing) return existing;
  return appModule.initializeApp(config, FIREBASE_APP_NAME);
}

async function getRtdbInstance() {
  const [appModule, databaseModule] = await loadModules();
  const config = getRequiredConfig();

  if (!app || firebaseProjectId !== config.projectId) {
    app = getNamedApp(appModule, config);
    rtdb = null;
    firebaseProjectId = config.projectId;
  }

  if (!rtdb) rtdb = databaseModule.getDatabase(app);
  return { rtdb, databaseModule, projectId: config.projectId, databaseURL: config.databaseURL };
}

function withTimeout(promise, timeoutMs = EXPORT_TIMEOUT_MS) {
  return Promise.race([
    promise,
    new Promise((_, reject) => window.setTimeout(() => reject(new Error(`Tempo esgotado em ${timeoutMs / 1000}s ao ler RTDB.`)), timeoutMs)),
  ]);
}

function isObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value);
}

function countArrayOrObject(value) {
  if (Array.isArray(value)) return value.length;
  if (isObject(value)) return Object.keys(value).length;
  return 0;
}

function normalizeClientName(value) {
  return String(value || '').trim().replace(/\s+/g, ' ').toLowerCase();
}

function getStringField(object, fields) {
  if (!isObject(object)) return '';
  for (const field of fields) {
    const value = object[field];
    if (value !== undefined && value !== null && String(value).trim()) return String(value).trim();
  }
  return '';
}

function extractClientName(record) {
  if (!isObject(record)) return '';

  const direct = getStringField(record, [
    'clientName', 'clienteNome', 'nomeCliente', 'buyerName', 'compradoraNome',
    'cliente', 'compradora', 'buyer', 'customer', 'customerName', 'nomeClienteVenda',
  ]);
  if (direct && !['pago', 'pendente', 'entregue', 'cancelado'].includes(normalizeClientName(direct))) return direct;

  const nested = record.cliente || record.client || record.customer || record.compradora || record.buyer;
  if (isObject(nested)) return getStringField(nested, ['nome', 'name', 'displayName', 'cliente', 'compradora']);
  return '';
}

function extractClientNames(value) {
  const names = [];

  function walk(node, level = 0) {
    if (level > 5 || node === null || node === undefined) return;
    if (Array.isArray(node)) {
      node.slice(0, 1200).forEach((item) => walk(item, level + 1));
      return;
    }
    if (!isObject(node)) return;

    const name = extractClientName(node);
    if (name) names.push(name);

    Object.entries(node).slice(0, 1500).forEach(([key, child]) => {
      const lower = key.toLowerCase();
      const shouldDive = lower.includes('venda') || lower.includes('sale') || lower.includes('pedido')
        || lower.includes('pagamento') || lower.includes('payment') || lower.includes('parcela')
        || lower.includes('cliente') || lower.includes('compradora') || lower.includes('buyer')
        || lower.includes('customer') || level < 2;
      if (shouldDive && (Array.isArray(child) || isObject(child))) walk(child, level + 1);
    });
  }

  walk(value);
  return [...new Set(names.map(normalizeClientName).filter((name) => name.length >= 2))];
}

function summarizeRtdbSnapshot(data = {}) {
  const products = countArrayOrObject(data.produtos_custom || data.produtos || data.products || data.items || data.catalogProducts);
  const sales = countArrayOrObject(data.vendas || data.sales || data.orders || data.pedidos);
  const payments = countArrayOrObject(data.pagamentos || data.payments || data.parcelas || data.installments || data.pagMeta);
  const separatedClients = countArrayOrObject(data.clientes || data.clients || data.customers || data.compradoras || data.buyers);
  const clientNames = extractClientNames({ vendas: data.vendas || data.sales || data.orders || {}, pagamentos: data.pagamentos || data.payments || data.parcelas || {} });

  return {
    products,
    sales,
    payments,
    separatedClients,
    derivedClients: clientNames.length,
    clients: Math.max(separatedClients, clientNames.length),
    clientSamples: clientNames.slice(0, 12),
    rootKeys: Object.keys(data || {}).slice(0, 60),
  };
}

function downloadJson(filename, payload) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 500);
}

function buildFilename(projectId) {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  return `bela-gestao-rtdb-snapshot-${projectId || 'firebase'}-${stamp}.json`;
}

export async function exportRtdbSnapshotJson() {
  const state = getGoogleLoginGateState();
  if (!state.isSignedIn || !state.uid) {
    return {
      ok: false,
      locked: true,
      message: 'Faça login Google antes de exportar o snapshot RTDB.',
    };
  }

  markRealDataReadAttempt();

  try {
    const { rtdb, databaseModule, projectId, databaseURL } = await getRtdbInstance();
    const ref = databaseModule.ref(rtdb, '/');
    const snap = await withTimeout(databaseModule.get(ref));

    if (!snap.exists()) {
      return { ok: false, message: 'RTDB raiz não retornou dados para exportar.' };
    }

    const data = snap.val();
    const summary = summarizeRtdbSnapshot(data);
    const filename = buildFilename(projectId);
    const payload = {
      meta: {
        app: 'Bela Gestão LAB',
        mode: 'readonly-rtdb-local-json-export',
        exportedAt: new Date().toISOString(),
        source: 'rtdb:/',
        projectId,
        databaseURL,
        firebaseWriteExecuted: false,
        labImportExecuted: false,
        user: {
          uid: state.uid,
          email: state.email,
          displayName: state.displayName,
        },
      },
      summary,
      data,
    };

    downloadJson(filename, payload);

    return {
      ok: true,
      filename,
      summary,
      message: `Snapshot RTDB exportado como ${filename}. Nenhuma escrita foi feita no Firebase.`,
    };
  } catch (error) {
    return {
      ok: false,
      message: error?.message || 'Erro ao exportar snapshot RTDB.',
    };
  }
}
