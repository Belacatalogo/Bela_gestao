import { getLabProducts } from './labDataService.js';
import {
  DATA_ORIGINS,
  PRODUCT_RECOVERY_STATUS,
  createMasterCustomerContract,
  createMasterPaymentContract,
  createMasterProductContract,
  createMasterSaleContract,
  deriveCatalogSyncStatus,
} from '../contracts/masterSourceContracts.js';

const CONSOLIDATED_DATA_KEY = 'belaGestaoLab.consolidatedData.v1';

function normalizeText(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function normalizeId(value) {
  return normalizeText(value);
}

function normalizeMoney(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string') {
    const clean = value.replace(/R\$\s?/i, '').replace(/\./g, '').replace(',', '.').replace(/[^0-9.-]/g, '').trim();
    const number = Number(clean);
    return Number.isFinite(number) ? number : 0;
  }
  return 0;
}

function isObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value);
}

function safeJsonParse(rawText) {
  if (!normalizeText(rawText)) return { ok: true, data: null };
  try {
    const data = JSON.parse(rawText);
    return { ok: true, data };
  } catch (error) {
    return { ok: false, error: String(error?.message || error) };
  }
}

function originFromProduct(product) {
  const source = `${product.source || ''} ${product.importSource || ''}`.toLowerCase();
  if (source.includes('firebase') || source.includes('produtos_custom')) return DATA_ORIGINS.FIREBASE;
  if (source.includes('backup')) return DATA_ORIGINS.MANUAL_BACKUP;
  if (source.includes('catalog')) return DATA_ORIGINS.PUBLIC_CATALOG;
  if (source.includes('manual')) return DATA_ORIGINS.MANUAL_ENTRY;
  return DATA_ORIGINS.LAB;
}

function recoveryFromProduct(product) {
  const status = normalizeText(product.confirmationStatus || product.recoveryStatus);
  if (status === PRODUCT_RECOVERY_STATUS.CONFIRMED) return PRODUCT_RECOVERY_STATUS.CONFIRMED;
  if (status === PRODUCT_RECOVERY_STATUS.PROBABLE) return PRODUCT_RECOVERY_STATUS.PROBABLE;
  if (status === PRODUCT_RECOVERY_STATUS.DOUBTFUL) return PRODUCT_RECOVERY_STATUS.DOUBTFUL;
  if (product.firebaseId) return PRODUCT_RECOVERY_STATUS.CONFIRMED;
  if (product.name && product.imageUrl) return PRODUCT_RECOVERY_STATUS.PROBABLE;
  return PRODUCT_RECOVERY_STATUS.PENDING_REVIEW;
}

