function normalizeNumber(value) {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number : 0;
}

function toDate(value, fallback = new Date()) {
  const parsed = value ? new Date(value) : null;
  if (parsed && !Number.isNaN(parsed.getTime())) return parsed;
  return fallback;
}

function monthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(date) {
  return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).replace(/^./, (letter) => letter.toUpperCase());
}

function paymentDueDate(payment) {
  return toDate(payment.paidAt || payment.dueDate || payment.createdAt);
}

function saleDate(sale) {
  return toDate(sale.createdAt || sale.purchaseDate);
}

export function shiftReportMonth(baseDate, offset) {
  const date = new Date(baseDate);
  date.setMonth(date.getMonth() + offset);
  return date;
}

export function buildReportInsights({ sales = [], payments = [], selectedDate = new Date() } = {}) {
  const targetKey = monthKey(selectedDate);
  const monthlySales = sales.filter((sale) => monthKey(saleDate(sale)) === targetKey);
  const monthlyPayments = payments.filter((payment) => monthKey(paymentDueDate(payment)) === targetKey);
  const receivedPayments = monthlyPayments.filter((payment) => payment.status === 'pago');
  const pendingPayments = payments.filter((payment) => payment.status !== 'pago');

  const salesByCategoryMap = new Map();
  monthlySales.forEach((sale) => {
    const category = sale.productSnapshot?.category || sale.productCategory || 'Sem categoria';
    const current = salesByCategoryMap.get(category) || { category, count: 0, total: 0 };
    current.count += 1;
    current.total += normalizeNumber(sale.total);
    salesByCategoryMap.set(category, current);
  });

  const urgentCharges = pendingPayments
    .map((payment) => {
      const due = toDate(payment.dueDate || payment.createdAt);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      due.setHours(0, 0, 0, 0);
      const days = Math.ceil((due.getTime() - today.getTime()) / 86400000);
      return {
        ...payment,
        dueDateObj: due,
        daysUntilDue: days,
        urgent: days <= 7,
        overdue: days < 0,
      };
    })
    .filter((payment) => payment.urgent)
    .sort((a, b) => a.daysUntilDue - b.daysUntilDue)
    .slice(0, 8);

  const totalSold = monthlySales.reduce((sum, sale) => sum + normalizeNumber(sale.total), 0);
  const totalProfit = monthlySales.reduce((sum, sale) => sum + normalizeNumber(sale.profit), 0);
  const totalReceived = receivedPayments.reduce((sum, payment) => sum + normalizeNumber(payment.amount), 0);
  const totalToReceive = monthlyPayments
    .filter((payment) => payment.status !== 'pago')
    .reduce((sum, payment) => sum + normalizeNumber(payment.amount), 0);

  return {
    month: {
      key: targetKey,
      label: monthLabel(selectedDate),
      date: selectedDate.toISOString(),
    },
    stats: {
      salesCount: monthlySales.length,
      totalSold,
      totalReceived,
      totalToReceive,
      totalProfit,
    },
    salesByCategory: [...salesByCategoryMap.values()].sort((a, b) => b.total - a.total),
    receivedPayments: receivedPayments
      .sort((a, b) => String(b.paidAt || b.updatedAt || b.createdAt).localeCompare(String(a.paidAt || a.updatedAt || a.createdAt)))
      .slice(0, 10),
    urgentCharges,
  };
}
