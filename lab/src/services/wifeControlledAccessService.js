import { getConsolidatedRealData } from './realDataConsolidatorService.js';

const WIFE_ACCESS_KEY = 'belaGestaoLab.wifeControlledAccess.v1';
const RESTORE_META_KEY = 'belaGestaoLab.fullRestore.meta.v1';

function normalizeText(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function readJson(key) {
  try {
    return JSON.parse(window.localStorage.getItem(key) || 'null');
  } catch {
    return null;
  }
}

function writeJson(key, value) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

function buildReadiness() {
  const consolidated = getConsolidatedRealData();
  const restoreMeta = readJson(RESTORE_META_KEY);
  const products = consolidated?.products || [];
  const customers = consolidated?.customers || [];
  const sales = consolidated?.sales || [];
  const payments = consolidated?.payments || [];

  const checks = [
    {
      id: 'consolidated-products',
      label: 'Produtos consolidados',
      ok: products.length > 0,
      detail: `${products.length} produto(s) consolidados.`,
    },
    {
      id: 'consolidated-customers',
      label: 'Clientes consolidados',
      ok: customers.length > 0,
      detail: `${customers.length} cliente(s) consolidados.`,
    },
    {
      id: 'consolidated-sales',
      label: 'Vendas consolidadas',
      ok: sales.length > 0,
      detail: `${sales.length} venda(s) consolidadas.`,
    },
    {
      id: 'consolidated-payments',
      label: 'Parcelas consolidadas',
      ok: payments.length > 0,
      detail: `${payments.length} parcela(s) consolidadas.`,
    },
    {
      id: 'restore-tested',
      label: 'Backup/restore testado no LAB',
      ok: Boolean(restoreMeta),
      detail: restoreMeta ? `Última restauração LAB: ${restoreMeta.restoredAt || 'sem data'}.` : 'Ainda não há restauração LAB registrada.',
    },
  ];

  const okCount = checks.filter((check) => check.ok).length;
  const readyForWifeTest = okCount >= 4 && products.length > 0;

  return {
    consolidated,
    restoreMeta,
    checks,
    okCount,
    totalChecks: checks.length,
    readyForWifeTest,
  };
}

export function getWifeControlledAccessStatus() {
  const saved = readJson(WIFE_ACCESS_KEY);
  const readiness = buildReadiness();
  return {
    ok: true,
    message: 'Status de acesso controlado carregado.',
    access: saved || null,
    readiness: {
      checks: readiness.checks,
      okCount: readiness.okCount,
      totalChecks: readiness.totalChecks,
      readyForWifeTest: readiness.readyForWifeTest,
    },
    counts: {
      products: readiness.consolidated?.products?.length || 0,
      customers: readiness.consolidated?.customers?.length || 0,
      sales: readiness.consolidated?.sales?.length || 0,
      payments: readiness.consolidated?.payments?.length || 0,
    },
    productionAccessEnabled: false,
    firebaseWriteExecuted: false,
    catalogWriteExecuted: false,
  };
}

export function enableWifeTestAccess({ name = 'Yasmin', note = '' } = {}) {
  const readiness = buildReadiness();
  if (!readiness.readyForWifeTest) {
    return {
      ok: false,
      enabled: false,
      message: 'Acesso de teste ainda bloqueado. Conclua os itens pendentes do checklist.',
      readiness: {
        checks: readiness.checks,
        okCount: readiness.okCount,
        totalChecks: readiness.totalChecks,
        readyForWifeTest: readiness.readyForWifeTest,
      },
      productionAccessEnabled: false,
      firebaseWriteExecuted: false,
      catalogWriteExecuted: false,
    };
  }

  const payload = {
    enabled: true,
    mode: 'wife_test_lab',
    userName: normalizeText(name) || 'Yasmin',
    note: normalizeText(note),
    enabledAt: new Date().toISOString(),
    environment: 'lab',
    productionAccessEnabled: false,
    firebaseWriteEnabled: false,
    catalogWriteEnabled: false,
    rules: [
      'Acesso liberado apenas para teste no LAB.',
      'Produção continua bloqueada.',
      'Firebase write continua bloqueado.',
      'Catálogo antigo não será alterado.',
    ],
  };
  writeJson(WIFE_ACCESS_KEY, payload);

  return {
    ok: true,
    enabled: true,
    message: 'Acesso de teste da esposa liberado no LAB. Produção e Firebase continuam bloqueados.',
    access: payload,
    readiness: {
      checks: readiness.checks,
      okCount: readiness.okCount,
      totalChecks: readiness.totalChecks,
      readyForWifeTest: readiness.readyForWifeTest,
    },
    productionAccessEnabled: false,
    firebaseWriteExecuted: false,
    catalogWriteExecuted: false,
  };
}

export function disableWifeTestAccess() {
  const previous = readJson(WIFE_ACCESS_KEY);
  const payload = {
    ...(previous || {}),
    enabled: false,
    disabledAt: new Date().toISOString(),
    productionAccessEnabled: false,
    firebaseWriteEnabled: false,
    catalogWriteEnabled: false,
  };
  writeJson(WIFE_ACCESS_KEY, payload);
  return {
    ok: true,
    enabled: false,
    message: 'Acesso de teste da esposa desativado no LAB.',
    access: payload,
    productionAccessEnabled: false,
    firebaseWriteExecuted: false,
    catalogWriteExecuted: false,
  };
}
