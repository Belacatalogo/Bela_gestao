const DIAGNOSTIC_EVENTS_KEY = 'belaGestaoLab.diagnostics.events.v1';
const MAX_EVENTS = 80;
const HEAVY_VALUE_LIMIT = 420000;

function now() {
  return new Date().toISOString();
}

function safeJsonParse(value, fallback = null) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function canUseStorage() {
  try {
    const testKey = 'belaGestaoLab.diagnostics.storageTest';
    window.localStorage.setItem(testKey, '1');
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

function readEvents() {
  if (!canUseStorage()) return [];
  const events = safeJsonParse(window.localStorage.getItem(DIAGNOSTIC_EVENTS_KEY), []);
  return Array.isArray(events) ? events : [];
}

function writeEvents(events) {
  if (!canUseStorage()) return false;
  window.localStorage.setItem(DIAGNOSTIC_EVENTS_KEY, JSON.stringify(events.slice(0, MAX_EVENTS)));
  return true;
}

export function logDiagnosticEvent(level, source, message, details = {}) {
  const event = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: now(),
    level,
    source,
    message,
    details,
  };

  writeEvents([event, ...readEvents()]);
  return event;
}

export function clearDiagnosticEvents() {
  if (!canUseStorage()) return false;
  window.localStorage.setItem(DIAGNOSTIC_EVENTS_KEY, JSON.stringify([]));
  return true;
}

export function installRuntimeDiagnostics() {
  if (window.__belaLabDiagnosticsInstalled) return;
  window.__belaLabDiagnosticsInstalled = true;

  window.addEventListener('error', (event) => {
    logDiagnosticEvent('error', 'window.error', event.message || 'Erro JavaScript capturado.', {
      filename: event.filename || '',
      lineno: event.lineno || 0,
      colno: event.colno || 0,
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    logDiagnosticEvent('error', 'unhandledrejection', 'Promise rejeitada sem tratamento.', {
      reason: String(event.reason?.message || event.reason || ''),
    });
  });

  logDiagnosticEvent('info', 'runtime', 'Diagnóstico LAB iniciado.', {
    userAgent: navigator.userAgent,
  });
}

function getStorageRows() {
  if (!canUseStorage()) {
    return {
      ok: false,
      rows: [],
      totalSize: 0,
      warnings: ['localStorage indisponível neste navegador.'],
    };
  }

  const rows = [];
  let totalSize = 0;
  const warnings = [];

  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    const value = window.localStorage.getItem(key) || '';
    const size = value.length;
    totalSize += size;

    if (key?.startsWith('belaGestaoLab')) {
      rows.push({
        key,
        size,
        sizeKb: Math.round((size / 1024) * 10) / 10,
        isHeavy: size > HEAVY_VALUE_LIMIT,
      });
    }

    if (key?.startsWith('belaGestaoLab') && size > HEAVY_VALUE_LIMIT) {
      warnings.push(`Storage pesado: ${key} com ${Math.round(size / 1024)} KB.`);
    }
  }

  return {
    ok: true,
    rows: rows.sort((a, b) => b.size - a.size),
    totalSize,
    totalSizeKb: Math.round((totalSize / 1024) * 10) / 10,
    warnings,
  };
}

function getImageDiagnostics(products) {
  const rows = products.map((product) => {
    const imageUrl = String(product.imageUrl || '');
    return {
      id: product.id,
      name: product.name,
      kind: imageUrl.startsWith('data:image/svg+xml')
        ? 'placeholder'
        : imageUrl.startsWith('data:image/')
          ? 'lab-data-url'
          : imageUrl.startsWith('http')
            ? 'remote-url'
            : 'empty',
      size: imageUrl.length,
      sizeKb: Math.round((imageUrl.length / 1024) * 10) / 10,
      isHeavy: imageUrl.length > HEAVY_VALUE_LIMIT,
    };
  });

  return {
    rows,
    heavyCount: rows.filter((row) => row.isHeavy).length,
    labDataUrlCount: rows.filter((row) => row.kind === 'lab-data-url').length,
    placeholderCount: rows.filter((row) => row.kind === 'placeholder').length,
  };
}

function getDataWarnings({ products, sales, catalogReport, storage, images }) {
  const warnings = [];

  if (!products.length) warnings.push('Nenhum produto LAB carregado.');
  if (catalogReport.invalidProducts > 0) warnings.push(`${catalogReport.invalidProducts} produto(s) com campos obrigatórios faltando.`);
  if (catalogReport.warningProducts > 0) warnings.push(`${catalogReport.warningProducts} produto(s) com alerta no contrato do catálogo.`);
  if (images.heavyCount > 0) warnings.push(`${images.heavyCount} imagem(ns) LAB pesada(s) detectada(s).`);
  if (storage.warnings.length) warnings.push(...storage.warnings);
  if (sales.some((sale) => !sale.clientName || !sale.productId)) warnings.push('Existe venda LAB com dados incompletos.');

  return warnings;
}

export function buildDiagnosticsReport({ appConfig, environment, products, sales, salesStats, catalogReport }) {
  const storage = getStorageRows();
  const images = getImageDiagnostics(products);
  const events = readEvents();
  const warnings = getDataWarnings({ products, sales, catalogReport, storage, images });

  return {
    generatedAt: now(),
    app: {
      name: appConfig.name,
      version: appConfig.version,
      branch: appConfig.branch,
      environment: appConfig.environment,
      productionBranch: appConfig.productionBranch,
    },
    browser: {
      online: navigator.onLine,
      language: navigator.language,
      userAgent: navigator.userAgent,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      devicePixelRatio: window.devicePixelRatio || 1,
    },
    environment,
    counts: {
      products: products.length,
      visibleProducts: products.filter((product) => product.visibleInCatalog).length,
      sales: sales.length,
      paidSales: salesStats.paid,
      pendingSales: salesStats.pending,
      catalogWarnings: catalogReport.warningProducts,
      catalogInvalid: catalogReport.invalidProducts,
    },
    money: {
      totalSold: salesStats.totalSold,
      totalProfit: salesStats.totalProfit,
    },
    storage,
    images,
    warnings,
    events,
  };
}

export function copyDiagnosticsReport(report) {
  const text = JSON.stringify(report, null, 2);

  if (navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text);
  }

  return Promise.reject(new Error('Clipboard indisponível neste navegador.'));
}
