import { getFirebaseLabConfig } from './firebaseLabConfigService.js';
import { getGoogleLoginGateState, markRealDataReadAttempt } from './googleLoginGateService.js';

const FIREBASE_APP_NAME = 'bela-gestao-lab-real';
const MAX_COLLECTION_DOCS = 20;
const MAX_BACKUP_DOCS = 25;
const READ_TIMEOUT_MS = 4500;

const FIRESTORE_AUTO_BACKUP_CANDIDATES = Object.freeze([
  { label: 'Firestore backup latest por UID', kind: 'doc', path: ['users', '$uid', 'backup', 'latest'] },
  { label: 'Firestore backup latest usuarios', kind: 'doc', path: ['usuarios', '$uid', 'backup', 'latest'] },
  { label: 'Firestore backup automático por UID', kind: 'doc', path: ['backups', '$uid'] },
  { label: 'Firestore backup automático por email', kind: 'doc', path: ['backups', '$emailKey'] },
  { label: 'Firestore último backup global', kind: 'doc', path: ['backup', 'ultimo'] },
  { label: 'Firestore último backup global alternativo', kind: 'doc', path: ['backup', 'latest'] },
  { label: 'Firestore backup diário raiz', kind: 'collection', path: ['backup_diario'] },
  { label: 'Firestore backups diários raiz', kind: 'collection', path: ['dailyBackups'] },
  { label: 'Firestore backups por usuário', kind: 'collection', path: ['users', '$uid', 'backups'] },
  { label: 'Firestore backups automáticos por usuário', kind: 'collection', path: ['users', '$uid', 'autoBackups'] },
  { label: 'Firestore Bela Gestão backups', kind: 'collection', path: ['belaGestao', '$uid', 'backups'] },
  { label: 'Firestore Gestão Yasmin backup', kind: 'doc', path: ['gestao', 'yasmin', 'backup', 'latest'] },
]);

const RTDB_AUTO_BACKUP_CANDIDATES = Object.freeze([
  { label: 'RTDB raiz', path: [] },
  { label: 'RTDB backup último', path: ['backup', 'ultimo'] },
  { label: 'RTDB backup latest', path: ['backup', 'latest'] },
  { label: 'RTDB backups por UID', path: ['backups', '$uid'] },
  { label: 'RTDB backups por email', path: ['backups', '$emailKey'] },
  { label: 'RTDB backup diário', path: ['backup_diario'] },
  { label: 'RTDB dailyBackups', path: ['dailyBackups'] },
  { label: 'RTDB usuários UID', path: ['users', '$uid'] },
  { label: 'RTDB usuários backup latest', path: ['users', '$uid', 'backup', 'latest'] },
  { label: 'RTDB usuários autoBackups', path: ['users', '$uid', 'autoBackups'] },
  { label: 'RTDB usuarios UID', path: ['usuarios', '$uid'] },
  { label: 'RTDB gestão yasmin', path: ['gestao', 'yasmin'] },
  { label: 'RTDB produtos custom', path: ['produtos_custom'] },
  { label: 'RTDB produtos', path: ['produtos'] },
  { label: 'RTDB preços', path: ['precos'] },
  { label: 'RTDB vendas', path: ['vendas'] },
  { label: 'RTDB clientes', path: ['clientes'] },
  { label: 'RTDB pagamentos', path: ['pagamentos'] },
]);

let modulesPromise = null;
let app = null;
let db = null;
let rtdb = null;
let firebaseProjectId = '';

async function loadModules() {
  if (!modulesPromise) {
    modulesPromise = Promise.all([
      import('https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js'),
      import('https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js'),
      import('https://www.gstatic.com/firebasejs/10.12.4/firebase-database.js'),
    ]);
  }
  return modulesPromise;
}

function getRequiredConfig() {
  const config = getFirebaseLabConfig();
  if (!config?.apiKey || !config?.authDomain || !config?.projectId || !config?.appId) {
    throw new Error('Config Firebase LAB ausente ou incompleta. Cole a configuração do Firebase do Bela Gestão antes de ler dados reais.');
  }
  return config;
}

