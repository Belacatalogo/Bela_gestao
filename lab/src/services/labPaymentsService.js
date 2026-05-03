const LAB_PAYMENTS_KEY = 'belaGestaoLab.payments.v1';
const PAYMENT_SCHEMA_VERSION = 'history-v1';

function safeParse(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function canUseStorage() {
  try {
    const testKey = 'belaGestaoLab.paymentsStorageTest';
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

function createPaymentId(saleId, installmentNumber) {
  return `lab-pay-${saleId}-${installmentNumber}`;
}

function normalizePayment(payment) {
  if (!payment || typeof payment !== 'object') return payment;
  const saleSnapshot = payment.saleSnapshot || {
    id: payment.saleId || '',
    clientName: payment.saleClientName || payment.clientName || payment.customerName || '',
    customerId: payment.customerId || '',
    productName: payment.saleProductName || payment.productName || '',
    productId: payment.originalProductId || payment.productId || '',
    total: normalizeNumber(payment.saleTotal || payment.total || payment.amount),
  };

  return {
    ...payment,
    schemaVersion: payment.schemaVersion || PAYMENT_SCHEMA_VERSION,
    saleId: payment.saleId || saleSnapshot.id || '',
    customerId: payment.customerId || saleSnapshot.customerId || '',
    saleClientName: payment.saleClientName || saleSnapshot.clientName || 'Cliente sem nome',
    saleProductName: payment.saleProductName || saleSnapshot.productName || 'Produto removido',
    originalProductId: payment.originalProductId || saleSnapshot.productId || payment.productId || '',
    saleSnapshot,
    installmentNumber: Math.max(1, Math.round(normalizeNumber(payment.installmentNumber || 1))),
    installmentsTotal: Math.max(1, Math.round(normalizeNumber(payment.installmentsTotal || 1))),
    amount: normalizeNumber(payment.amount),
    status: payment.status === 'pago' ? 'pago' : 'pendente',
    paidAt: normalizeText(payment.paidAt),
    dueDate: normalizeText(payment.dueDate),
    notes: normalizeText(payment.notes),
    createdAt: payment.createdAt || new Date().toISOString(),
    updatedAt: payment.updatedAt || new Date().toISOString(),
  };
}

function normalizePayments(payments) {
  let changed = false;
  const normalized = payments.map((payment) => {
    const nextPayment = normalizePayment(payment);
    if (JSON.stringify(nextPayment) !== JSON.stringify(payment)) changed = true;
    return nextPayment;
  });
  return { payments: normalized, changed };
}

export function getLabPayments() {
  if (!canUseStorage()) return [];
  const stored = safeParse(window.localStorage.getItem(LAB_PAYMENTS_KEY));
  const rawPayments = Array.isArray(stored) ? stored : [];
  const normalized = normalizePayments(rawPayments);
  if (normalized.changed) saveLabPayments(normalized.payments);
  return normalized.payments;
}

export function saveLabPayments(payments) {
  if (!canUseStorage()) return false;
  const normalized = normalizePayments(Array.isArray(payments) ? payments : []);
  window.localStorage.setItem(LAB_PAYMENTS_KEY, JSON.stringify(normalized.payments));
  return true;
}

export function resetLabPayments() {
  if (!canUseStorage()) return [];
  window.localStorage.setItem(LAB_PAYMENTS_KEY, JSON.stringify([]));
  return [];
}

function paymentFromSale(sale, installmentNumber = 1, installmentsTotal = 1) {
  const now = new Date().toISOString();
  const amount = normalizeNumber(sale.total) / Math.max(1, installmentsTotal);
  const saleSnapshot = {
    id: sale.id,
    clientName: sale.clientName || sale.customerName || sale.customer?.name || '',
    customerId: sale.customerId || sale.customer?.id || '',
    productName: sale.productName || sale.productSnapshot?.name || 'Produto removido',
    productId: sale.originalProductId || sale.productId || sale.productSnapshot?.id || '',
    total: normalizeNumber(sale.total),
    quantity: sale.quantity || 1,
    unitPrice: sale.unitPrice || 0,
    createdAt: sale.createdAt || now,
  };

  return normalizePayment({
    id: createPaymentId(sale.id, installmentNumber),
    saleId: sale.id,
    customerId: saleSnapshot.customerId,
    saleClientName: saleSnapshot.clientName,
    saleProductName: saleSnapshot.productName,
    originalProductId: saleSnapshot.productId,
    saleSnapshot,
    installmentNumber,
    installmentsTotal,
    amount,
    status: sale.status === 'pago' ? 'pago' : 'pendente',
    paidAt: sale.status === 'pago' ? now : '',
    dueDate: sale.dueDate || '',
    notes: sale.notes || '',
    createdAt: now,
    updatedAt: now,
  });
}

export function ensurePaymentForSale(sale) {
  if (!sale?.id) {
    return {
      ok: false,
      payments: getLabPayments(),
      error: 'Venda LAB inválida para gerar pagamento.',
    };
  }

  const payments = getLabPayments();
  const alreadyExists = payments.some((payment) => payment.saleId === sale.id);

  if (alreadyExists) {
    return {
      ok: true,
      payments,
      created: false,
    };
  }

  const payment = paymentFromSale(sale, 1, Math.max(1, Number(sale.installmentsTotal || 1)));
  const nextPayments = [payment, ...payments];
  saveLabPayments(nextPayments);

  return {
    ok: true,
    payments: nextPayments,
    payment,
    created: true,
  };
}

export function syncPaymentsFromSales(sales) {
  let payments = getLabPayments();
  let changed = false;

  sales.forEach((sale) => {
    if (!payments.some((payment) => payment.saleId === sale.id)) {
      payments = [paymentFromSale(sale), ...payments];
      changed = true;
    }
  });

  const normalized = normalizePayments(payments);
  if (changed || normalized.changed) saveLabPayments(normalized.payments);
  return normalized.payments;
}

export function updateLabPaymentStatus(paymentId, status) {
  const now = new Date().toISOString();
  const normalizedStatus = status === 'pago' ? 'pago' : 'pendente';

  const payments = getLabPayments().map((payment) => {
    if (payment.id !== paymentId) return payment;
    return normalizePayment({
      ...payment,
      status: normalizedStatus,
      paidAt: normalizedStatus === 'pago' ? now : '',
      updatedAt: now,
    });
  });

  saveLabPayments(payments);
  return payments;
}

export function getPaymentStats(payments = getLabPayments()) {
  const totalAmount = payments.reduce((sum, payment) => sum + normalizeNumber(payment.amount), 0);
  const paidAmount = payments
    .filter((payment) => payment.status === 'pago')
    .reduce((sum, payment) => sum + normalizeNumber(payment.amount), 0);
  const pendingAmount = Math.max(0, totalAmount - paidAmount);
  const paidCount = payments.filter((payment) => payment.status === 'pago').length;
  const pendingCount = payments.filter((payment) => payment.status !== 'pago').length;

  return {
    count: payments.length,
    totalAmount,
    paidAmount,
    pendingAmount,
    paidCount,
    pendingCount,
  };
}

export function getLabPaymentsStorageInfo() {
  return {
    key: LAB_PAYMENTS_KEY,
    mode: 'visitor-localStorage',
    schemaVersion: PAYMENT_SCHEMA_VERSION,
    affectsRealPayments: false,
    affectsFirebase: false,
  };
}
