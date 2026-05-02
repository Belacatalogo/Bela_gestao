import { getFirebaseLabConfig } from './firebaseLabConfigService.js';
import { getFirebaseReadonlyProbeReadiness } from './firebaseReadonlyProbeService.js';
import { runFirebaseCatalogCompletenessAudit } from './firebaseCatalogCompletenessAuditService.js';

const FIREBASE_APP_CDN = 'https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js';
const FIREBASE_DATABASE_CDN = 'https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js';

const SNAPSHOT_PATHS = [
  '/produtos_custom',
  '/precos',
  '/carrossel',
  '/config',
  '/backup/ultimo',
  '/backup/diario',
];

function safeFileDate() {
  return new Date().toISOString().replaceAll(':', '-').replaceAll('.', '-');
}

async function readRealtimePath(path) {
  const config = getFirebaseLabConfig();
  const [{ initializeApp, getApps }, { getDatabase, ref, get }] = await Promise.all([
    import(FIREBASE_APP_CDN),
    import(FIREBASE_DATABASE_CDN),
  ]);
  const app = getApps().find((item) => item.name === 'bela-gestao-lab-readonly')
    || initializeApp(config, 'bela-gestao-lab-readonly');
  const database = getDatabase(app);
  const snapshot = await get(ref(database, path));
  return snapshot.val();
}

function setByPath(target, path, value) {
  const parts = String(path).split('/').filter(Boolean);
  let cursor = target;
  parts.forEach((part, index) => {
    if (index === parts.length - 1) {
      cursor[part] = value;
      return;
    }
    cursor[part] = cursor[part] || {};
    cursor = cursor[part];
  });
}

function countObject(value) {
  if (!value) return 0;
  if (Array.isArray(value)) return value.filter(Boolean).length;
  if (typeof value === 'object') return Object.keys(value).length;
  return 1;
}

function buildCounts(data) {
  return {
    produtos_custom: countObject(data.produtos_custom),
    precos: countObject(data.precos),
    carrossel: countObject(data.carrossel?.ids || data.carrossel),
    config: countObject(data.config),
    backup_ultimo: countObject(data.backup?.ultimo),
    backup_diario: countObject(data.backup?.diario),
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

export async function buildFirebaseReadonlySnapshot() {
  const readiness = getFirebaseReadonlyProbeReadiness();
  if (!readiness.ready) {
    return {
      ok: false,
      blocked: true,
      message: 'Config Firebase LAB ainda não está pronta para exportar snapshot READ-ONLY.',
      readiness,
    };
  }

  const data = {};
  const readResults = [];

  for (const path of SNAPSHOT_PATHS) {
    try {
      const value = await readRealtimePath(path);
      setByPath(data, path, value);
      readResults.push({ path, ok: true, count: countObject(value) });
    } catch (error) {
      readResults.push({
        path,
        ok: false,
        error: {
          name: error?.name || 'Error',
          code: error?.code || '',
          message: String(error?.message || error),
        },
      });
    }
  }

  const completeness = await runFirebaseCatalogCompletenessAudit();
  const exportedAt = new Date().toISOString();
  const payload = {
    meta: {
      schema: 'bela-gestao-firebase-readonly-snapshot',
      schemaVersion: 1,
      exportedAt,
      source: 'firebase-readonly-lab',
      writeBlocked: true,
      firebaseWriteExecuted: false,
      catalogWriteExecuted: false,
      note: 'Snapshot exportado pelo Bela Gestão LAB em modo somente leitura. Não restaura nem altera dados reais.',
    },
    firebase: {
      projectId: getFirebaseLabConfig()?.projectId || '',
      databaseURL: getFirebaseLabConfig()?.databaseURL || '',
      paths: SNAPSHOT_PATHS,
      readResults,
    },
    counts: buildCounts(data),
    data,
    audit: completeness.ok ? completeness : { ok: false, message: completeness.message, error: completeness.error || null },
  };

  return {
    ok: true,
    payload,
    filename: `bela-gestao-firebase-readonly-snapshot-${safeFileDate()}.json`,
    counts: payload.counts,
    readResults,
    message: 'Snapshot Firebase READ-ONLY montado. Nenhuma escrita foi feita no Firebase.',
  };
}

export async function exportFirebaseReadonlySnapshotJson() {
  const result = await buildFirebaseReadonlySnapshot();
  if (!result.ok) return result;
  downloadJson(result.filename, result.payload);
  return {
    ...result,
    downloaded: true,
    message: 'Snapshot Firebase READ-ONLY exportado em JSON. Nenhuma escrita foi feita no Firebase.',
  };
}
