import { getFirebaseLabConfig } from './firebaseLabConfigService.js';
import { getGoogleLoginGateState, markRealDataReadAttempt } from './googleLoginGateService.js';

const FIREBASE_APP_NAME = 'bela-gestao-lab-real';
const MAX_COLLECTION_DOCS = 50;
const MAX_BACKUP_DOCS = 80;

const AUTO_BACKUP_CANDIDATES = Object.freeze([
  { label: 'Backup latest por UID', kind: 'doc', path: ['users', '$uid', 'backup', 'latest'] },
  { label: 'Backup latest usuarios', kind: 'doc', path: ['usuarios', '$uid', 'backup', 'latest'] },
  { label: 'Backup automático por UID', kind: 'doc', path: ['backups', '$uid'] },
  { label: 'Backup automático por email', kind: 'doc', path: ['backups', '$emailKey'] },
  { label: 'Último backup global', kind: 'doc', path: ['backup', 'ultimo'] },
  { label: 'Último backup global alternativo', kind: 'doc', path: ['backup', 'latest'] },
  { label: 'Backup diário raiz', kind: 'collection', path: ['backup_diario'] },
  { label: 'Backups diários raiz', kind: 'collection', path: ['dailyBackups'] },
  { label: 'Backups por usuário', kind: 'collection', path: ['users', '$uid', 'backups'] },
  { label: 'Backups usuarios por usuário', kind: 'collection', path: ['usuarios', '$uid', 'backups'] },
  { label: 'Backups automáticos por usuário', kind: 'collection', path: ['users', '$uid', 'autoBackups'] },
  { label: 'Backups automáticos usuarios', kind: 'collection', path: ['usuarios', '$uid', 'autoBackups'] },
  { label: 'Bela Gestão backups', kind: 'collection', path: ['belaGestao', '$uid', 'backups'] },
  { label: 'Bela Gestão auto backup', kind: 'doc', path: ['belaGestao', '$uid', 'autoBackup', 'latest'] },
  { label: 'Gestão Yasmin backup', kind: 'doc', path: ['gestao', 'yasmin', 'backup', 'latest'] },
]);

let modulesPromise = null;
let app = null;
let db = null;
let firebaseProjectId = '';

