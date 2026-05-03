import { getGoogleLoginGateState, markRealDataReadAttempt } from './googleLoginGateService.js';

const FIREBASE_CONFIG = Object.freeze({
  apiKey: 'AIzaSyBhUc-aZq7bTTqXHaCJhOCeKGtlIio1Yns',
  authDomain: 'aulas-ingles-c0c65.firebaseapp.com',
  projectId: 'aulas-ingles-c0c65',
  storageBucket: 'aulas-ingles-c0c65.firebasestorage.app',
  messagingSenderId: '135623744083',
  appId: '1:135623744083:web:e8ad5428c73002a4e044a6',
});

let modulesPromise = null;
let app = null;
let db = null;

async function loadModules() {
  if (!modulesPromise) {
    modulesPromise = Promise.all([
      import('https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js'),
      import('https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js'),
    ]);
  }
  return modulesPromise;
}

async function getFirestoreInstance() {
  const [appModule, firestoreModule] = await loadModules();
  if (!app) {
    app = appModule.getApps().length ? appModule.getApps()[0] : appModule.initializeApp(FIREBASE_CONFIG);
  }
  if (!db) db = firestoreModule.getFirestore(app);
  return { db, firestoreModule };
}

function countArrayOrObject(value) {
  if (Array.isArray(value)) return value.length;
  if (value && typeof value === 'object') return Object.keys(value).length;
  return 0;
}

function summarizeLegacyPayload(data = {}) {
  return {
    products: countArrayOrObject(data.products || data.prices || data.catalogProducts || data.items),
    sales: countArrayOrObject(data.sales || data.sold || data.vendas),
    payments: countArrayOrObject(data.payments || data.pagMeta || data.parcelas),
    clients: countArrayOrObject(data.clients || data.customers || data.compradoras),
    settings: countArrayOrObject(data.settings || data.config || data.preferences),
    keys: Object.keys(data || {}).slice(0, 20),
  };
}

async function tryReadDoc(pathParts, label) {
  const { db, firestoreModule } = await getFirestoreInstance();
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
      count: summary.products + summary.sales + summary.payments + summary.clients,
      summary,
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
    };
  }
}

async function tryReadCollection(pathParts, label) {
  const { db, firestoreModule } = await getFirestoreInstance();
  try {
    const ref = firestoreModule.collection(db, ...pathParts);
    const snap = await firestoreModule.getDocs(firestoreModule.query(ref, firestoreModule.limit(50)));
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
        return acc;
      }, { products: 0, sales: 0, payments: 0, clients: 0 }),
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
