import { saveGoogleLoginGateUser } from './googleLoginGateService.js';

const FIREBASE_CONFIG = Object.freeze({
  apiKey: 'AIzaSyBhUc-aZq7bTTqXHaCJhOCeKGtlIio1Yns',
  authDomain: 'aulas-ingles-c0c65.firebaseapp.com',
  projectId: 'aulas-ingles-c0c65',
  storageBucket: 'aulas-ingles-c0c65.firebasestorage.app',
  messagingSenderId: '135623744083',
  appId: '1:135623744083:web:e8ad5428c73002a4e044a6',
});

let firebaseModulesPromise = null;
let firebaseApp = null;
let firebaseAuth = null;

async function loadFirebaseModules() {
  if (!firebaseModulesPromise) {
    firebaseModulesPromise = Promise.all([
      import('https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js'),
      import('https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js'),
    ]);
  }
  return firebaseModulesPromise;
}

async function getAuthInstance() {
  const [appModule, authModule] = await loadFirebaseModules();

  if (!firebaseApp) {
    firebaseApp = appModule.getApps().length
      ? appModule.getApps()[0]
      : appModule.initializeApp(FIREBASE_CONFIG);
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
  const { auth, authModule } = await getAuthInstance();
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
  const { auth, authModule } = await getAuthInstance();
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
