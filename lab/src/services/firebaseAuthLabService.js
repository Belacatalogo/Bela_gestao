import { getFirebaseLabConfig } from './firebaseLabConfigService.js';
import { saveGoogleLoginGateUser } from './googleLoginGateService.js';

const FIREBASE_APP_NAME = 'bela-gestao-lab-real';

let firebaseModulesPromise = null;
let firebaseApp = null;
let firebaseAuth = null;
let firebaseProjectId = '';

async function loadFirebaseModules() {
  if (!firebaseModulesPromise) {
    firebaseModulesPromise = Promise.all([
      import('https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js'),
      import('https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js'),
    ]);
  }
  return firebaseModulesPromise;
}

function getRequiredConfig() {
  const config = getFirebaseLabConfig();
  if (!config?.apiKey || !config?.authDomain || !config?.projectId || !config?.appId) {
    throw new Error('Config Firebase LAB ausente ou incompleta. Cole a configuração do Firebase do Bela Gestão antes de fazer login Google.');
  }
  return config;
}

function getNamedApp(appModule, config) {
  const existing = appModule.getApps().find((item) => item.name === FIREBASE_APP_NAME);
  if (existing) return existing;
  return appModule.initializeApp(config, FIREBASE_APP_NAME);
}

async function getAuthInstance() {
  const [appModule, authModule] = await loadFirebaseModules();
  const config = getRequiredConfig();

  if (!firebaseApp || firebaseProjectId !== config.projectId) {
    firebaseApp = getNamedApp(appModule, config);
    firebaseAuth = null;
    firebaseProjectId = config.projectId;
  }

  if (!firebaseAuth) {
    firebaseAuth = authModule.getAuth(firebaseApp);
  }

  return { auth: firebaseAuth, authModule };
}

function normalizeFirebaseUser(user) {
  if (!user) return null;
  return {
    uid: user.uid || '',
    email: user.email || '',
    displayName: user.displayName || '',
    photoURL: user.photoURL || '',
  };
}

export async function signInWithGoogleLab() {
  let auth;
  let authModule;
  try {
    ({ auth, authModule } = await getAuthInstance());
  } catch (error) {
    return { ok: false, error: error?.message || 'Config Firebase LAB inválida.' };
  }

  const provider = new authModule.GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });

  try {
    const credential = await authModule.signInWithPopup(auth, provider);
    const user = normalizeFirebaseUser(credential.user);
    const saved = saveGoogleLoginGateUser(user);
    return { ok: true, user, state: saved.state };
  } catch (error) {
    if (error?.code === 'auth/popup-blocked' || error?.code === 'auth/operation-not-supported-in-this-environment') {
      await authModule.signInWithRedirect(auth, provider);
      return { ok: true, redirectStarted: true };
    }
    return { ok: false, error: error?.message || 'Falha ao entrar com Google.' };
  }
}

export async function resolveGoogleRedirectLab() {
  let auth;
  let authModule;
  try {
    ({ auth, authModule } = await getAuthInstance());
  } catch (error) {
    return { ok: false, error: error?.message || 'Config Firebase LAB inválida.' };
  }

  try {
    const credential = await authModule.getRedirectResult(auth);
    if (!credential?.user) return { ok: true, user: null };
    const user = normalizeFirebaseUser(credential.user);
    const saved = saveGoogleLoginGateUser(user);
    return { ok: true, user, state: saved.state };
  } catch (error) {
    return { ok: false, error: error?.message || 'Falha ao concluir login Google.' };
  }
}

export async function signOutGoogleLab() {
  const { auth, authModule } = await getAuthInstance();
  await authModule.signOut(auth);
  return { ok: true };
}
