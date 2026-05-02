export const MASTER_BACKUP_SCHEMA_VERSION = 1;

export const MASTER_BACKUP_SECTIONS = Object.freeze({
  META: 'meta',
  CATALOG: 'catalog',
  SALES: 'sales',
  PAYMENTS: 'payments',
  CUSTOMERS: 'customers',
  SETTINGS: 'settings',
  AI: 'ai',
  PWA: 'pwa',
  ANALYTICS: 'analytics',
});

const SENSITIVE_FIELDS = ['cpf', 'phone', 'email', 'name', 'address'];
const NEVER_PUBLIC_FIELDS = ['apiKey', 'token', 'secret', 'password', 'privateKey', 'accessToken', 'refreshToken'];

export function createEmptyMasterBackup({ source = 'lab', appVersion = '' } = {}) {
  return {
    meta: {
      schema: 'bela-gestao-master-backup',
      schemaVersion: MASTER_BACKUP_SCHEMA_VERSION,
      createdAt: new Date().toISOString(),
      source,
      appVersion,
      notes: 'Backup mestre preparado para JSON manual, Firebase diário e restore completo.',
    },
    catalog: {
      products: [],
      categories: [],
      tabs: [],
      images: [],
      visibility: [],
    },
    sales: {
      orders: [],
      items: [],
      legacy: [],
    },
    payments: {
      installments: [],
      transactions: [],
      dueDates: [],
      notes: [],
      history: [],
    },
    customers: {
      list: [],
      sensitiveFields: SENSITIVE_FIELDS,
    },
    settings: {
      preferences: {},
      ui: {},
      business: {},
      backup: {},
    },
    ai: {
      enabledFeatures: [],
      promptTemplates: [],
      preferences: {},
      generatedResults: [],
      secretsPolicy: 'never-store-api-keys-in-public-backup-or-repository',
    },
    pwa: {
      appVersion,
      cacheVersion: '',
      installState: '',
    },
    analytics: {
      logs: [],
      metrics: {},
      diagnostics: [],
    },
  };
}

function deepClone(value) {
  return JSON.parse(JSON.stringify(value || {}));
}

function mergeObject(base, value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return base;
  return { ...base, ...value };
}

export function normalizeMasterBackup(raw = {}, options = {}) {
  const base = createEmptyMasterBackup(options);
  const source = raw && typeof raw === 'object' ? raw : {};

  return {
    ...base,
    ...source,
    meta: mergeObject(base.meta, source.meta),
    catalog: mergeObject(base.catalog, source.catalog),
    sales: mergeObject(base.sales, source.sales),
    payments: mergeObject(base.payments, source.payments),
    customers: mergeObject(base.customers, source.customers),
    settings: mergeObject(base.settings, source.settings),
    ai: mergeObject(base.ai, source.ai),
    pwa: mergeObject(base.pwa, source.pwa),
    analytics: mergeObject(base.analytics, source.analytics),
  };
}

function anonymizeText(value, fallback) {
  return value ? fallback : value;
}

export function sanitizeMasterBackupForExport(backup) {
  const clone = deepClone(normalizeMasterBackup(backup));

  clone.customers.list = Array.isArray(clone.customers.list)
    ? clone.customers.list.map((customer, index) => ({
      ...customer,
      name: anonymizeText(customer.name, `Cliente Anônimo ${index + 1}`),
      cpf: anonymizeText(customer.cpf, '***'),
      phone: anonymizeText(customer.phone, '***'),
      email: anonymizeText(customer.email, '***'),
      address: anonymizeText(customer.address, '***'),
    }))
    : [];

  clone.ai = removeNeverPublicFields(clone.ai);
  clone.settings = removeNeverPublicFields(clone.settings);
  clone.meta.sanitizedAt = new Date().toISOString();

  return clone;
}

function removeNeverPublicFields(value) {
  if (Array.isArray(value)) return value.map(removeNeverPublicFields);
  if (!value || typeof value !== 'object') return value;

  return Object.entries(value).reduce((acc, [key, item]) => {
    if (NEVER_PUBLIC_FIELDS.some((blocked) => key.toLowerCase().includes(blocked.toLowerCase()))) {
      acc[key] = '[removed-sensitive-field]';
      return acc;
    }
    acc[key] = removeNeverPublicFields(item);
    return acc;
  }, {});
}