function getNamedApp(appModule, config) {
  const existing = appModule.getApps().find((item) => item.name === FIREBASE_APP_NAME);
  if (existing) return existing;
  return appModule.initializeApp(config, FIREBASE_APP_NAME);
}

async function getFirebaseInstances() {
  const [appModule, firestoreModule, databaseModule] = await loadModules();
  const config = getRequiredConfig();
  if (!app || firebaseProjectId !== config.projectId) {
    app = getNamedApp(appModule, config);
    db = null;
    rtdb = null;
    firebaseProjectId = config.projectId;
  }
  if (!db) db = firestoreModule.getFirestore(app);
  if (!rtdb && config.databaseURL) rtdb = databaseModule.getDatabase(app);
  return { db, rtdb, firestoreModule, databaseModule, projectId: config.projectId, hasDatabaseURL: Boolean(config.databaseURL) };
}

function withTimeout(promise, label, timeoutMs = READ_TIMEOUT_MS) {
  return Promise.race([
    promise,
    new Promise((resolve) => window.setTimeout(() => resolve({ ok: false, exists: false, timedOut: true, label, error: `Tempo esgotado em ${timeoutMs / 1000}s.` }), timeoutMs)),
  ]);
}

function countArrayOrObject(value) {
  if (Array.isArray(value)) return value.length;
  if (value && typeof value === 'object') return Object.keys(value).length;
  return 0;
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function isObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value);
}

function valuesOfCollectionLike(value) {
  if (Array.isArray(value)) return value;
  if (isObject(value)) return Object.values(value);
  return [];
}

