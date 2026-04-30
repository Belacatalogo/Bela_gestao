const DATA_MODE_KEY = 'belaGestaoLab.dataMode.v1';

export const DATA_MODES = Object.freeze({
  LAB: 'lab',
  REAL_READONLY: 'real-readonly',
});

export function getCurrentDataMode() {
  try {
    const saved = window.localStorage.getItem(DATA_MODE_KEY);
    if (saved === DATA_MODES.REAL_READONLY) return DATA_MODES.REAL_READONLY;
    return DATA_MODES.LAB;
  } catch {
    return DATA_MODES.LAB;
  }
}

export function setCurrentDataMode(mode) {
  const safeMode = mode === DATA_MODES.REAL_READONLY ? DATA_MODES.REAL_READONLY : DATA_MODES.LAB;

  try {
    window.localStorage.setItem(DATA_MODE_KEY, safeMode);
  } catch {
    // Mantém fallback em LAB se o navegador bloquear armazenamento.
  }

  return safeMode;
}

export function getEnvironmentStatus() {
  const mode = getCurrentDataMode();
  const isLab = mode === DATA_MODES.LAB;

  return {
    mode,
    label: isLab ? 'LAB visitante' : 'REAL somente leitura',
    canWriteRealData: false,
    canReadRealData: mode === DATA_MODES.REAL_READONLY,
    usesFirebase: mode === DATA_MODES.REAL_READONLY,
    usesGoogleLogin: false,
    affectsRealCatalog: false,
    warning: isLab
      ? 'Dados fictícios salvos apenas neste navegador.'
      : 'Modo real ainda bloqueado para escrita. Nenhum dado real será alterado.',
  };
}