async function loadModules() {
  if (!modulesPromise) {
    modulesPromise = Promise.all([
      import('https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js'),
      import('https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js'),
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

async function getFirestoreInstance() {
  const [appModule, firestoreModule] = await loadModules();
  const config = getRequiredConfig();
  if (!app || firebaseProjectId !== config.projectId) {
    app = getNamedApp(appModule, config);
    db = null;
    firebaseProjectId = config.projectId;
  }
  if (!db) db = firestoreModule.getFirestore(app);
  return { db, firestoreModule, projectId: config.projectId };
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

function looksLikeProduct(value = {}) {
  if (!isObject(value)) return false;
  const keys = Object.keys(value).map((key) => key.toLowerCase());
  return keys.some((key) => ['name', 'nome', 'titulo', 'title', 'brand', 'marca', 'categoria', 'category', 'price', 'preco', 'valor', 'imageurl', 'imagem', 'foto'].includes(key));
}

function looksLikeSale(value = {}) {
  if (!isObject(value)) return false;
  const keys = Object.keys(value).map((key) => key.toLowerCase());
  return keys.some((key) => ['clientname', 'cliente', 'compradora', 'buyer', 'productid', 'produto', 'status', 'parcelas', 'installments', 'data', 'date'].includes(key));
}

function summarizeDeepPayload(value, depth = 0) {
  const summary = {
    products: 0,
    sales: 0,
    payments: 0,
    clients: 0,
    settings: 0,
    backups: 0,
    keys: [],
    candidatePaths: [],
  };

  function add(other) {
    summary.products += other.products || 0;
    summary.sales += other.sales || 0;
    summary.payments += other.payments || 0;
    summary.clients += other.clients || 0;
    summary.settings += other.settings || 0;
    summary.backups += other.backups || 0;
    summary.keys.push(...(other.keys || []));
    summary.candidatePaths.push(...(other.candidatePaths || []));
  }

  function walk(node, path, level) {
    if (level > 4 || node === null || node === undefined) return;
    if (Array.isArray(node)) {
      if (node.some(looksLikeProduct)) summary.products += node.length;
      if (node.some(looksLikeSale)) summary.sales += node.length;
      node.slice(0, 25).forEach((item, index) => walk(item, `${path}[${index}]`, level + 1));
      return;
    }
    if (!isObject(node)) return;

    const keys = Object.keys(node);
    summary.keys.push(...keys.slice(0, 30));

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
        summary.candidatePaths.push({ type: 'sales', path: childPath, count: childCount });
      } else if (['payments', 'pagamentos', 'parcelas', 'installments', 'pagmeta', 'precos', 'prices'].includes(lower)) {
        summary.payments += childCount;
        summary.candidatePaths.push({ type: 'payments', path: childPath, count: childCount });
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
  summary.keys = unique(summary.keys).slice(0, 40);
  summary.candidatePaths = summary.candidatePaths.slice(0, 40);
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
  const deep = summarizeDeepPayload(data);
  return {
    products: Math.max(direct.products, deep.products),
    sales: Math.max(direct.sales, deep.sales),
    payments: Math.max(direct.payments, deep.payments),
    clients: Math.max(direct.clients, deep.clients),
    settings: Math.max(direct.settings, deep.settings),
    backups: deep.backups,
    keys: unique([...direct.keys, ...deep.keys]).slice(0, 40),
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

async function tryReadDoc(pathParts, label) {
  const { db, firestoreModule, projectId } = await getFirestoreInstance();
  try {
    const ref = firestoreModule.doc(db, ...pathParts);
    const snap = await firestoreModule.getDoc(ref);
    if (!snap.exists()) {
      return {
        label,
        type: 'doc',
        path: pathParts.join('/'),
        ok: true,
        exists: false,
        count: 0,
        summary: null,
        projectId,
      };
    }
    const data = snap.data();
    const summary = summarizeLegacyPayload(data);
    return {
      label,
      type: 'doc',
      path: pathParts.join('/'),
      ok: true,
      exists: true,
      count: summary.products + summary.sales + summary.payments + summary.clients + summary.backups,
      summary,
      projectId,
    };
  } catch (error) {
    return {
      label,
      type: 'doc',
      path: pathParts.join('/'),
      ok: false,
      exists: false,
      count: 0,
      error: error?.message || 'Erro ao ler documento.',
      projectId,
    };
  }
}

async function tryReadCollection(pathParts, label, limitSize = MAX_COLLECTION_DOCS) {
  const { db, firestoreModule, projectId } = await getFirestoreInstance();
  try {
    const ref = firestoreModule.collection(db, ...pathParts);
    const snap = await firestoreModule.getDocs(firestoreModule.query(ref, firestoreModule.limit(limitSize)));
    const docs = snap.docs.map((docSnap) => ({ id: docSnap.id, data: docSnap.data() }));
    return {
      label,
      type: 'collection',
      path: pathParts.join('/'),
      ok: true,
      exists: docs.length > 0,
      count: docs.length,
      sampleIds: docs.slice(0, 8).map((item) => item.id),
      summary: docs.reduce((acc, item) => {
        const summary = summarizeLegacyPayload(item.data);
        acc.products += summary.products;
        acc.sales += summary.sales;
        acc.payments += summary.payments;
        acc.clients += summary.clients;
        acc.settings += summary.settings;
        acc.backups += summary.backups;
        acc.keys.push(...summary.keys);
        acc.candidatePaths.push(...summary.candidatePaths.map((candidate) => ({ ...candidate, path: `${item.id}.${candidate.path}` })));
        return acc;
      }, { products: 0, sales: 0, payments: 0, clients: 0, settings: 0, backups: 0, keys: [], candidatePaths: [] }),
      projectId,
    };
  } catch (error) {
    return {
      label,
      type: 'collection',
      path: pathParts.join('/'),
      ok: false,
      exists: false,
      count: 0,
      error: error?.message || 'Erro ao ler coleção.',
      projectId,
    };
  }
}

function buildCandidateReads(state) {
  const uid = state.uid;
  const emailKey = String(state.email || '').replaceAll('.', '_');

  return [
    () => tryReadDoc(['users', uid], 'Documento do usuário por UID'),
    () => tryReadDoc(['usuarios', uid], 'Documento usuarios por UID'),
    () => tryReadDoc(['users', uid, 'backup', 'latest'], 'Backup latest por UID'),
    () => tryReadDoc(['usuarios', uid, 'backup', 'latest'], 'Backup latest usuarios'),
    () => tryReadCollection(['users', uid, 'products'], 'Produtos por UID'),
    () => tryReadCollection(['users', uid, 'sales'], 'Vendas por UID'),
    () => tryReadCollection(['users', uid, 'payments'], 'Pagamentos por UID'),
    () => tryReadCollection(['users', uid, 'clients'], 'Clientes por UID'),
    () => tryReadDoc(['belaGestao', uid], 'belaGestao por UID'),
    () => tryReadDoc(['bela_gestao', uid], 'bela_gestao por UID'),
    () => tryReadDoc(['backups', uid], 'Backup por UID'),
    () => tryReadDoc(['backups', emailKey], 'Backup por email'),
    () => tryReadDoc(['gestao', 'yasmin'], 'Gestão Yasmin'),
    () => tryReadDoc(['catalogo', 'bela'], 'Catálogo Bela'),
  ].filter(Boolean);
}

function scoreBackupCandidate(item) {
  if (!item?.ok || !item.exists) return 0;
  const summary = item.summary || {};
  let score = 0;
  score += Number(summary.products || 0) * 4;
  score += Number(summary.sales || 0) * 4;
  score += Number(summary.payments || 0) * 3;
  score += Number(summary.clients || 0) * 3;
  score += Number(summary.backups || 0) * 2;
  score += (summary.candidatePaths?.length || 0) * 2;
  if (String(item.path || '').toLowerCase().includes('backup')) score += 12;
  if (String(item.label || '').toLowerCase().includes('backup')) score += 8;
  return score;
}

export async function discoverFirebaseAutoBackupsAfterLogin() {
  const state = getGoogleLoginGateState();
  if (!state.isSignedIn || !state.uid) {
    return {
      ok: false,
      locked: true,
      message: 'Faça login Google na conta da esposa antes de descobrir backups automáticos.',
      state,
    };
  }

  markRealDataReadAttempt();

  const results = [];
  for (const candidate of AUTO_BACKUP_CANDIDATES) {
    const resolvedPath = resolvePath(candidate.path, state);
    if (candidate.kind === 'collection') {
      results.push(await tryReadCollection(resolvedPath, candidate.label, MAX_BACKUP_DOCS));
    } else {
      results.push(await tryReadDoc(resolvedPath, candidate.label));
    }
  }

  const found = results
    .filter((item) => item.ok && item.exists)
    .map((item) => ({ ...item, backupScore: scoreBackupCandidate(item) }))
    .sort((a, b) => b.backupScore - a.backupScore);

  const best = found[0] || null;
  const totals = found.reduce((acc, item) => {
    const summary = item.summary || {};
    acc.products += Number(summary.products || 0);
    acc.sales += Number(summary.sales || 0);
    acc.payments += Number(summary.payments || 0);
    acc.clients += Number(summary.clients || 0);
    acc.settings += Number(summary.settings || 0);
    acc.backups += Number(summary.backups || 0);
    acc.documents += item.type === 'doc' ? 1 : 0;
    acc.collections += item.type === 'collection' ? 1 : 0;
    return acc;
  }, { products: 0, sales: 0, payments: 0, clients: 0, settings: 0, backups: 0, documents: 0, collections: 0 });

  return {
    ok: true,
    locked: false,
    user: {
      uid: state.uid,
      email: state.email,
      displayName: state.displayName,
    },
    projectId: results.find((item) => item.projectId)?.projectId || '',
    totals,
    best,
    found,
    checked: results,
    message: best
      ? `Backup automático provável encontrado em ${best.path}. Nenhum dado foi alterado.`
      : 'Login confirmado, mas nenhum caminho provável de backup automático retornou dados. Veja o diagnóstico de caminhos.',
  };
}

export async function readRealDataPreviewAfterLogin() {
  const state = getGoogleLoginGateState();
  if (!state.isSignedIn || !state.uid) {
    return {
      ok: false,
      locked: true,
      message: 'Faça login Google na conta da esposa antes de ler dados reais.',
      state,
    };
  }

  markRealDataReadAttempt();

  const reads = buildCandidateReads(state);
  const results = [];

  for (const read of reads) {
    // leitura sequencial para facilitar diagnóstico e evitar rajada no Firebase
    results.push(await read());
  }

  const found = results.filter((item) => item.ok && item.exists);
  const blocked = results.filter((item) => !item.ok);
  const totals = found.reduce((acc, item) => {
    const summary = item.summary || {};
    acc.products += Number(summary.products || 0);
    acc.sales += Number(summary.sales || 0);
    acc.payments += Number(summary.payments || 0);
    acc.clients += Number(summary.clients || 0);
    acc.documents += item.type === 'doc' ? 1 : 0;
    acc.collections += item.type === 'collection' ? 1 : 0;
    return acc;
  }, { products: 0, sales: 0, payments: 0, clients: 0, documents: 0, collections: 0 });

  return {
    ok: true,
    locked: false,
    user: {
      uid: state.uid,
      email: state.email,
      displayName: state.displayName,
    },
    totals,
    found,
    blocked,
    checked: results,
    message: found.length
      ? 'Prévia real carregada em modo leitura. Nenhum dado foi alterado.'
      : 'Login confirmado, mas nenhum caminho conhecido retornou dados. Veja o diagnóstico de caminhos.',
  };
}
