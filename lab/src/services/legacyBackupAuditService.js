const LEGACY_REQUIRED_KEYS = ['version', 'exportedAt', 'prices', 'sold', 'sales', 'pagMeta'];

function safeParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function isObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value);
}

function countSales(sales) {
  if (!isObject(sales)) return 0;
  return Object.values(sales).reduce((total, productSales) => total + (Array.isArray(productSales) ? productSales.length : 0), 0);
}

function countInstallments(sales) {
  const result = { total: 0, paid: 0, pending: 0 };
  if (!isObject(sales)) return result;

  Object.values(sales).forEach((productSales) => {
    if (!Array.isArray(productSales)) return;
    productSales.forEach((sale) => {
      const paidArray = Array.isArray(sale?.paid) ? sale.paid : [];
      result.total += paidArray.length;
      result.paid += paidArray.filter(Boolean).length;
      result.pending += paidArray.filter((paid) => !paid).length;
    });
  });

  return result;
}

function collectSaleFieldStats(sales) {
  const fields = new Set();
  const missing = {
    name: 0,
    phone: 0,
    cpf: 0,
    sid: 0,
    paid: 0,
    count: 0,
    purchaseDate: 0,
    qty: 0,
  };

  if (!isObject(sales)) return { fields: [], missing };

  Object.values(sales).forEach((productSales) => {
    if (!Array.isArray(productSales)) return;
    productSales.forEach((sale) => {
      Object.keys(sale || {}).forEach((field) => fields.add(field));
      Object.keys(missing).forEach((field) => {
        if (sale?.[field] === undefined || sale?.[field] === '') missing[field] += 1;
      });
    });
  });

  return {
    fields: Array.from(fields).sort(),
    missing,
  };
}

function collectPagMetaStats(pagMeta) {
  const fields = new Set();
  let withDueDate = 0;
  let withObs = 0;
  let withDate = 0;
  let withParcelHistory = 0;

  if (!isObject(pagMeta)) {
    return { fields: [], withDueDate, withObs, withDate, withParcelHistory };
  }

  Object.values(pagMeta).forEach((meta) => {
    if (!isObject(meta)) return;
    Object.keys(meta).forEach((field) => fields.add(field));
    if (meta.venc) withDueDate += 1;
    if (meta.obs) withObs += 1;
    if (meta.date) withDate += 1;
    if (isObject(meta.parcHist)) withParcelHistory += 1;
  });

  return {
    fields: Array.from(fields).sort(),
    withDueDate,
    withObs,
    withDate,
    withParcelHistory,
  };
}

function detectSensitiveData(sales) {
  let names = 0;
  let phones = 0;
  let cpfs = 0;

  if (!isObject(sales)) return { names, phones, cpfs };

  Object.values(sales).forEach((productSales) => {
    if (!Array.isArray(productSales)) return;
    productSales.forEach((sale) => {
      if (sale?.name) names += 1;
      if (sale?.phone) phones += 1;
      if (sale?.cpf) cpfs += 1;
    });
  });

  return { names, phones, cpfs };
}

function buildWarnings({ backup, missingKeys, priceIds, saleProductIds, pagMetaKeys }) {
  const warnings = [];

  if (missingKeys.length) warnings.push(`Chaves obrigatórias ausentes: ${missingKeys.join(', ')}.`);
  if (!priceIds.length) warnings.push('Nenhum preço encontrado em prices.');
  if (!saleProductIds.length) warnings.push('Nenhuma venda encontrada em sales.');
  if (!pagMetaKeys.length) warnings.push('Nenhum metadado de pagamento encontrado em pagMeta.');
  if (isObject(backup.prices) && Object.prototype.hasOwnProperty.call(backup.prices, 'undefined')) {
    warnings.push('Existe preço associado à chave undefined; precisa de tratamento no adaptador.');
  }

  return warnings;
}

export function auditLegacyBackupText(text) {
  const backup = safeParse(text);

  if (!backup) {
    return {
      ok: false,
      error: 'JSON inválido ou ilegível.',
    };
  }

  const presentKeys = Object.keys(backup).sort();
  const missingKeys = LEGACY_REQUIRED_KEYS.filter((key) => backup[key] === undefined);
  const priceIds = isObject(backup.prices) ? Object.keys(backup.prices) : [];
  const soldIds = isObject(backup.sold) ? Object.keys(backup.sold) : [];
  const saleProductIds = isObject(backup.sales) ? Object.keys(backup.sales) : [];
  const pagMetaKeys = isObject(backup.pagMeta) ? Object.keys(backup.pagMeta) : [];
  const installments = countInstallments(backup.sales);

  return {
    ok: true,
    type: 'legacy-bela-backup',
    version: backup.version ?? 'desconhecida',
    exportedAt: backup.exportedAt || '',
    presentKeys,
    missingKeys,
    counts: {
      prices: priceIds.length,
      soldFlags: soldIds.length,
      saleProductIds: saleProductIds.length,
      sales: countSales(backup.sales),
      pagMeta: pagMetaKeys.length,
      installmentsTotal: installments.total,
      installmentsPaid: installments.paid,
      installmentsPending: installments.pending,
    },
    saleFields: collectSaleFieldStats(backup.sales),
    pagMetaFields: collectPagMetaStats(backup.pagMeta),
    sensitive: detectSensitiveData(backup.sales),
    compatibility: {
      canMapPrices: isObject(backup.prices),
      canMapSoldFlags: isObject(backup.sold),
      canMapSales: isObject(backup.sales),
      canMapPayments: isObject(backup.pagMeta),
      needsProductCatalogSource: true,
      canImportToLabAfterReview: missingKeys.length === 0 && isObject(backup.sales),
    },
    warnings: buildWarnings({ backup, missingKeys, priceIds, saleProductIds, pagMetaKeys }),
  };
}

export function summarizeLegacyAudit(report) {
  if (!report?.ok) return 'Backup real não pôde ser lido.';

  return [
    `Versão real: ${report.version}`,
    `Preços: ${report.counts.prices}`,
    `Produtos com venda: ${report.counts.saleProductIds}`,
    `Vendas: ${report.counts.sales}`,
    `Parcelas: ${report.counts.installmentsTotal}`,
    `Pagas: ${report.counts.installmentsPaid}`,
    `Pendentes: ${report.counts.installmentsPending}`,
    `Metadados de pagamento: ${report.counts.pagMeta}`,
  ].join(' · ');
}
