const GOOGLE_GATE_KEY = 'belaGestaoLab.googleLoginGate.v1';

function safeParse(value, fallback = null) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function canUseStorage() {
  try {
    const key = 'belaGestaoLab.googleGateStorageTest';
    window.localStorage.setItem(key, '1');
    window.localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

function normalizeText(value) {
  return String(value || '').trim();
}

export function getGoogleLoginGateState() {
  if (!canUseStorage()) return defaultState();
  const stored = safeParse(window.localStorage.getItem(GOOGLE_GATE_KEY), {}) || {};
  return {
    ...defaultState(),
    ...stored,
    isSignedIn: Boolean(stored.isSignedIn && stored.email),
  };
}

function defaultState() {
  return {
    isSignedIn: false,
    email: '',
    displayName: '',
    photoURL: '',
    uid: '',
    readMode: true,
    realDataUnlocked: false,
    signedInAt: '',
    lastReadAt: '',
  };
}

export function saveGoogleLoginGateUser(user = {}) {
  if (!canUseStorage()) return { ok: false, error: 'localStorage indisponível.' };
  const email = normalizeText(user.email);
  const state = {
    isSignedIn: Boolean(email),
    email,
    displayName: normalizeText(user.displayName),
    photoURL: normalizeText(user.photoURL),
    uid: normalizeText(user.uid),
    readMode: true,
    realDataUnlocked: Boolean(email),
    signedInAt: new Date().toISOString(),
    lastReadAt: '',
  };
  window.localStorage.setItem(GOOGLE_GATE_KEY, JSON.stringify(state));
  return { ok: true, state };
}

export function clearGoogleLoginGateUser() {
  if (!canUseStorage()) return false;
  window.localStorage.removeItem(GOOGLE_GATE_KEY);
  return true;
}

export function canShowRealWifeData() {
  const state = getGoogleLoginGateState();
  return Boolean(state.isSignedIn && state.realDataUnlocked && state.email);
}

export function markRealDataReadAttempt() {
  if (!canUseStorage()) return getGoogleLoginGateState();
  const state = {
    ...getGoogleLoginGateState(),
    lastReadAt: new Date().toISOString(),
  };
  window.localStorage.setItem(GOOGLE_GATE_KEY, JSON.stringify(state));
  return state;
}
