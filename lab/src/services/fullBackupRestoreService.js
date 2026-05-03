import { getLabProducts, replaceLabProducts } from './labDataService.js';
import { getConsolidatedRealData } from './realDataConsolidatorService.js';

const FULL_BACKUP_SCHEMA = 'bela-gestao-lab-full-backup';
const FULL_BACKUP_SCHEMA_VERSION = 1;
const CONSOLIDATED_DATA_KEY = 'belaGestaoLab.consolidatedData.v1';
const RESTORE_META_KEY = 'belaGestaoLab.fullRestore.meta.v1';

function safeFileDate() {
  return new Date().toISOString().replaceAll(':', '-').replaceAll('.', '-');
}

function isObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value);
}

function readLocalStorageJson(key) {
  try {
    return JSON.parse(window.localStorage.getItem(key) || 'null');
  } catch {
    return null;
  }
}

function writeLocalStorageJson(key, value) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

function collectLabMetadata() {
  const keys = [
    'belaGestaoLab.confirmedProductsImport.v1',
    'belaGestaoLab.wifeAccessReadiness.v1',
    'belaGestaoLab.firebaseConfig.v1',
    'belaGestaoLab.readonlyProbe.v1',
  ];
  return Object.fromEntries(keys.map((key) => [key, readLocalStorageJson(key)]));
}

function buildBackupPayload() {
  const products = getLabProducts();
  const consolidated = getConsolidatedRealData();
  const now = new Date().toISOString();

  return {
    schema: FULL_BACKUP_SCHEMA,
    schemaVersion: FULL_BACKUP_SCHEMA_VERSION,
    exportedAt: now,
    environment: 'lab',
    writeBlocked: true,
    firebaseWriteExecuted: false,
    catalogWriteExecuted: false,
    source: 'bela-gestao-lab-full-backup-restore',
    data: {
      labProducts: products,
      consolidatedData: consolidated,
      metadata: collectLabMetadata(),
    },
    counts: {
      labProducts: products.length,
      consolidatedProducts: consolidated?.products?.length || 0,
      consolidatedCustomers: consolidated?.customers?.length || 0,
      consolidatedSales: consolidated?.sales?.length || 0,
      consolidatedPayments: consolidated?.payments?.length || 0,
    },
    notes: [
      'Backup completo do LAB. Não é backup de produção.',
      'Restauração deve ser feita primeiro no LAB.',
      'Nenhuma escrita Firebase foi executada para gerar este arquivo.',
    ],
  };
}

function downloadJson(filename, payload) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export function exportFullLabBackup() {
  const payload = buildBackupPayload();
  const filename = `bela-gestao-lab-full-backup-${safeFileDate()}.json`;
  downloadJson(filename, payload);
  return {
    ok: true,
    message: 'Backup completo do Gestão novo exportado. Nenhuma escrita foi feita no Firebase.',
    filename,
    counts: payload.counts,
    exportedAt: payload.exportedAt,
    schema: payload.schema,
    schemaVersion: payload.schemaVersion,
    writeBlocked: true,
    firebaseWriteExecuted: false,
    catalogWriteExecuted: false,
  };
}

function validateBackupPayload(payload) {
  const errors = [];
  if (!isObject(payload)) errors.push('Arquivo não é um objeto JSON.');
  if (payload?.schema !== FULL_BACKUP_SCHEMA) errors.push(`Schema inválido: ${payload?.schema || 'ausente'}.`);
  if (!payload?.schemaVersion) errors.push('schemaVersion ausente.');
  if (!isObject(payload?.data)) errors.push('data ausente.');
  if (!Array.isArray(payload?.data?.labProducts)) errors.push('data.labProducts ausente ou inválido.');
  if (payload?.data?.consolidatedData && !isObject(payload.data.consolidatedData)) errors.push('data.consolidatedData inválido.');
  return {
    ok: errors.length === 0,
    errors,
  };
}

export function inspectFullLabBackupText(rawText) {
  let payload;
  try {
    payload = JSON.parse(rawText || '');
  } catch (error) {
    return {
      ok: false,
      message: 'JSON inválido. Não foi possível ler o backup.',
      errors: [String(error?.message || error)],
      counts: {},
    };
  }

  const validation = validateBackupPayload(payload);
  return {
    ok: validation.ok,
    message: validation.ok ? 'Backup válido para restauração LAB.' : 'Backup não está pronto para restauração.',
    errors: validation.errors,
    schema: payload?.schema || '',
    schemaVersion: payload?.schemaVersion || '',
    exportedAt: payload?.exportedAt || '',
    counts: {
      labProducts: payload?.data?.labProducts?.length || 0,
      consolidatedProducts: payload?.data?.consolidatedData?.products?.length || 0,
      consolidatedCustomers: payload?.data?.consolidatedData?.customers?.length || 0,
      consolidatedSales: payload?.data?.consolidatedData?.sales?.length || 0,
      consolidatedPayments: payload?.data?.consolidatedData?.payments?.length || 0,
    },
    writeBlocked: true,
    firebaseWriteExecuted: false,
    catalogWriteExecuted: false,
  };
}

export function restoreFullLabBackupText(rawText) {
  let payload;
  try {
    payload = JSON.parse(rawText || '');
  } catch (error) {
    return {
      ok: false,
      restored: false,
      message: 'JSON inválido. Restauração cancelada.',
      errors: [String(error?.message || error)],
      counts: {},
    };
  }

  const validation = validateBackupPayload(payload);
  if (!validation.ok) {
    return {
      ok: false,
      restored: false,
      message: 'Backup inválido. Restauração cancelada.',
      errors: validation.errors,
      counts: {},
    };
  }

  const products = payload.data.labProducts || [];
  replaceLabProducts(products);

  if (payload.data.consolidatedData) {
    writeLocalStorageJson(CONSOLIDATED_DATA_KEY, payload.data.consolidatedData);
  }

  const meta = {
    restoredAt: new Date().toISOString(),
    sourceExportedAt: payload.exportedAt,
    schema: payload.schema,
    schemaVersion: payload.schemaVersion,
    counts: {
      labProducts: products.length,
      consolidatedProducts: payload.data.consolidatedData?.products?.length || 0,
      consolidatedCustomers: payload.data.consolidatedData?.customers?.length || 0,
      consolidatedSales: payload.data.consolidatedData?.sales?.length || 0,
      consolidatedPayments: payload.data.consolidatedData?.payments?.length || 0,
    },
    firebaseWriteExecuted: false,
    catalogWriteExecuted: false,
  };
  writeLocalStorageJson(RESTORE_META_KEY, meta);

  return {
    ok: true,
    restored: true,
    message: 'Backup completo restaurado no LAB. Nenhuma escrita foi feita no Firebase.',
    counts: meta.counts,
    restoredAt: meta.restoredAt,
    writeBlocked: true,
    firebaseWriteExecuted: false,
    catalogWriteExecuted: false,
  };
}