function toMasterProduct(product, index, backupPrices = {}, backupSold = {}) {
  const legacyId = normalizeText(product.firebaseId || product.originalCatalogId || '').replace(/^firebase-(recovered-)?/, '');
  const origin = originFromProduct(product);
  const backupPrice = legacyId ? normalizeMoney(backupPrices[legacyId]) : 0;
  const recoveryStatus = recoveryFromProduct(product);
  const price = normalizeMoney(product.price) || backupPrice;
  const master = createMasterProductContract({
    id: normalizeText(product.id || `master-product-${index + 1}`),
    legacyIds: Array.from(new Set([legacyId, product.id, product.originalCatalogId].map(normalizeText).filter(Boolean))),
    firebaseId: normalizeText(product.firebaseId || '').replace(/^firebase-(recovered-)?/, ''),
    publicCatalogId: normalizeText(product.originalCatalogId || ''),
    name: normalizeText(product.name),
    brand: normalizeText(product.brand),
    description: normalizeText(product.description),
    price,
    cost: normalizeMoney(product.cost),
    imageUrl: normalizeText(product.imageUrl),
    extraImages: Array.isArray(product.extraImages) ? product.extraImages : [],
    category: normalizeText(product.category || 'catalogo').toLowerCase(),
    catalogTabs: Array.from(new Set([...(product.catalogTabs || []), 'todos'].filter(Boolean))),
    badge: normalizeText(product.badge),
    stock: Math.max(0, Number(product.stock || 0)),
    visibleInGestao: true,
    visibleInCatalog: Boolean(product.visibleInCatalog),
    recoveryStatus,
    origins: Array.from(new Set([origin, ...(product.confirmedSources || [])].filter(Boolean))),
    originDetails: {
      source: product.source || '',
      importSource: product.importSource || '',
      sourcePath: product.sourcePath || '',
      priceSource: product.priceSource || '',
      backupPriceApplied: Boolean(backupPrice && !normalizeMoney(product.price)),
    },
    sold: Boolean((legacyId && backupSold[legacyId]) || product.sold),
    notes: normalizeText(product.notes),
    createdAt: product.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  return {
    ...master,
    catalogSyncStatus: deriveCatalogSyncStatus(master),
  };
}

function customerKey(sale) {
  const cpf = normalizeText(sale.cpf).replace(/\D/g, '');
  if (cpf) return `cpf:${cpf}`;
  const phone = normalizeText(sale.phone).replace(/\D/g, '');
  if (phone) return `phone:${phone}`;
  return `name:${normalizeText(sale.name).toLowerCase()}`;
}

function buildCustomersFromBackupSales(sales) {
  const customers = new Map();
  if (!isObject(sales)) return [];

  Object.values(sales).forEach((rows) => {
    if (!Array.isArray(rows)) return;
    rows.forEach((sale) => {
      if (!isObject(sale) || !normalizeText(sale.name)) return;
      const key = customerKey(sale);
      if (!key || key === 'name:') return;
      const current = customers.get(key);
      if (current) return;
      customers.set(key, createMasterCustomerContract({
        id: `customer-${customers.size + 1}`,
        name: normalizeText(sale.name),
        phone: normalizeText(sale.phone),
        cpf: normalizeText(sale.cpf),
        origins: [DATA_ORIGINS.MANUAL_BACKUP],
      }));
    });
  });

  return Array.from(customers.values());
}

function findCustomerId(customers, sale) {
  const key = customerKey(sale);
  const found = customers.find((customer) => {
    if (key.startsWith('cpf:')) return normalizeText(customer.cpf).replace(/\D/g, '') === key.replace('cpf:', '');
    if (key.startsWith('phone:')) return normalizeText(customer.phone).replace(/\D/g, '') === key.replace('phone:', '');
    return normalizeText(customer.name).toLowerCase() === key.replace('name:', '');
  });
  return found?.id || '';
}

function buildSalesAndPaymentsFromBackup(backup, customers, productByLegacyId) {
  const salesMap = backup?.sales || backup?.vendas || {};
  const pagMeta = backup?.pagMeta || backup?.pagamentosMeta || backup?.paymentMeta || {};
  const sales = [];
  const payments = [];
  if (!isObject(salesMap)) return { sales, payments };

  Object.entries(salesMap).forEach(([legacyProductId, rows]) => {
    if (!Array.isArray(rows)) return;
    rows.forEach((saleRow, rowIndex) => {
      if (!isObject(saleRow)) return;
      const saleId = `sale-${legacyProductId}-${saleRow.sid || rowIndex}`;
      const quantity = Number(saleRow.qty || saleRow.quantity || 1) || 1;
      const installmentCount = Number(saleRow.count || (Array.isArray(saleRow.paid) ? saleRow.paid.length : 1) || 1) || 1;
      const product = productByLegacyId.get(normalizeId(legacyProductId));
      const totalValue = normalizeMoney(product?.price) * quantity;
      const paidArray = Array.isArray(saleRow.paid) ? saleRow.paid : [];
      const paidCount = paidArray.filter(Boolean).length;
      const installmentValue = installmentCount > 0 ? totalValue / installmentCount : totalValue;
      const customerId = findCustomerId(customers, saleRow);
      const masterSale = createMasterSaleContract({
        id: saleId,
        legacySaleId: normalizeText(saleRow.sid || rowIndex),
        productId: product?.id || '',
        legacyProductId: normalizeId(legacyProductId),
        customerId,
        customerSnapshot: {
          name: normalizeText(saleRow.name),
          phone: normalizeText(saleRow.phone),
          cpf: normalizeText(saleRow.cpf),
        },
        quantity,
        installmentCount,
        purchaseDate: normalizeText(saleRow.purchaseDate),
        totalValue,
        paidValue: installmentValue * paidCount,
        status: paidCount >= installmentCount ? 'quitada' : 'aberta',
        origins: [DATA_ORIGINS.MANUAL_BACKUP],
      });
      sales.push(masterSale);

      for (let index = 0; index < installmentCount; index += 1) {
        const metaKeyExact = `${legacyProductId}_${saleRow.sid || rowIndex}`;
        const metaKeyIndex = `${legacyProductId}_${rowIndex}`;
        const meta = pagMeta[metaKeyExact] || pagMeta[metaKeyIndex] || {};
        const parcHist = meta?.parcHist || {};
        payments.push(createMasterPaymentContract({
          id: `payment-${saleId}-${index + 1}`,
          saleId,
          installmentIndex: index,
          dueDate: normalizeText(meta?.venc),
          paidAt: normalizeText(parcHist[index] || meta?.date || ''),
          paid: Boolean(paidArray[index]),
          value: installmentValue,
          obs: normalizeText(meta?.obs),
          history: parcHist[index] ? [parcHist[index]] : [],
          origins: [DATA_ORIGINS.MANUAL_BACKUP],
        }));
      }
    });
  });

  return { sales, payments };
}

function summarize(consolidated) {
  const products = consolidated.products || [];
  const sales = consolidated.sales || [];
  const payments = consolidated.payments || [];
  return {
    products: products.length,
    customers: consolidated.customers.length,
    sales: sales.length,
    payments: payments.length,
    productsWithImage: products.filter((product) => product.imageUrl).length,
    productsWithPrice: products.filter((product) => product.price > 0).length,
    productsReadyForCatalog: products.filter((product) => product.catalogSyncStatus === 'pronto_catalogo').length,
    productsNeedReview: products.filter((product) => product.catalogSyncStatus === 'precisa_revisao').length,
    openSales: sales.filter((sale) => sale.status !== 'quitada').length,
    paidSales: sales.filter((sale) => sale.status === 'quitada').length,
    paidInstallments: payments.filter((payment) => payment.paid).length,
    openInstallments: payments.filter((payment) => !payment.paid).length,
  };
}

export function consolidateRealData(rawBackupText = '') {
  const parsed = safeJsonParse(rawBackupText);
  if (!parsed.ok) {
    return {
      ok: false,
      message: 'Backup JSON inválido. Consolidação não executada.',
      error: parsed.error,
    };
  }

  const backup = parsed.data || {};
  const backupPrices = backup?.prices || backup?.precos || {};
  const backupSold = backup?.sold || backup?.vendidos || {};
  const products = getLabProducts().map((product, index) => toMasterProduct(product, index, backupPrices, backupSold));
  const productByLegacyId = new Map();
  products.forEach((product) => {
    product.legacyIds.forEach((id) => productByLegacyId.set(normalizeId(id), product));
  });

  const customers = buildCustomersFromBackupSales(backup?.sales || backup?.vendas || {});
  const { sales, payments } = buildSalesAndPaymentsFromBackup(backup, customers, productByLegacyId);

  const consolidated = {
    schema: 'bela-gestao-master-consolidated-data',
    schemaVersion: 1,
    consolidatedAt: new Date().toISOString(),
    source: 'lab-real-data-consolidator',
    writeBlocked: true,
    firebaseWriteExecuted: false,
    catalogWriteExecuted: false,
    products,
    customers,
    sales,
    payments,
    backupMeta: parsed.data ? {
      version: backup.version ?? null,
      exportedAt: backup.exportedAt || '',
      priceCount: Object.keys(backupPrices || {}).length,
      soldCount: Object.keys(backupSold || {}).length,
      salesProductCount: Object.keys(backup?.sales || backup?.vendas || {}).length,
      pagMetaCount: Object.keys(backup?.pagMeta || {}).length,
    } : null,
  };

  const summary = summarize(consolidated);
  try {
    window.localStorage.setItem(CONSOLIDATED_DATA_KEY, JSON.stringify(consolidated));
  } catch {}

  return {
    ok: true,
    message: 'Consolidação real concluída no LAB. Nada foi escrito no Firebase ou no catálogo antigo.',
    summary,
    samples: {
      products: products.slice(0, 10).map((product) => ({ id: product.id, name: product.name, status: product.catalogSyncStatus, price: product.price })),
      customers: customers.slice(0, 10).map((customer) => ({ id: customer.id, name: customer.name, phone: customer.phone })),
      sales: sales.slice(0, 10).map((sale) => ({ id: sale.id, legacyProductId: sale.legacyProductId, customer: sale.customerSnapshot?.name, status: sale.status })),
      payments: payments.slice(0, 10).map((payment) => ({ id: payment.id, saleId: payment.saleId, paid: payment.paid, value: payment.value })),
    },
    storageKey: CONSOLIDATED_DATA_KEY,
    backupMeta: consolidated.backupMeta,
    writeBlocked: true,
    firebaseWriteExecuted: false,
    catalogWriteExecuted: false,
  };
}

export function getConsolidatedRealData() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(CONSOLIDATED_DATA_KEY) || 'null');
    return parsed || null;
  } catch {
    return null;
  }
}
