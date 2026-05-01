import { createId } from '../utils/ids.js';

const LAB_SALES_KEY = 'belaGestaoLab.sales.v1';

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

export function getLabSales() {
  if (!canUseStorage()) return [];
  const stored = safeParse(window.localStorage.getItem(LAB_SALES_KEY));
  return Array.isArray(stored) ? stored : [];
}

export function saveLabSales(sales) {
  if (!canUseStorage()) return false;
  window.localStorage.setItem(LAB_SALES_KEY, JSON.stringify(sales));
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

  const sale = {
    id: createId('lab-sale'),
    clientName,
    productId: product.id,
    productName: product.name,
    quantity,
    unitPrice,
    total,
    profit,
    status: normalizeText(draft.status) || 'pendente',
    notes: normalizeText(draft.notes),
    createdAt: now,
    updatedAt: now,
  };

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
    return {
      ...sale,
      status: normalizeText(status) || sale.status,
      updatedAt: new Date().toISOString(),
    };
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
    affectsRealSales: false,
    affectsFirebase: false,
  };
}
