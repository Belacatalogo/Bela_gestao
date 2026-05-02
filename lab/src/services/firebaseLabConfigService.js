const FIREBASE_LAB_CONFIG_KEY = 'bela_gestao_lab_firebase_readonly_config_v1';

const REQUIRED_FIELDS = [
  'apiKey',
  'authDomain',
  'projectId',
  'storageBucket',
  'messagingSenderId',
  'appId',
];

function safeParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function normalizeConfig(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return REQUIRED_FIELDS.reduce((acc, field) => {
    acc[field] = String(value[field] || '').trim();
    return acc;
  }, {});
}

function maskValue(value) {
  const text = String(value || '');
  if (!text) return '';
  if (text.length <= 8) return '***';
  return `${text.slice(0, 4)}…${text.slice(-4)}`;
}

export function parseFirebaseLabConfigText(text) {
  const raw = String(text || '').trim();
  if (!raw) {
    return { ok: false, error: 'Cole a configuração Firebase em JSON antes de salvar.', config: null };
  }

  const json = safeParse(raw);
  if (!json) {
    return { ok: false, error: 'JSON inválido. Confira vírgulas, aspas e chaves.', config: null };
  }

  const config = normalizeConfig(json);
  if (!config) {
    return { ok: false, error: 'Configuração Firebase precisa ser um objeto JSON.', config: null };
  }

  const missingFields = REQUIRED_FIELDS.filter((field) => !config[field]);
  if (missingFields.length) {
    return {
      ok: false,
      error: `Campos ausentes: ${missingFields.join(', ')}.`,
      config,
      missingFields,
    };
  }

  return { ok: true, config, missingFields: [] };
}

export function saveFirebaseLabConfigText(text) {
  const parsed = parseFirebaseLabConfigText(text);
  if (!parsed.ok) return parsed;

  const payload = {
    config: parsed.config,
    savedAt: new Date().toISOString(),
    mode: 'readonly-lab-localStorage',
  };

  localStorage.setItem(FIREBASE_LAB_CONFIG_KEY, JSON.stringify(payload));
  return { ok: true, config: parsed.config, savedAt: payload.savedAt };
}

export function getFirebaseLabConfigPayload() {
  const raw = localStorage.getItem(FIREBASE_LAB_CONFIG_KEY);
  if (!raw) return null;
  const parsed = safeParse(raw);
  if (!parsed?.config) return null;
  return parsed;
}

export function getFirebaseLabConfig() {
  return getFirebaseLabConfigPayload()?.config || null;
}

export function clearFirebaseLabConfig() {
  const hadConfig = Boolean(localStorage.getItem(FIREBASE_LAB_CONFIG_KEY));
  localStorage.removeItem(FIREBASE_LAB_CONFIG_KEY);
  return { ok: true, hadConfig };
}

export function getFirebaseLabConfigSummary() {
  const payload = getFirebaseLabConfigPayload();
  const config = payload?.config || null;
  const presentFields = config ? REQUIRED_FIELDS.filter((field) => Boolean(config[field])) : [];
  const missingFields = REQUIRED_FIELDS.filter((field) => !config?.[field]);

  return {
    storageKey: FIREBASE_LAB_CONFIG_KEY,
    hasConfig: Boolean(config),
    savedAt: payload?.savedAt || '',
    mode: payload?.mode || 'not-configured',
    presentFields,
    missingFields,
    maskedConfig: config ? Object.fromEntries(Object.entries(config).map(([key, value]) => [key, maskValue(value)])) : {},
    warning: 'Config salva apenas no localStorage deste navegador LAB. Não foi enviada ao repositório e não ativa escrita real.',
  };
}