export function buildMasterBackupFromLabState({ appVersion, products = [], sales = [], payments = [], diagnostics = [] } = {}) {
  const customersMap = new Map();

  sales.forEach((sale) => {
    const key = sale.cpf || sale.phone || sale.clientName || sale.id;
    if (!key || customersMap.has(key)) return;
    customersMap.set(key, {
      id: `customer-${customersMap.size + 1}`,
      name: sale.clientName || '',
      phone: sale.phone || '',
      cpf: sale.cpf || '',
      source: sale.legacyProductId ? 'legacy-json-import' : 'lab',
      createdAt: sale.createdAt || '',
    });
  });

  return normalizeMasterBackup({
    catalog: {
      products,
      categories: Array.from(new Set(products.map((product) => product.category).filter(Boolean))),
      tabs: Array.from(new Set(products.flatMap((product) => product.catalogTabs || []).filter(Boolean))),
      images: products.map((product) => ({
        productId: product.id,
        imageUrl: product.imageUrl || '',
        hasRealImage: Boolean(product.imageUrl) && !String(product.imageUrl).startsWith('data:image/svg+xml'),
      })),
      visibility: products.map((product) => ({ productId: product.id, visibleInCatalog: Boolean(product.visibleInCatalog) })),
    },
    sales: {
      orders: sales,
      items: sales.map((sale) => ({
        saleId: sale.id,
        productId: sale.productId,
        productName: sale.productName,
        quantity: sale.quantity,
        unitPrice: sale.unitPrice,
        total: sale.total,
      })),
      legacy: sales.filter((sale) => sale.legacyProductId || sale.legacySid),
    },
    payments: {
      installments: payments,
      transactions: payments.filter((payment) => payment.status === 'pago'),
      dueDates: payments.map((payment) => ({ paymentId: payment.id, dueDate: payment.dueDate || '', status: payment.status })),
      notes: payments.filter((payment) => payment.notes).map((payment) => ({ paymentId: payment.id, notes: payment.notes })),
      history: payments.filter((payment) => payment.paidAt).map((payment) => ({ paymentId: payment.id, paidAt: payment.paidAt })),
    },
    customers: {
      list: Array.from(customersMap.values()),
      sensitiveFields: SENSITIVE_FIELDS,
    },
    settings: {
      preferences: {},
      ui: { theme: 'dark-gold-lab' },
      business: {},
      backup: { schemaVersion: MASTER_BACKUP_SCHEMA_VERSION, supportsManualJson: true, supportsFirebaseDaily: true },
    },
    ai: {
      enabledFeatures: [],
      promptTemplates: [],
      preferences: {},
      generatedResults: [],
      secretsPolicy: 'never-store-api-keys-in-public-backup-or-repository',
    },
    pwa: {
      appVersion,
      cacheVersion: '',
      installState: 'lab',
    },
    analytics: {
      logs: [],
      metrics: {
        productCount: products.length,
        salesCount: sales.length,
        paymentCount: payments.length,
      },
      diagnostics,
    },
  }, { source: 'lab', appVersion });
}

export function getMasterBackupSchemaReport({ appVersion, products = [], sales = [], payments = [] } = {}) {
  const backup = buildMasterBackupFromLabState({ appVersion, products, sales, payments });
  const sanitized = sanitizeMasterBackupForExport(backup);

  return {
    schemaActive: true,
    schemaVersion: MASTER_BACKUP_SCHEMA_VERSION,
    normalized: true,
    sensitivePolicyActive: true,
    neverPublicFields: NEVER_PUBLIC_FIELDS,
    sensitiveFields: SENSITIVE_FIELDS,
    sections: Object.values(MASTER_BACKUP_SECTIONS),
    counts: {
      products: backup.catalog.products.length,
      categories: backup.catalog.categories.length,
      tabs: backup.catalog.tabs.length,
      images: backup.catalog.images.length,
      sales: backup.sales.orders.length,
      payments: backup.payments.installments.length,
      customers: backup.customers.list.length,
      sanitizedCustomers: sanitized.customers.list.length,
    },
    restoreReadiness: {
      manualJson: true,
      firebaseDaily: true,
      fullRestore: 'planned-after-readonly-firebase',
      realWritesBlocked: true,
    },
    requiredBeforeRealRestore: [
      'validar coleção real de produtos e catálogo',
      'validar fotos/URLs reais',
      'validar login da esposa em ambiente final',
      'validar backup automático Firebase diário',
      'criar tela de confirmação antes de sobrescrever dados reais',
    ],
  };
}