function normalizeClientName(value) {
  return String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

function getStringField(object, fields) {
  if (!isObject(object)) return '';
  for (const field of fields) {
    if (object[field] !== undefined && object[field] !== null && String(object[field]).trim()) return String(object[field]).trim();
  }
  return '';
}

function extractClientName(record) {
  if (!isObject(record)) return '';
  const direct = getStringField(record, [
    'clientName', 'clienteNome', 'nomeCliente', 'buyerName', 'compradoraNome',
    'cliente', 'compradora', 'buyer', 'customer', 'customerName', 'nome', 'name',
  ]);
  if (direct && !['pago', 'pendente', 'entregue', 'cancelado'].includes(normalizeClientName(direct))) return direct;

  const nestedClient = record.cliente || record.client || record.customer || record.compradora || record.buyer;
  if (isObject(nestedClient)) {
    return getStringField(nestedClient, ['nome', 'name', 'displayName', 'cliente', 'compradora']);
  }
  return '';
}

function extractClientNamesFromValue(value) {
  const names = [];
  function walk(node, level = 0) {
    if (level > 5 || node === null || node === undefined) return;
    if (Array.isArray(node)) {
      node.slice(0, 800).forEach((item) => walk(item, level + 1));
      return;
    }
    if (!isObject(node)) return;

    const name = extractClientName(node);
    if (name) names.push(name);

    Object.entries(node).slice(0, 1200).forEach(([key, child]) => {
      const lower = key.toLowerCase();
      if (
        lower.includes('venda') || lower.includes('sale') || lower.includes('pedido') ||
        lower.includes('pagamento') || lower.includes('payment') || lower.includes('parcela') ||
        lower.includes('cliente') || lower.includes('compradora') || lower.includes('buyer') ||
        lower.includes('customer')
      ) {
        walk(child, level + 1);
      } else if (level < 2 && (Array.isArray(child) || isObject(child))) {
        walk(child, level + 1);
      }
    });
  }
  walk(value);
  return unique(names.map(normalizeClientName)).filter((name) => name.length >= 2);
}

function looksLikeProduct(value = {}) {
  if (!isObject(value)) return false;
  const keys = Object.keys(value).map((key) => key.toLowerCase());
  return keys.some((key) => ['name', 'nome', 'titulo', 'title', 'brand', 'marca', 'categoria', 'category', 'price', 'preco', 'valor', 'imageurl', 'imagem', 'foto'].includes(key));
}

function looksLikeSale(value = {}) {
  if (!isObject(value)) return false;
  const keys = Object.keys(value).map((key) => key.toLowerCase());
  return keys.some((key) => ['clientname', 'clientenome', 'nomecliente', 'cliente', 'compradora', 'buyer', 'customer', 'productid', 'produto', 'status', 'parcelas', 'installments', 'data', 'date'].includes(key));
}

function summarizeDeepPayload(value, depth = 0) {
  const summary = { products: 0, sales: 0, payments: 0, clients: 0, derivedClients: 0, settings: 0, backups: 0, keys: [], clientSamples: [], candidatePaths: [] };
  const derivedClientNames = [];

  function walk(node, path, level) {
    if (level > 4 || node === null || node === undefined) return;
    if (Array.isArray(node)) {
      if (node.some(looksLikeProduct)) summary.products += node.length;
      if (node.some(looksLikeSale)) summary.sales += node.length;
      derivedClientNames.push(...extractClientNamesFromValue(node));
      node.slice(0, 25).forEach((item, index) => walk(item, `${path}[${index}]`, level + 1));
      return;
    }
    if (!isObject(node)) return;

    const keys = Object.keys(node);
    summary.keys.push(...keys.slice(0, 30));
    derivedClientNames.push(...extractClientNamesFromValue(node));

    keys.forEach((key) => {
      const lower = key.toLowerCase();
      const child = node[key];
      const childCount = countArrayOrObject(child);
      const childPath = path ? `${path}.${key}` : key;

      if (['products', 'produtos', 'produtos_custom', 'catalogproducts', 'items', 'catalogo'].includes(lower)) {
        summary.products += childCount;
        summary.candidatePaths.push({ type: 'products', path: childPath, count: childCount });
      } else if (['sales', 'vendas', 'sold', 'orders', 'pedidos'].includes(lower)) {
        summary.sales += childCount;
        const childClients = extractClientNamesFromValue(child);
        derivedClientNames.push(...childClients);
        summary.candidatePaths.push({ type: 'sales', path: childPath, count: childCount });
        if (childClients.length) summary.candidatePaths.push({ type: 'derivedClients', path: childPath, count: childClients.length });
      } else if (['payments', 'pagamentos', 'parcelas', 'installments', 'pagmeta', 'precos', 'prices'].includes(lower)) {
        summary.payments += childCount;
        const childClients = extractClientNamesFromValue(child);
        derivedClientNames.push(...childClients);
        summary.candidatePaths.push({ type: 'payments', path: childPath, count: childCount });
        if (childClients.length) summary.candidatePaths.push({ type: 'derivedClients', path: childPath, count: childClients.length });
      } else if (['clients', 'clientes', 'customers', 'compradoras', 'buyers'].includes(lower)) {
        summary.clients += childCount;
        summary.candidatePaths.push({ type: 'clients', path: childPath, count: childCount });
      } else if (['settings', 'config', 'preferences'].includes(lower)) {
        summary.settings += childCount;
        summary.candidatePaths.push({ type: 'settings', path: childPath, count: childCount });
      } else if (lower.includes('backup')) {
        summary.backups += childCount || 1;
        summary.candidatePaths.push({ type: 'backup', path: childPath, count: childCount || 1 });
      }

      if (isObject(child) || Array.isArray(child)) walk(child, childPath, level + 1);
    });
  }

  walk(value, '', depth);
  const uniqueDerivedClients = unique(derivedClientNames).filter(Boolean);
  summary.derivedClients = uniqueDerivedClients.length;
  summary.clients = Math.max(summary.clients, summary.derivedClients);
  summary.clientSamples = uniqueDerivedClients.slice(0, 12);
  summary.keys = unique(summary.keys).slice(0, 40);
  summary.candidatePaths = summary.candidatePaths.slice(0, 50);
  return summary;
}

function summarizeLegacyPayload(data = {}) {
  const direct = {
    products: countArrayOrObject(data.products || data.prices || data.precos || data.produtos || data.produtos_custom || data.catalogProducts || data.items),
    sales: countArrayOrObject(data.sales || data.sold || data.vendas || data.orders || data.pedidos),
    payments: countArrayOrObject(data.payments || data.pagamentos || data.pagMeta || data.parcelas || data.installments),
    clients: countArrayOrObject(data.clients || data.clientes || data.customers || data.compradoras || data.buyers),
    settings: countArrayOrObject(data.settings || data.config || data.preferences),
    keys: Object.keys(data || {}).slice(0, 40),
  };
  const directClientNames = extractClientNamesFromValue(data);
  const deep = summarizeDeepPayload(data);
  const derivedClients = unique([...directClientNames, ...(deep.clientSamples || [])]).length;
  return {
    products: Math.max(direct.products, deep.products),
    sales: Math.max(direct.sales, deep.sales),
    payments: Math.max(direct.payments, deep.payments),
    clients: Math.max(direct.clients, deep.clients, derivedClients),
    derivedClients: Math.max(deep.derivedClients || 0, derivedClients),
    settings: Math.max(direct.settings, deep.settings),
    backups: deep.backups,
    keys: unique([...direct.keys, ...deep.keys]).slice(0, 40),
    clientSamples: unique([...(deep.clientSamples || []), ...directClientNames]).slice(0, 12),
    candidatePaths: deep.candidatePaths,
  };
}

function resolvePath(pathParts, state) {
  const emailKey = String(state.email || '').replaceAll('.', '_');
  return pathParts.map((part) => {
    if (part === '$uid') return state.uid;
    if (part === '$email') return state.email;
    if (part === '$emailKey') return emailKey;
    return part;
  }).filter(Boolean);
}

function scoreBackupCandidate(item) {
  if (!item?.ok || !item.exists) return 0;
  const summary = item.summary || {};
  let score = 0;
  score += Number(summary.products || 0) * 4;
  score += Number(summary.sales || 0) * 4;
  score += Number(summary.payments || 0) * 3;
  score += Number(summary.clients || 0) * 3;
  score += Number(summary.derivedClients || 0) * 2;
  score += Number(summary.backups || 0) * 2;
  score += (summary.candidatePaths?.length || 0) * 2;
  if (String(item.path || '').toLowerCase().includes('backup')) score += 12;
  if (String(item.label || '').toLowerCase().includes('backup')) score += 8;
  if (String(item.type || '').includes('rtdb')) score += 20;
  return score;
}

async function tryReadDoc(pathParts, label) {
  const { db, firestoreModule, projectId } = await getFirebaseInstances();
  const path = pathParts.join('/');
  return withTimeout((async () => {
    try {
      const ref = firestoreModule.doc(db, ...pathParts);
      const snap = await firestoreModule.getDoc(ref);
      if (!snap.exists()) return { label, type: 'firestore-doc', path, ok: true, exists: false, count: 0, summary: null, projectId };
      const summary = summarizeLegacyPayload(snap.data());
      return { label, type: 'firestore-doc', path, ok: true, exists: true, count: summary.products + summary.sales + summary.payments + summary.clients + summary.backups, summary, projectId };
    } catch (error) {
      return { label, type: 'firestore-doc', path, ok: false, exists: false, count: 0, error: error?.message || 'Erro ao ler documento.', projectId };
    }
  })(), label);
}

async function tryReadCollection(pathParts, label, limitSize = MAX_COLLECTION_DOCS) {
  const { db, firestoreModule, projectId } = await getFirebaseInstances();
  const path = pathParts.join('/');
  return withTimeout((async () => {
    try {
      const ref = firestoreModule.collection(db, ...pathParts);
      const snap = await firestoreModule.getDocs(firestoreModule.query(ref, firestoreModule.limit(limitSize)));
      const docs = snap.docs.map((docSnap) => ({ id: docSnap.id, data: docSnap.data() }));
      const summary = docs.reduce((acc, item) => {
        const itemSummary = summarizeLegacyPayload(item.data);
        acc.products += itemSummary.products;
        acc.sales += itemSummary.sales;
        acc.payments += itemSummary.payments;
        acc.clients += itemSummary.clients;
        acc.derivedClients += itemSummary.derivedClients || 0;
        acc.settings += itemSummary.settings;
        acc.backups += itemSummary.backups;
        acc.keys.push(...itemSummary.keys);
        acc.clientSamples.push(...(itemSummary.clientSamples || []));
        acc.candidatePaths.push(...itemSummary.candidatePaths.map((candidate) => ({ ...candidate, path: `${item.id}.${candidate.path}` })));
        return acc;
      }, { products: 0, sales: 0, payments: 0, clients: 0, derivedClients: 0, settings: 0, backups: 0, keys: [], clientSamples: [], candidatePaths: [] });
      summary.clientSamples = unique(summary.clientSamples).slice(0, 12);
      return { label, type: 'firestore-collection', path, ok: true, exists: docs.length > 0, count: docs.length, sampleIds: docs.slice(0, 8).map((item) => item.id), summary, projectId };
    } catch (error) {
      return { label, type: 'firestore-collection', path, ok: false, exists: false, count: 0, error: error?.message || 'Erro ao ler coleção.', projectId };
    }
  })(), label);
}

async function tryReadRtdb(pathParts, label) {
  const { rtdb, databaseModule, projectId, hasDatabaseURL } = await getFirebaseInstances();
  const path = pathParts.join('/');
  if (!hasDatabaseURL || !rtdb) return { label, type: 'rtdb', path: path || '/', ok: false, exists: false, count: 0, error: 'databaseURL ausente na config Firebase.', projectId };
  return withTimeout((async () => {
    try {
      const ref = databaseModule.ref(rtdb, path || '/');
      const snap = await databaseModule.get(ref);
      if (!snap.exists()) return { label, type: 'rtdb', path: path || '/', ok: true, exists: false, count: 0, summary: null, projectId };
      const data = snap.val();
      const summary = summarizeLegacyPayload(data);
      return { label, type: 'rtdb', path: path || '/', ok: true, exists: true, count: countArrayOrObject(data), summary, projectId };
    } catch (error) {
      return { label, type: 'rtdb', path: path || '/', ok: false, exists: false, count: 0, error: error?.message || 'Erro ao ler Realtime Database.', projectId };
    }
  })(), label);
}

function buildCandidateReads(state) {
  const uid = state.uid;
  const emailKey = String(state.email || '').replaceAll('.', '_');
  return [
    () => tryReadRtdb([], 'RTDB raiz'),
    () => tryReadRtdb(['produtos_custom'], 'RTDB produtos_custom'),
    () => tryReadRtdb(['precos'], 'RTDB preços'),
    () => tryReadRtdb(['vendas'], 'RTDB vendas'),
    () => tryReadRtdb(['clientes'], 'RTDB clientes'),
    () => tryReadDoc(['users', uid], 'Firestore usuário por UID'),
    () => tryReadDoc(['backups', uid], 'Firestore backup por UID'),
    () => tryReadDoc(['backups', emailKey], 'Firestore backup por email'),
  ].filter(Boolean);
}

export async function discoverFirebaseAutoBackupsAfterLogin() {
  const state = getGoogleLoginGateState();
  if (!state.isSignedIn || !state.uid) return { ok: false, locked: true, message: 'Faça login Google na conta da esposa antes de descobrir backups automáticos.', state };

  markRealDataReadAttempt();

  const results = [];
  const rtdbCandidates = RTDB_AUTO_BACKUP_CANDIDATES.map((candidate) => ({ ...candidate, resolvedPath: resolvePath(candidate.path, state) }));
  const firestoreCandidates = FIRESTORE_AUTO_BACKUP_CANDIDATES.map((candidate) => ({ ...candidate, resolvedPath: resolvePath(candidate.path, state) }));

  for (const candidate of rtdbCandidates) {
    const result = await tryReadRtdb(candidate.resolvedPath, candidate.label);
    results.push(result);
    if (scoreBackupCandidate(result) >= 20 && (result.summary?.products || result.summary?.sales || result.summary?.clients || result.summary?.payments)) break;
  }

  for (const candidate of firestoreCandidates.slice(0, 6)) {
    const result = candidate.kind === 'collection'
      ? await tryReadCollection(candidate.resolvedPath, candidate.label, MAX_BACKUP_DOCS)
      : await tryReadDoc(candidate.resolvedPath, candidate.label);
    results.push(result);
  }

  const found = results.filter((item) => item.ok && item.exists).map((item) => ({ ...item, backupScore: scoreBackupCandidate(item) })).sort((a, b) => b.backupScore - a.backupScore);
  const best = found[0] || null;
  const totals = found.reduce((acc, item) => {
    const summary = item.summary || {};
    acc.products += Number(summary.products || 0);
    acc.sales += Number(summary.sales || 0);
    acc.payments += Number(summary.payments || 0);
    acc.clients += Number(summary.clients || 0);
    acc.derivedClients += Number(summary.derivedClients || 0);
    acc.settings += Number(summary.settings || 0);
    acc.backups += Number(summary.backups || 0);
    acc.documents += item.type?.includes('doc') ? 1 : 0;
    acc.collections += item.type?.includes('collection') ? 1 : 0;
    acc.rtdb += item.type === 'rtdb' ? 1 : 0;
    return acc;
  }, { products: 0, sales: 0, payments: 0, clients: 0, derivedClients: 0, settings: 0, backups: 0, documents: 0, collections: 0, rtdb: 0 });

  return {
    ok: true,
    locked: false,
    user: { uid: state.uid, email: state.email, displayName: state.displayName },
    projectId: results.find((item) => item.projectId)?.projectId || '',
    totals,
    best,
    found,
    checked: results,
    message: best ? `Fonte provável encontrada em ${best.type}:${best.path}. Nenhum dado foi alterado.` : 'Login confirmado, mas nenhum caminho provável retornou dados. Veja o diagnóstico de caminhos.',
  };
}

export async function readRealDataPreviewAfterLogin() {
  const state = getGoogleLoginGateState();
  if (!state.isSignedIn || !state.uid) return { ok: false, locked: true, message: 'Faça login Google na conta da esposa antes de ler dados reais.', state };

  markRealDataReadAttempt();
  const results = [];
  for (const read of buildCandidateReads(state)) results.push(await read());

  const found = results.filter((item) => item.ok && item.exists);
  const blocked = results.filter((item) => !item.ok);
  const totals = found.reduce((acc, item) => {
    const summary = item.summary || {};
    acc.products += Number(summary.products || 0);
    acc.sales += Number(summary.sales || 0);
    acc.payments += Number(summary.payments || 0);
    acc.clients += Number(summary.clients || 0);
    acc.derivedClients += Number(summary.derivedClients || 0);
    acc.documents += item.type?.includes('doc') ? 1 : 0;
    acc.collections += item.type?.includes('collection') ? 1 : 0;
    acc.rtdb += item.type === 'rtdb' ? 1 : 0;
    return acc;
  }, { products: 0, sales: 0, payments: 0, clients: 0, derivedClients: 0, documents: 0, collections: 0, rtdb: 0 });

  return {
    ok: true,
    locked: false,
    user: { uid: state.uid, email: state.email, displayName: state.displayName },
    totals,
    found,
    blocked,
    checked: results,
    message: found.length ? 'Prévia real carregada em modo leitura. Nenhum dado foi alterado.' : 'Login confirmado, mas nenhum caminho conhecido retornou dados. Veja o diagnóstico de caminhos.',
  };
}
