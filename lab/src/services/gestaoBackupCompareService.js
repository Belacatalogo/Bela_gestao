import { getCatalogBackupAnalysis } from './catalogBackupLabService.js';

const GESTAO_BACKUP_KEY = 'belaGestaoLab.gestaoBackup.v1';
const COMPARE_KEY = 'belaGestaoLab.catalogGestaoCompare.v1';

function canUseStorage() {
  try {
    const key = 'belaGestaoLab.compareStorageTest';
    window.localStorage.setItem(key, '1');
    window.localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

function safeParse(value, fallback = null) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function normalizeText(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function displayText(value) {
  return String(value || '').trim();
}

function numericPrice(value) {
  if (typeof value === 'number') return value;
  const clean = String(value || '').replace(/[^0-9,.-]/g, '').replace('.', '').replace(',', '.');
  const parsed = Number(clean);
  return Number.isFinite(parsed) ? parsed : null;
}

function firstArray(...items) {
  return items.find((item) => Array.isArray(item)) || [];
}

function extractGestaoProducts(payload) {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object') return [];

  return firstArray(
    payload.products,
    payload.produtos,
    payload.prices,
    payload.precos,
    payload.catalogProducts,
    payload.data?.products,
    payload.data?.produtos,
    payload.data?.prices,
    payload.backup?.products,
    payload.backup?.produtos,
    payload.backup?.prices,
    payload.lab?.products
  );
}

function extractGestaoSales(payload) {
  if (!payload || typeof payload !== 'object') return [];
  return firstArray(payload.sales, payload.vendas, payload.sold, payload.data?.sales, payload.data?.vendas, payload.backup?.sales, payload.backup?.vendas);
}

function extractGestaoClients(payload) {
  if (!payload || typeof payload !== 'object') return [];
  return firstArray(payload.clients, payload.clientes, payload.customers, payload.compradoras, payload.data?.clients, payload.data?.clientes);
}

function extractGestaoPayments(payload) {
  if (!payload || typeof payload !== 'object') return [];
  return firstArray(payload.payments, payload.pagamentos, payload.parcelas, payload.pagMeta, payload.data?.payments, payload.data?.pagamentos);
}

function normalizeGestaoProduct(raw, index) {
  const name = displayText(raw.name || raw.nome || raw.title || raw.titulo || raw.productName || raw.produto || raw.item);
  const brand = displayText(raw.brand || raw.marca || raw.productBrand || raw.loja);
  const description = displayText(raw.description || raw.descricao || raw.sub || raw.volume || raw.details || raw.obs);
  const priceRaw = raw.price ?? raw.preco ?? raw.valor ?? raw.salePrice ?? raw.valorVenda ?? raw.sellPrice ?? '';
  const imageUrl = displayText(raw.imageUrl || raw.image || raw.img || raw.foto || raw.photo || raw.url || raw.imagem);
  const category = displayText(raw.category || raw.categoria || raw.tab || raw.aba || raw.tipo || 'gestao');

  return {
    id: displayText(raw.id || raw.slug || raw.sku || raw.codigo || `gestao-backup-${index + 1}`),
    name,
    brand,
    description,
    price: priceRaw,
    priceNumber: numericPrice(priceRaw),
    imageUrl,
    category,
    key: makeProductKey({ name, brand }),
    raw,
  };
}

function makeProductKey(product) {
  return [normalizeText(product.brand), normalizeText(product.name)].filter(Boolean).join(' ');
}

function tokenSet(value) {
  return new Set(normalizeText(value).split(' ').filter((token) => token.length >= 3));
}

function similarity(a, b) {
  const tokensA = tokenSet(`${a.brand || ''} ${a.name || ''} ${a.description || ''}`);
  const tokensB = tokenSet(`${b.brand || ''} ${b.name || ''} ${b.description || ''}`);
  if (!tokensA.size || !tokensB.size) return 0;
  let intersection = 0;
  tokensA.forEach((token) => {
    if (tokensB.has(token)) intersection += 1;
  });
  return intersection / Math.max(tokensA.size, tokensB.size);
}

function normalizeCatalogProduct(product, index) {
  const name = displayText(product.name || product.nome || product.title || product.titulo || product.productName);
  const brand = displayText(product.brand || product.marca || product.productBrand);
  const description = displayText(product.description || product.descricao || product.sub || product.volume || product.details);
  const priceRaw = product.price ?? product.preco ?? product.valor ?? product.salePrice ?? '';
  const imageUrl = displayText(product.imageUrl || product.image || product.img || product.foto || product.photo || product.url);
  const category = displayText(product.category || product.categoria || product.tab || product.aba || 'catalogo');
  return {
    id: displayText(product.id || product.slug || product.sku || `catalog-backup-${index + 1}`),
    name,
    brand,
    description,
    price: priceRaw,
    priceNumber: numericPrice(priceRaw),
    imageUrl,
    category,
    key: makeProductKey({ name, brand }),
    raw: product.raw || product,
  };
}

export function analyzeGestaoBackupPayload(payload) {
  const products = extractGestaoProducts(payload).map(normalizeGestaoProduct).filter((product) => product.name || product.imageUrl);
  const sales = extractGestaoSales(payload);
  const clients = extractGestaoClients(payload);
  const payments = extractGestaoPayments(payload);

  return {
    ok: products.length > 0 || sales.length > 0 || clients.length > 0 || payments.length > 0,
    products,
    totalProducts: products.length,
    withImage: products.filter((product) => product.imageUrl).length,
    withPrice: products.filter((product) => product.price !== '' && product.price !== null && product.price !== undefined).length,
    salesCount: sales.length,
    clientsCount: clients.length,
    paymentsCount: payments.length,
    sourceKeys: payload && typeof payload === 'object' && !Array.isArray(payload) ? Object.keys(payload).slice(0, 30) : [],
  };
}

export async function readGestaoBackupFile(file) {
  if (!file) return { ok: false, error: 'Selecione o JSON do backup real do Gestão.' };
  const text = await file.text();
  const payload = safeParse(text, null);
  if (!payload) return { ok: false, error: 'Arquivo inválido. O backup do Gestão precisa ser um JSON válido.' };
  const analysis = analyzeGestaoBackupPayload(payload);
  if (!analysis.ok) return { ok: false, error: 'JSON lido, mas nenhum dado reconhecido do Gestão foi encontrado.', analysis };
  return { ok: true, analysis };
}

export function saveGestaoBackupAnalysis(analysis, sourceName = 'gestao-backup.json') {
  if (!canUseStorage()) return { ok: false, error: 'localStorage indisponível.' };
  const record = { sourceName, savedAt: new Date().toISOString(), analysis };
  window.localStorage.setItem(GESTAO_BACKUP_KEY, JSON.stringify(record));
  return { ok: true, record };
}

export function getGestaoBackupAnalysis() {
  if (!canUseStorage()) return null;
  return safeParse(window.localStorage.getItem(GESTAO_BACKUP_KEY), null);
}

export function clearGestaoBackupAnalysis() {
  if (!canUseStorage()) return false;
  window.localStorage.removeItem(GESTAO_BACKUP_KEY);
  window.localStorage.removeItem(COMPARE_KEY);
  return true;
}

export function compareCatalogAndGestaoBackups() {
  const catalogRecord = getCatalogBackupAnalysis();
  const gestaoRecord = getGestaoBackupAnalysis();

  if (!catalogRecord?.analysis?.products?.length) {
    return { ok: false, missing: 'catalog', message: 'Anexe primeiro o backup JSON do catálogo real.' };
  }

  if (!gestaoRecord?.analysis?.products?.length) {
    return { ok: false, missing: 'gestao', message: 'Anexe primeiro o backup JSON real do Gestão.' };
  }

  const catalogProducts = catalogRecord.analysis.products.map(normalizeCatalogProduct);
  const gestaoProducts = gestaoRecord.analysis.products.map(normalizeGestaoProduct);
  const usedGestaoIds = new Set();
  const exactMatches = [];
  const readyToUnify = [];
  const possibleDuplicates = [];
  const onlyCatalog = [];

  const gestaoByKey = new Map();
  gestaoProducts.forEach((product) => {
    if (!gestaoByKey.has(product.key)) gestaoByKey.set(product.key, []);
    gestaoByKey.get(product.key).push(product);
  });

  catalogProducts.forEach((catalogProduct) => {
    const exact = (gestaoByKey.get(catalogProduct.key) || []).find((item) => !usedGestaoIds.has(item.id));
    if (exact) {
      usedGestaoIds.add(exact.id);
      const merged = buildPreviewProduct(catalogProduct, exact, 'exact');
      exactMatches.push({ catalog: catalogProduct, gestao: exact, merged });
      if (catalogProduct.imageUrl && exact.priceNumber !== null) readyToUnify.push({ catalog: catalogProduct, gestao: exact, merged });
      return;
    }

    let best = null;
    let bestScore = 0;
    gestaoProducts.forEach((gestaoProduct) => {
      if (usedGestaoIds.has(gestaoProduct.id)) return;
      const score = similarity(catalogProduct, gestaoProduct);
      if (score > bestScore) {
        best = gestaoProduct;
        bestScore = score;
      }
    });

    if (best && bestScore >= 0.45) {
      possibleDuplicates.push({ catalog: catalogProduct, gestao: best, score: bestScore, merged: buildPreviewProduct(catalogProduct, best, 'possible') });
      return;
    }

    onlyCatalog.push(catalogProduct);
  });

  const onlyGestao = gestaoProducts.filter((product) => !usedGestaoIds.has(product.id) && !possibleDuplicates.some((item) => item.gestao.id === product.id));
  const priceDiffs = exactMatches.filter((item) => item.catalog.priceNumber !== null && item.gestao.priceNumber !== null && Math.abs(item.catalog.priceNumber - item.gestao.priceNumber) > 0.01);
  const catalogPhotoGestaoPrice = [...exactMatches, ...possibleDuplicates]
    .filter((item) => item.catalog.imageUrl && item.gestao.priceNumber !== null)
    .map((item) => ({ ...item, merged: buildPreviewProduct(item.catalog, item.gestao, item.score ? 'possible' : 'exact') }));

  const result = {
    ok: true,
    comparedAt: new Date().toISOString(),
    catalog: {
      sourceName: catalogRecord.sourceName,
      total: catalogProducts.length,
      withImage: catalogProducts.filter((product) => product.imageUrl).length,
      withPrice: catalogProducts.filter((product) => product.priceNumber !== null).length,
    },
    gestao: {
      sourceName: gestaoRecord.sourceName,
      total: gestaoProducts.length,
      withImage: gestaoProducts.filter((product) => product.imageUrl).length,
      withPrice: gestaoProducts.filter((product) => product.priceNumber !== null).length,
      salesCount: gestaoRecord.analysis.salesCount || 0,
      clientsCount: gestaoRecord.analysis.clientsCount || 0,
      paymentsCount: gestaoRecord.analysis.paymentsCount || 0,
    },
    exactMatches,
    readyToUnify,
    possibleDuplicates,
    onlyCatalog,
    onlyGestao,
    priceDiffs,
    catalogPhotoGestaoPrice,
    summary: {
      exact: exactMatches.length,
      readyToUnify: readyToUnify.length,
      possibleDuplicates: possibleDuplicates.length,
      onlyCatalog: onlyCatalog.length,
      onlyGestao: onlyGestao.length,
      priceDiffs: priceDiffs.length,
      catalogPhotoGestaoPrice: catalogPhotoGestaoPrice.length,
    },
  };

  if (canUseStorage()) window.localStorage.setItem(COMPARE_KEY, JSON.stringify(result));
  return result;
}

function buildPreviewProduct(catalogProduct, gestaoProduct, matchType) {
  return {
    matchType,
    name: catalogProduct.name || gestaoProduct.name,
    brand: catalogProduct.brand || gestaoProduct.brand,
    description: catalogProduct.description || gestaoProduct.description,
    imageUrl: catalogProduct.imageUrl || gestaoProduct.imageUrl,
    price: gestaoProduct.price !== '' && gestaoProduct.price !== null && gestaoProduct.price !== undefined ? gestaoProduct.price : catalogProduct.price,
    category: catalogProduct.category || gestaoProduct.category,
    catalogId: catalogProduct.id,
    gestaoId: gestaoProduct.id,
  };
}

export function getLastComparison() {
  if (!canUseStorage()) return null;
  return safeParse(window.localStorage.getItem(COMPARE_KEY), null);
}

export function clearLastComparison() {
  if (!canUseStorage()) return false;
  window.localStorage.removeItem(COMPARE_KEY);
  return true;
}
