const LAB_PAYMENTS_KEY = 'belaGestaoLab.payments.v1';

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

function createPaymentId(saleId, installmentNumber) {
  return `lab-pay-${saleId}-${installmentNumber}`;
}

export function getLabPayments() {
  if (!canUseStorage()) return [];
  const stored = safeParse(window.localStorage.getItem(LAB_PAYMENTS_KEY));
  return Array.isArray(stored) ? stored : [];
}

export function saveLabPayments(payments) {
  if (!canUseStorage()) return false;
  window.localStorage.setItem(LAB_PAYMENTS_KEY, JSON.stringify(payments));
  return true;
}

export function resetLabPayments() {
  if (!canUseStorage()) return [];
  window.localStorage.setItem(LAB_PAYMENTS_KEY, JSON.stringify([]));
  return [];
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

  const now = new Date().toISOString();
  const payment = {
    id: createPaymentId(sale.id, 1),
    saleId: sale.id,
    saleClientName: sale.clientName,
    saleProductName: sale.productName,
    installmentNumber: 1,
    installmentsTotal: 1,
    amount: normalizeNumber(sale.total),
    status: sale.status === 'pago' ? 'pago' : 'pendente',
    paidAt: sale.status === 'pago' ? now : '',
    dueDate: '',
    notes: sale.notes || '',
    createdAt: now,
    updatedAt: now,
  };

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
      const now = new Date().toISOString();
      payments = [
        {
          id: createPaymentId(sale.id, 1),
          saleId: sale.id,
          saleClientName: sale.clientName,
          saleProductName: sale.productName,
          installmentNumber: 1,
          installmentsTotal: 1,
          amount: normalizeNumber(sale.total),
          status: sale.status === 'pago' ? 'pago' : 'pendente',
          paidAt: sale.status === 'pago' ? now : '',
          dueDate: '',
          notes: sale.notes || '',
          createdAt: now,
          updatedAt: now,
        },
        ...payments,
      ];
      changed = true;
    }
  });

  if (changed) saveLabPayments(payments);
  return payments;
}

export function updateLabPaymentStatus(paymentId, status) {
  const now = new Date().toISOString();
  const normalizedStatus = status === 'pago' ? 'pago' : 'pendente';

  const payments = getLabPayments().map((payment) => {
    if (payment.id !== paymentId) return payment;
    return {
      ...payment,
      status: normalizedStatus,
      paidAt: normalizedStatus === 'pago' ? now : '',
      updatedAt: now,
    };
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
    affectsRealPayments: false,
    affectsFirebase: false,
  };
}
