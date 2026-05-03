const SETTINGS_KEY = 'belaGestaoLab.settings.v1';
const GEMINI_KEY = 'belaGestaoLab.geminiKey.v1';
const CAROUSEL_KEY = 'belaGestaoLab.carousel.v1';

function safeParse(value, fallback = null) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function canUseStorage() {
  try {
    const key = 'belaGestaoLab.settingsStorageTest';
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

export function getLabSettings() {
  if (!canUseStorage()) return defaultSettings();
  return {
    ...defaultSettings(),
    ...(safeParse(window.localStorage.getItem(SETTINGS_KEY), {}) || {}),
  };
}

export function saveLabSettings(nextSettings = {}) {
  if (!canUseStorage()) return { ok: false, error: 'localStorage indisponível.' };
  const settings = {
    ...getLabSettings(),
    ...nextSettings,
    updatedAt: new Date().toISOString(),
  };
  window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  return { ok: true, settings };
}

function defaultSettings() {
  return {
    showCatalogPrices: true,
    catalogSyncMode: 'lab-only',
    lastPriceSyncAt: '',
  };
}

export function getGeminiLabKeyInfo() {
  if (!canUseStorage()) return { configured: false, masked: '', savedAt: '' };
  const stored = safeParse(window.localStorage.getItem(GEMINI_KEY), {}) || {};
  const key = normalizeText(stored.key);
  return {
    configured: Boolean(key),
    masked: key ? `${key.slice(0, 6)}••••••••••••${key.slice(-4)}` : '',
    savedAt: stored.savedAt || '',
  };
}

export function saveGeminiLabKey(key) {
  if (!canUseStorage()) return { ok: false, error: 'localStorage indisponível.' };
  const cleanKey = normalizeText(key);
  if (!cleanKey) return { ok: false, error: 'Informe a chave Gemini antes de salvar.' };
  window.localStorage.setItem(GEMINI_KEY, JSON.stringify({ key: cleanKey, savedAt: new Date().toISOString() }));
  return { ok: true, keyInfo: getGeminiLabKeyInfo() };
}

export function clearGeminiLabKey() {
  if (!canUseStorage()) return false;
  window.localStorage.removeItem(GEMINI_KEY);
  return true;
}

export function testGeminiLabKey() {
  const info = getGeminiLabKeyInfo();
  if (!info.configured) {
    return { ok: false, message: 'Chave Gemini não configurada.' };
  }
  return { ok: true, message: 'Chave Gemini salva localmente. Teste real fica bloqueado até a etapa de integração segura.' };
}

export function getCarouselSelection() {
  if (!canUseStorage()) return [];
  const stored = safeParse(window.localStorage.getItem(CAROUSEL_KEY), []);
  return Array.isArray(stored) ? stored : [];
}

export function saveCarouselSelection(productIds = []) {
  if (!canUseStorage()) return { ok: false, error: 'localStorage indisponível.' };
  const unique = [...new Set(productIds.filter(Boolean))].slice(0, 8);
  window.localStorage.setItem(CAROUSEL_KEY, JSON.stringify(unique));
  return { ok: true, productIds: unique };
}

export function clearCarouselSelection() {
  return saveCarouselSelection([]);
}

export function toggleCarouselProduct(productId) {
  const current = getCarouselSelection();
  const exists = current.includes(productId);
  const next = exists ? current.filter((id) => id !== productId) : [...current, productId];
  return saveCarouselSelection(next);
}

export function simulatePriceSync(products = []) {
  const visibleProducts = products.filter((product) => product.visibleInCatalog);
  saveLabSettings({ lastPriceSyncAt: new Date().toISOString() });
  return {
    ok: true,
    mode: 'lab-only',
    syncedProducts: visibleProducts.length,
    message: `Simulação LAB: ${visibleProducts.length} preço(s) seriam sincronizados com o catálogo. Nenhum catálogo real foi alterado.`,
  };
}
