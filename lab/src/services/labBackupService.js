import { APP_CONFIG } from '../config/appConfig.js';

const LAB_BACKUP_VERSION = 1;
const LAB_PREFIX = 'belaGestaoLab.';

function canUseStorage() {
  try {
    const testKey = 'belaGestaoLab.backupStorageTest';
    window.localStorage.setItem(testKey, '1');
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

function safeParse(value, fallback = null) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

export function getLabStorageKeys() {
  if (!canUseStorage()) return [];
  const rows = [];

  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (!key?.startsWith(LAB_PREFIX)) continue;
    const value = window.localStorage.getItem(key) || '';
    rows.push({
      key,
      size: value.length,
      sizeKb: Math.round((value.length / 1024) * 10) / 10,
    });
  }

  return rows.sort((a, b) => b.size - a.size);
}

export function exportLabBackup() {
  if (!canUseStorage()) {
    return {
      ok: false,
      error: 'localStorage indisponível neste navegador.',
    };
  }

  const data = {};
  getLabStorageKeys().forEach((row) => {
    data[row.key] = safeParse(window.localStorage.getItem(row.key), window.localStorage.getItem(row.key));
  });

  return {
    ok: true,
    backup: {
      type: 'bela-gestao-lab-backup',
      backupVersion: LAB_BACKUP_VERSION,
      appVersion: APP_CONFIG.version,
      branch: APP_CONFIG.branch,
      exportedAt: new Date().toISOString(),
      data,
    },
  };
}

export function downloadLabBackup() {
  const result = exportLabBackup();
  if (!result.ok) return result;

  const text = JSON.stringify(result.backup, null, 2);
  const blob = new Blob([text], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `bela-gestao-lab-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);

  return {
    ok: true,
    backup: result.backup,
  };
}

export function importLabBackupFromText(text) {
  if (!canUseStorage()) {
    return {
      ok: false,
      error: 'localStorage indisponível neste navegador.',
    };
  }

  const backup = safeParse(text);
  if (!backup || backup.type !== 'bela-gestao-lab-backup' || !backup.data || typeof backup.data !== 'object') {
    return {
      ok: false,
      error: 'Arquivo de backup LAB inválido.',
    };
  }

  const keys = Object.keys(backup.data).filter((key) => key.startsWith(LAB_PREFIX));
  keys.forEach((key) => {
    window.localStorage.setItem(key, JSON.stringify(backup.data[key]));
  });

  return {
    ok: true,
    importedKeys: keys,
    backup,
  };
}

export function clearLabStorageByPrefix(prefix = LAB_PREFIX) {
  if (!canUseStorage()) return [];
  const removed = [];
  const keys = [];

  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (key?.startsWith(prefix)) keys.push(key);
  }

  keys.forEach((key) => {
    window.localStorage.removeItem(key);
    removed.push(key);
  });

  return removed;
}
