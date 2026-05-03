function normalizeText(value) {
  return String(value || '').trim();
}

function normalizeNumber(value) {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number : 0;
}

function initials(name) {
  const parts = normalizeText(name).split(/\s+/).filter(Boolean);
  if (!parts.length) return 'CL';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function clientKeyFromSale(sale) {
  return sale.customerId || sale.customer?.id || sale.phone || sale.cpf || sale.clientName || sale.customerName || sale.id;
}

function getSaleClientName(sale) {
  return normalizeText(sale.clientName || sale.customerName || sale.customer?.name || 'Cliente sem nome');
}

function getPaymentStatusForSale(payments, saleId) {
  const linked = payments.filter((payment) => payment.saleId === saleId);
  if (!linked.length) return { paid: 0, pending: 0, pendingAmount: 0, paidAmount: 0 };
  return linked.reduce((summary, payment) => {
    const amount = normalizeNumber(payment.amount);
    if (payment.status === 'pago') {
      summary.paid += 1;
      summary.paidAmount += amount;
    } else {
      summary.pending += 1;
      summary.pendingAmount += amount;
    }
    return summary;
  }, { paid: 0, pending: 0, pendingAmount: 0, paidAmount: 0 });
}

function buildBaseClient(sale) {
  const name = getSaleClientName(sale);
  return {
    id: clientKeyFromSale(sale),
    name,
    initials: initials(name),
    phone: normalizeText(sale.phone || sale.customer?.phone || ''),
    cpf: normalizeText(sale.cpf || sale.customer?.cpf || ''),
    totalSpent: 0,
    pendingAmount: 0,
    paidAmount: 0,
    purchases: 0,
    pendingCount: 0,
    paidCount: 0,
    products: new Map(),
    sales: [],
    lastPurchaseAt: '',
    vip: false,
    loyal: false,
    missing: false,
    birthday: '',
    rating: 0,
  };
}

export function buildClientInsights({ sales = [], payments = [] } = {}) {
  const clientsMap = new Map();

  sales.forEach((sale) => {
    const key = clientKeyFromSale(sale);
    if (!key) return;
    if (!clientsMap.has(key)) clientsMap.set(key, buildBaseClient(sale));

    const client = clientsMap.get(key);
    const saleTotal = normalizeNumber(sale.total);
    const status = getPaymentStatusForSale(payments, sale.id);
    const productName = normalizeText(sale.productName || sale.productSnapshot?.name || 'Produto removido');

    client.totalSpent += saleTotal;
    client.pendingAmount += status.pendingAmount;
    client.paidAmount += status.paidAmount || (sale.status === 'pago' ? saleTotal : 0);
    client.pendingCount += status.pending || (sale.status !== 'pago' ? 1 : 0);
    client.paidCount += status.paid || (sale.status === 'pago' ? 1 : 0);
    client.purchases += 1;
    client.sales.push(sale);

    if (productName) {
      const current = client.products.get(productName) || { name: productName, count: 0, total: 0 };
      current.count += 1;
      current.total += saleTotal;
      client.products.set(productName, current);
    }

    if (!client.lastPurchaseAt || String(sale.createdAt || '') > client.lastPurchaseAt) {
      client.lastPurchaseAt = sale.createdAt || '';
    }
  });

  const clients = [...clientsMap.values()].map((client) => {
    const favoriteProduct = [...client.products.values()].sort((a, b) => b.count - a.count || b.total - a.total)[0] || null;
    const ticketAverage = client.purchases ? client.totalSpent / client.purchases : 0;
    return {
      ...client,
      products: [...client.products.values()],
      favoriteProduct,
      ticketAverage,
      vip: client.totalSpent >= 500 || client.purchases >= 5,
      loyal: client.purchases >= 3,
      missing: Boolean(client.lastPurchaseAt && Date.now() - new Date(client.lastPurchaseAt).getTime() > 1000 * 60 * 60 * 24 * 60),
    };
  });

  const totalClients = clients.length;
  const pendingClients = clients.filter((client) => client.pendingCount > 0).length;
  const vipClients = clients.filter((client) => client.vip).length;
  const missingClients = clients.filter((client) => client.missing).length;
  const birthdayClients = clients.filter((client) => client.birthday).length;
  const topClients = [...clients].sort((a, b) => b.totalSpent - a.totalSpent || b.purchases - a.purchases).slice(0, 5);

  return {
    clients,
    topClients,
    stats: {
      totalClients,
      pendingClients,
      vipClients,
      missingClients,
      birthdayClients,
      totalSpent: clients.reduce((sum, client) => sum + client.totalSpent, 0),
      pendingAmount: clients.reduce((sum, client) => sum + client.pendingAmount, 0),
      paidAmount: clients.reduce((sum, client) => sum + client.paidAmount, 0),
    },
  };
}

export function filterClientInsights(clients, filters = {}) {
  const query = normalizeText(filters.query).toLowerCase();
  const mode = filters.mode || 'todas';
  const sort = filters.sort || 'az';

  let filtered = clients.filter((client) => {
    const haystack = [client.name, client.phone, client.cpf, client.favoriteProduct?.name]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    const matchesQuery = !query || haystack.includes(query);
    const matchesMode =
      mode === 'todas' ||
      (mode === 'pendente' && client.pendingCount > 0) ||
      (mode === 'quitadas' && client.pendingCount === 0 && client.purchases > 0) ||
      (mode === 'vip' && client.vip) ||
      (mode === 'fiel' && client.loyal);
    return matchesQuery && matchesMode;
  });

  filtered = filtered.sort((a, b) => {
    if (sort === 'mais-gasto') return b.totalSpent - a.totalSpent;
    if (sort === 'mais-compras') return b.purchases - a.purchases;
    if (sort === 'recentes') return String(b.lastPurchaseAt || '').localeCompare(String(a.lastPurchaseAt || ''));
    if (sort === 'avaliacao') return b.rating - a.rating;
    return a.name.localeCompare(b.name, 'pt-BR');
  });

  return filtered;
}
