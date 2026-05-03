import { createId } from '../utils/ids.js';

const LAB_SALES_KEY = 'belaGestaoLab.sales.v1';
const HISTORY_SCHEMA_VERSION = 'history-v1';

function safeParse(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function canUseStorage() {
  try {
    const testKey = 'belaGestaoLab.salesStorageTest';
    window.localStorage.setItem(testKey, '1');
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

function normalizeNumber(value) {
  const number = Number(String(value || '0').replace(',', '.'));
  return Number.isFinite(number) ? Math.max(0, number) : 0;
}

function normalizeText(value) {
  return String(value || '').trim();
}

function slug(value) {
  return normalizeText(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'cliente';
}

function buildCustomerSnapshot(draft, fallbackName = '') {
  const name = normalizeText(draft.clientName || draft.customerName || draft.saleClientName || fallbackName);
  const phone = normalizeText(draft.phone || draft.clientPhone || '');
  const cpf = normalizeText(draft.cpf || draft.clientCpf || '');
  const idSeed = phone || cpf || name || createId('customer');

  return {
    id: draft.customerId || `customer-${slug(idSeed)}`,
    name: name || 'Cliente sem nome',
    phone,
    cpf,
  };
}

function buildProductSnapshot(product, fallback = {}) {
  const id = normalizeText(product?.id || fallback.productId || fallback.originalProductId || '');
  const name = normalizeText(product?.name || fallback.productName || fallback.saleProductName || 'Produto removido');
  const price = normalizeNumber(fallback.unitPrice || product?.price || fallback.total || 0);
  const cost = normalizeNumber(product?.cost || fallback.unitCost || 0);

  return {
    id,
    name,
    brand: normalizeText(product?.brand || fallback.productBrand || ''),
    description: normalizeText(product?.description || fallback.productDescription || ''),
    category: normalizeText(product?.category || fallback.productCategory || ''),
    imageUrl: normalizeText(product?.imageUrl || fallback.productImageUrl || ''),
    unitPriceAtSale: price,
    unitCostAtSale: cost,
    visibleInCatalogAtSale: Boolean(product?.visibleInCatalog ?? fallback.visibleInCatalogAtSale ?? false),
    capturedAt: fallback.createdAt || new Date().toISOString(),
  };
}

function normalizeHistoricalSale(sale) {
  if (!sale || typeof sale !== 'object') return sale;

  const customer = sale.customer || buildCustomerSnapshot(sale, sale.clientName);
  const productSnapshot = sale.productSnapshot || buildProductSnapshot(null, sale);
  const quantity = Math.max(1, Math.round(normalizeNumber(sale.quantity || 1)));
  const unitPrice = normalizeNumber(sale.unitPrice || productSnapshot.unitPriceAtSale || 0);
  const unitCost = normalizeNumber(sale.unitCost || productSnapshot.unitCostAtSale || 0);
  const total = normalizeNumber(sale.total || unitPrice * quantity);
  const profit = normalizeNumber(sale.profit || Math.max(0, (unitPrice - unitCost) * quantity));

  return {
    ...sale,
    schemaVersion: sale.schemaVersion || HISTORY_SCHEMA_VERSION,
    customerId: sale.customerId || customer.id,
    customerName: sale.customerName || customer.name,
    clientName: sale.clientName || customer.name,
    phone: sale.phone || customer.phone || '',
    cpf: sale.cpf || customer.cpf || '',
    customer,
    originalProductId: sale.originalProductId || sale.productId || productSnapshot.id || '',
    productId: sale.productId || productSnapshot.id || '',
    productName: sale.productName || productSnapshot.name,
    productBrand: sale.productBrand || productSnapshot.brand || '',
    productImageUrl: sale.productImageUrl || productSnapshot.imageUrl || '',
    productSnapshot,
    quantity,
    unitPrice,
    unitCost,
    total,
    profit,
    status: normalizeText(sale.status) || 'pendente',
    notes: normalizeText(sale.notes),
    createdAt: sale.createdAt || new Date().toISOString(),
    updatedAt: sale.updatedAt || new Date().toISOString(),
  };
}

function normalizeHistoricalSales(sales) {
  let changed = false;
  const normalized = sales.map((sale) => {
    const nextSale = normalizeHistoricalSale(sale);
    if (JSON.stringify(nextSale) !== JSON.stringify(sale)) changed = true;
    return nextSale;
  });
  return { sales: normalized, changed };
}

export function getLabSales() {
  if (!canUseStorage()) return [];
  const stored = safeParse(window.localStorage.getItem(LAB_SALES_KEY));
  const rawSales = Array.isArray(stored) ? stored : [];
  const normalized = normalizeHistoricalSales(rawSales);
  if (normalized.changed) saveLabSales(normalized.sales);
  return normalized.sales;
}

export function saveLabSales(sales) {
  if (!canUseStorage()) return false;
  const normalized = normalizeHistoricalSales(Array.isArray(sales) ? sales : []);
  window.localStorage.setItem(LAB_SALES_KEY, JSON.stringify(normalized.sales));
  return true;
}

export function resetLabSales() {
  if (!canUseStorage()) return [];
  window.localStorage.setItem(LAB_SALES_KEY, JSON.stringify([]));
  return [];
}

export function createLabSale(draft, products) {
  const errors = [];
  const clientName = normalizeText(draft.clientName);
  const productId = normalizeText(draft.productId);
  const quantity = Math.max(1, Math.round(normalizeNumber(draft.quantity || 1)));
  const product = products.find((item) => item.id === productId);

  if (!clientName) errors.push('Informe o nome da cliente.');
  if (!product) errors.push('Selecione um produto LAB.');

  if (errors.length) {
    return {
      ok: false,
      errors,
      sales: getLabSales(),
    };
  }

  const unitPrice = normalizeNumber(draft.unitPrice || product.price);
  const unitCost = normalizeNumber(product.cost || 0);
  const total = unitPrice * quantity;
  const profit = Math.max(0, (unitPrice - unitCost) * quantity);
  const now = new Date().toISOString();
  const customer = buildCustomerSnapshot(draft, clientName);
  const productSnapshot = buildProductSnapshot(product, { unitPrice, unitCost, createdAt: now });

  const sale = normalizeHistoricalSale({
    id: createId('lab-sale'),
    schemaVersion: HISTORY_SCHEMA_VERSION,
    customerId: customer.id,
    customerName: customer.name,
    clientName: customer.name,
    phone: customer.phone,
    cpf: customer.cpf,
    customer,
    originalProductId: product.id,
    productId: product.id,
    productName: product.name,
    productBrand: product.brand || '',
    productImageUrl: product.imageUrl || '',
    productSnapshot,
    quantity,
    unitPrice,
    unitCost,
    total,
    profit,
    status: normalizeText(draft.status) || 'pendente',
    notes: normalizeText(draft.notes),
    createdAt: now,
    updatedAt: now,
  });

  const sales = [sale, ...getLabSales()];
  saveLabSales(sales);

  return {
    ok: true,
    errors: [],
    sale,
    sales,
  };
}

export function updateLabSaleStatus(saleId, status) {
  const sales = getLabSales().map((sale) => {
    if (sale.id !== saleId) return sale;
    return normalizeHistoricalSale({
      ...sale,
      status: normalizeText(status) || sale.status,
      updatedAt: new Date().toISOString(),
    });
  });

  saveLabSales(sales);
  return sales;
}

export function getSalesStats(sales = getLabSales()) {
  const totalSold = sales.reduce((sum, sale) => sum + Number(sale.total || 0), 0);
  const totalProfit = sales.reduce((sum, sale) => sum + Number(sale.profit || 0), 0);
  const paid = sales.filter((sale) => sale.status === 'pago').length;
  const pending = sales.filter((sale) => sale.status !== 'pago').length;

  return {
    count: sales.length,
    totalSold,
    totalProfit,
    paid,
    pending,
  };
}

export function getLabSalesStorageInfo() {
  return {
    key: LAB_SALES_KEY,
    mode: 'visitor-localStorage',
    schemaVersion: HISTORY_SCHEMA_VERSION,
    affectsRealSales: false,
    affectsFirebase: false,
  };
}
