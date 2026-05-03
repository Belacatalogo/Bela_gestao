function normalizeText(value) {
  return String(value || '').trim();
}

function normalizeNumber(value) {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number : 0;
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function toDate(value, fallback = new Date()) {
  const parsed = value ? new Date(value) : null;
  if (parsed && !Number.isNaN(parsed.getTime())) return parsed;
  return fallback;
}

function daysUntil(date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / 86400000);
}

function initials(name) {
  const parts = normalizeText(name).split(/\s+/).filter(Boolean);
  if (!parts.length) return 'CL';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function fallbackDueDate(payment) {
  const base = toDate(payment.saleSnapshot?.createdAt || payment.createdAt);
  const installment = Math.max(1, Number(payment.installmentNumber || 1));
  return addDays(base, installment * 21);
}

export function buildPaymentInsights({ payments = [], sales = [] } = {}) {
  const saleMap = new Map(sales.map((sale) => [sale.id, sale]));
  const enriched = payments.map((payment) => {
    const sale = saleMap.get(payment.saleId) || payment.saleSnapshot || {};
    const clientName = normalizeText(payment.saleClientName || sale.clientName || sale.customerName || 'Cliente sem nome');
    const productName = normalizeText(payment.saleProductName || sale.productName || 'Produto removido');
    const dueDate = toDate(payment.dueDate, fallbackDueDate(payment));
    const days = daysUntil(dueDate);
    const status = payment.status === 'pago' ? 'pago' : 'pendente';
    const amount = normalizeNumber(payment.amount);
    const total = normalizeNumber(payment.saleSnapshot?.total || sale.total || amount);
    const paidAmount = status === 'pago' ? amount : 0;
    const pendingAmount = status === 'pago' ? 0 : amount;

    return {
      ...payment,
      clientName,
      productName,
      initials: initials(clientName),
      amount,
      total,
      paidAmount,
      pendingAmount,
      dueDateIso: dueDate.toISOString(),
      dueDateLabel: dueDate.toLocaleDateString('pt-BR'),
      daysUntilDue: days,
      isOverdue: status !== 'pago' && days < 0,
      dueSoon: status !== 'pago' && days >= 0 && days <= 7,
      isInstallment: Number(payment.installmentsTotal || 1) > 1,
      phone: normalizeText(sale.phone || sale.customer?.phone || ''),
      purchaseDate: toDate(sale.createdAt || payment.saleSnapshot?.createdAt || payment.createdAt).toLocaleDateString('pt-BR'),
      paymentMethod: normalizeText(payment.paymentMethod || ''),
    };
  });

  const clients = new Set(enriched.map((payment) => payment.clientName).filter(Boolean));
  const pending = enriched.filter((payment) => payment.status !== 'pago');
  const paid = enriched.filter((payment) => payment.status === 'pago');
  const overdue = pending.filter((payment) => payment.isOverdue);
  const due7 = pending.filter((payment) => payment.dueSoon);
  const totalToReceive = pending.reduce((sum, payment) => sum + payment.amount, 0);
  const totalReceived = paid.reduce((sum, payment) => sum + payment.amount, 0);

  return {
    payments: enriched,
    stats: {
      clients: clients.size,
      overdue: overdue.length,
      due7: due7.length,
      totalToReceive,
      totalReceived,
      pendingCount: pending.length,
      paidCount: paid.length,
      dueThisWeek: due7.length,
    },
  };
}

export function filterPaymentInsights(payments, filters = {}) {
  const query = normalizeText(filters.query).toLowerCase();
  const mode = filters.mode || 'todos';
  const sort = filters.sort || 'vencimento';

  let filtered = payments.filter((payment) => {
    const haystack = [payment.clientName, payment.productName, payment.phone]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    const matchesQuery = !query || haystack.includes(query);
    const matchesMode =
      mode === 'todos' ||
      (mode === 'pendentes' && payment.status !== 'pago') ||
      (mode === 'atraso' && payment.isOverdue) ||
      (mode === 'vence7' && payment.dueSoon) ||
      (mode === 'parceladas' && payment.isInstallment) ||
      (mode === 'quitadas' && payment.status === 'pago');
    return matchesQuery && matchesMode;
  });

  filtered = filtered.sort((a, b) => {
    if (sort === 'maior-atraso') return a.daysUntilDue - b.daysUntilDue;
    if (sort === 'maior-valor') return b.amount - a.amount;
    if (sort === 'nome') return a.clientName.localeCompare(b.clientName, 'pt-BR');
    return new Date(a.dueDateIso).getTime() - new Date(b.dueDateIso).getTime();
  });

  return filtered;
}

export function buildWhatsAppChargeLink(payment) {
  const phone = normalizeText(payment.phone).replace(/\D/g, '');
  const message = `Oi, ${payment.clientName}! Passando para lembrar do pagamento de ${payment.productName}, no valor de R$ ${payment.amount.toFixed(2).replace('.', ',')}.`;
  const encoded = encodeURIComponent(message);
  return phone ? `https://wa.me/55${phone.replace(/^55/, '')}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
}
