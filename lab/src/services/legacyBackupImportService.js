import { saveLabProducts } from './labDataService.js';
import { saveLabPayments } from './labPaymentsService.js';
import { saveLabSales } from './labSalesService.js';

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

function normalizeNumber(value) {
  const number = Number(String(value || '0').replace(',', '.'));
  return Number.isFinite(number) ? Math.max(0, number) : 0;
}

function normalizeText(value) {
  return String(value || '').trim();
}

function maskName(name, index) {
  if (!name) return `Cliente ${index + 1}`;
  const first = String(name).trim().split(/\s+/)[0] || 'Cliente';
  return `${first} · Anônimo ${index + 1}`;
}

function maskPhone(phone, index) {
  if (!phone) return '';
  return `telefone-anonimo-${index + 1}`;
}

function maskCpf(cpf, index) {
  if (!cpf) return '';
  return `cpf-anonimo-${index + 1}`;
}

function buildProduct({ productId, price, saleIndex }) {
  const cleanId = normalizeText(productId) || `legacy-${saleIndex + 1}`;
  return {
    id: `legacy-prod-${cleanId}`,
    legacyProductId: cleanId,
    name: `Produto legado ${cleanId}`,
    brand: 'Backup Real',
    description: 'Produto criado no LAB a partir do backup real legado. Nome real depende do catálogo/fonte de produtos.',
    price: normalizeNumber(price),
    cost: 0,
    imageUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1100" viewBox="0 0 900 1100"><rect width="900" height="1100" fill="%23080808"/><rect x="34" y="34" width="832" height="1032" rx="70" fill="none" stroke="%23c9a84c" stroke-width="8" opacity="0.55"/><text x="450" y="510" text-anchor="middle" font-family="Georgia,serif" font-size="70" fill="%23f0e8dc">Backup</text><text x="450" y="590" text-anchor="middle" font-family="Arial,sans-serif" font-size="26" letter-spacing="10" fill="%23c9a84c">PRODUTO REAL</text></svg>',
    category: 'backup-real',
    catalogTabs: ['todos', 'backup-real'],
    visibleInCatalog: false,
    badge: 'Importado LAB',
    stock: 0,
    order: saleIndex + 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function getPagMeta(backup, productId, sale) {
  const directKey = `${productId}_${sale.sid}`;
  const indexKey = `${productId}_0`;
  const oneKey = `${productId}_1`;
  return backup.pagMeta?.[directKey] || backup.pagMeta?.[indexKey] || backup.pagMeta?.[oneKey] || {};
}

function convertLegacyBackup(backup, options = {}) {
  const anonymize = options.anonymize !== false;
  const prices = isObject(backup.prices) ? backup.prices : {};
  const salesByProduct = isObject(backup.sales) ? backup.sales : {};
  const productMap = new Map();
  const labSales = [];
  const labPayments = [];
  const skipped = [];
  let saleIndex = 0;

  Object.entries(salesByProduct).forEach(([productId, productSales]) => {
    if (productId === 'undefined') {
      skipped.push('Produto com ID undefined ignorado em sales.');
      return;
    }

    if (!Array.isArray(productSales)) {
      skipped.push(`Vendas do produto ${productId} ignoradas porque não são lista.`);
      return;
    }

    const price = normalizeNumber(prices[productId]);
    if (!productMap.has(productId)) {
      productMap.set(productId, buildProduct({ productId, price, saleIndex }));
    }

    productSales.forEach((sale, localIndex) => {
      const count = Math.max(1, Math.round(normalizeNumber(sale.count || sale.paid?.length || 1)));
      const quantity = Math.max(1, Math.round(normalizeNumber(sale.qty || 1)));
      const paidArray = Array.isArray(sale.paid) && sale.paid.length ? sale.paid : Array.from({ length: count }, () => false);
      const total = price * quantity;
      const meta = getPagMeta(backup, productId, sale);
      const saleId = `legacy-sale-${productId}-${sale.sid || localIndex}`;
      const clientIndex = saleIndex;
      const clientName = anonymize ? maskName(sale.name, clientIndex) : normalizeText(sale.name) || `Cliente ${clientIndex + 1}`;
      const phone = anonymize ? maskPhone(sale.phone, clientIndex) : normalizeText(sale.phone);
      const cpf = anonymize ? maskCpf(sale.cpf, clientIndex) : normalizeText(sale.cpf);
      const paidCount = paidArray.filter(Boolean).length;

      labSales.push({
        id: saleId,
        legacyProductId: productId,
        legacySid: normalizeText(sale.sid),
        clientName,
        phone,
        cpf,
        productId: `legacy-prod-${productId}`,
        productName: `Produto legado ${productId}`,
        quantity,
        unitPrice: price,
        total,
        profit: 0,
        status: paidCount === paidArray.length ? 'pago' : 'pendente',
        notes: normalizeText(meta.obs),
        purchaseDate: sale.purchaseDate || meta.date || '',
        dueDate: meta.venc || '',
        installmentsTotal: paidArray.length,
        createdAt: sale.purchaseDate ? `${sale.purchaseDate}T00:00:00.000Z` : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      paidArray.forEach((paid, installmentIndex) => {
        labPayments.push({
          id: `legacy-pay-${productId}-${sale.sid || localIndex}-${installmentIndex + 1}`,
          saleId,
          saleClientName: clientName,
          saleProductName: `Produto legado ${productId}`,
          installmentNumber: installmentIndex + 1,
          installmentsTotal: paidArray.length,
          amount: paidArray.length ? total / paidArray.length : total,
          status: paid ? 'pago' : 'pendente',
          paidAt: meta.parcHist?.[installmentIndex] || '',
          dueDate: meta.venc || '',
          notes: normalizeText(meta.obs),
          legacyProductId: productId,
          legacySid: normalizeText(sale.sid),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      });

      saleIndex += 1;
    });
  });

  Object.entries(prices).forEach(([productId, price], index) => {
    if (productId === 'undefined') {
      skipped.push('Preço com chave undefined ignorado.');
      return;
    }
    if (!productMap.has(productId)) {
      productMap.set(productId, buildProduct({ productId, price, saleIndex: productMap.size + index }));
    }
  });

  return {
    products: Array.from(productMap.values()),
    sales: labSales,
    payments: labPayments,
    skipped,
    anonymized: anonymize,
  };
}

export function importLegacyBackupToLab(text, options = {}) {
  const backup = safeParse(text);
  if (!backup || !isObject(backup.sales) || !isObject(backup.prices)) {
    return {
      ok: false,
      error: 'Backup real inválido para importação LAB.',
    };
  }

  const converted = convertLegacyBackup(backup, options);
  saveLabProducts(converted.products);
  saveLabSales(converted.sales);
  saveLabPayments(converted.payments);

  return {
    ok: true,
    ...converted,
    counts: {
      products: converted.products.length,
      sales: converted.sales.length,
      payments: converted.payments.length,
      skipped: converted.skipped.length,
    },
  };
}
