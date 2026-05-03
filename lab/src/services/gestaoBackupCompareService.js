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

function objectValues(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return [];
  return Object.entries(value).map(([id, item]) => (item && typeof item === 'object' ? { id: item.id || id, ...item } : { id, value: item }));
}

function flattenLocalStorageLike(payload) {
  if (!payload || typeof payload !== 'object') return payload;
  const out = { ...payload };
  Object.entries(payload).forEach(([key, value]) => {
    if (typeof value === 'string' && (value.trim().startsWith('{') || value.trim().startsWith('['))) {
      const parsed = safeParse(value, null);
      if (parsed !== null) out[key] = parsed;
    }
  });
  return out;
}

function scanContainers(payload, maxDepth = 5) {
  const root = flattenLocalStorageLike(payload);
  const containers = [];
  const seen = new WeakSet();

  function walk(value, path, depth) {
    if (!value || typeof value !== 'object' || depth > maxDepth) return;
    if (seen.has(value)) return;
    seen.add(value);
    containers.push({ path, value });

    if (Array.isArray(value)) {
      value.slice(0, 120).forEach((item, index) => walk(item, `${path}[${index}]`, depth + 1));
      return;
    }

    Object.entries(value).forEach(([key, child]) => {
      if (typeof child === 'string' && (child.trim().startsWith('{') || child.trim().startsWith('['))) {
        const parsed = safeParse(child, null);
        if (parsed !== null) walk(parsed, `${path}.${key}{json}`, depth + 1);
        return;
      }
      walk(child, `${path}.${key}`, depth + 1);
    });
  }

  walk(root, 'root', 0);
  return containers;
}

function looksLikeProduct(item = {}) {
  if (!item || typeof item !== 'object') return false;
  const keys = Object.keys(item).map(normalizeText).join(' ');
  const hasName = item.name || item.nome || item.title || item.titulo || item.productName || item.produto || item.item || item.descricao || item.description;
  const hasProductSignal = /produto|product|preco|price|valor|marca|brand|foto|image|img|categoria|category|estoque|stock/.test(keys);
  const hasNonClientSignal = !(item.phone || item.telefone || item.whatsapp || item.cliente || item.customerName) || Boolean(item.preco || item.price || item.valor || item.imageUrl || item.foto);
  return Boolean(hasName && hasProductSignal && hasNonClientSignal);
}

function looksLikeSale(item = {}) {
  if (!item || typeof item !== 'object') return false;
  const keys = Object.keys(item).map(normalizeText).join(' ');
  return /venda|sale|compr|cliente|total|parcel|pagamento|paid|quitado|data/.test(keys) && Boolean(item.total || item.valor || item.items || item.produtos || item.product || item.produto || item.cliente || item.client);
}

function looksLikeClient(item = {}) {
  if (!item || typeof item !== 'object') return false;
  const keys = Object.keys(item).map(normalizeText).join(' ');
  return /cliente|client|compradora|customer|telefone|phone|whatsapp|nome|name/.test(keys) && Boolean(item.telefone || item.phone || item.whatsapp || item.nome || item.name || item.cliente);
}

function looksLikePayment(item = {}) {
  if (!item || typeof item !== 'object') return false;
  const keys = Object.keys(item).map(normalizeText).join(' ');
  return /pagamento|payment|parcela|installment|venc|due|quitado|paid|recebido|pendente/.test(keys) && Boolean(item.valor || item.value || item.amount || item.total || item.vencimento || item.dueDate || item.pago !== undefined || item.paid !== undefined);
}

function candidateArraysByName(payload, nameMatchers) {
  const containers = scanContainers(payload);
  const arrays = [];
  containers.forEach(({ path, value }) => {
    const pathName = normalizeText(path);
    const nameHit = nameMatchers.some((matcher) => matcher.test(pathName));
    if (!nameHit) return;
    if (Array.isArray(value)) arrays.push({ path, items: value });
    else if (value && typeof value === 'object') arrays.push({ path, items: objectValues(value) });
  });
  return arrays;
}

function bestArrayByHeuristic(payload, nameMatchers, predicate) {
  const named = candidateArraysByName(payload, nameMatchers);
  const scored = named.map((candidate) => {
    const items = candidate.items || [];
    const hits = items.filter((item) => predicate(item)).length;
    return { ...candidate, hits };
  }).filter((candidate) => candidate.items.length && candidate.hits > 0);

  if (scored.length) return scored.sort((a, b) => b.hits - a.hits || b.items.length - a.items.length)[0];

  const containers = scanContainers(payload);
  const generic = containers
    .filter(({ value }) => Array.isArray(value) || (value && typeof value === 'object' && Object.keys(value).length >= 2))
    .map(({ path, value }) => {
      const items = Array.isArray(value) ? value : objectValues(value);
      const hits = items.filter((item) => predicate(item)).length;
      return { path, items, hits };
    })
    .filter((candidate) => candidate.items.length && candidate.hits >= Math.min(3, candidate.items.length));

  return generic.sort((a, b) => b.hits - a.hits || b.items.length - a.items.length)[0] || { path: '', items: [], hits: 0 };
}

function extractGestaoProducts(payload) {
  const direct = firstArray(
    payload?.products,
    payload?.produtos,
    payload?.prices,
    payload?.precos,
    payload?.catalogProducts,
    payload?.data?.products,
    payload?.data?.produtos,
    payload?.data?.prices,
    payload?.backup?.products,
    payload?.backup?.produtos,
    payload?.backup?.prices,
    payload?.lab?.products
  );
  if (direct.length) return { path: 'direct', items: direct };

  const named = bestArrayByHeuristic(payload, [/produt/, /product/, /preco/, /price/, /catalog/], looksLikeProduct);
  if (named.items.length) return named;

  const sales = bestArrayByHeuristic(payload, [/venda/, /sale/, /sold/], looksLikeSale);
  const embedded = [];
  sales.items.forEach((sale) => {
    const saleProducts = firstArray(sale.products, sale.produtos, sale.items, sale.itens);
    saleProducts.forEach((product) => embedded.push(product));
    if (sale.product || sale.produto || sale.item) embedded.push(sale.product || sale.produto || sale.item);
  });
  return { path: `${sales.path}.embeddedProducts`, items: embedded };
}

function extractGestaoSales(payload) {
  const direct = firstArray(payload?.sales, payload?.vendas, payload?.sold, payload?.data?.sales, payload?.data?.vendas, payload?.backup?.sales, payload?.backup?.vendas);
  if (direct.length) return { path: 'direct', items: direct };
  return bestArrayByHeuristic(payload, [/venda/, /sale/, /sold/, /compras/], looksLikeSale);
}

function extractGestaoClients(payload) {
  const direct = firstArray(payload?.clients, payload?.clientes, payload?.customers, payload?.compradoras, payload?.data?.clients, payload?.data?.clientes);
  if (direct.length) return { path: 'direct', items: direct };
  return bestArrayByHeuristic(payload, [/cliente/, /client/, /customer/, /compradora/], looksLikeClient);
}

function extractGestaoPayments(payload) {
  const direct = firstArray(payload?.payments, payload?.pagamentos, payload?.parcelas, payload?.pagMeta, payload?.data?.payments, payload?.data?.pagamentos);
  if (direct.length) return { path: 'direct', items: direct };
  return bestArrayByHeuristic(payload, [/pagamento/, /payment/, /parcela/, /installment/, /pagmeta/], looksLikePayment);
}

function normalizeGestaoProduct(raw, index) {
  const name = displayText(raw.name || raw.nome || raw.title || raw.titulo || raw.productName || raw.produtoNome || raw.nomeProduto || raw.produto || raw.item || raw.descricao || raw.description);
  const brand = displayText(raw.brand || raw.marca || raw.productBrand || raw.loja || raw.categoryBrand);
  const description = displayText(raw.description || raw.descricao || raw.sub || raw.volume || raw.details || raw.obs || raw.observacao);
  const priceRaw = raw.price ?? raw.preco ?? raw.preço ?? raw.valor ?? raw.salePrice ?? raw.valorVenda ?? raw.sellPrice ?? raw.precoVenda ?? raw.priceSale ?? '';
  const imageUrl = displayText(raw.imageUrl || raw.image || raw.img || raw.foto || raw.photo || raw.url || raw.imagem || raw.src);
  const category = displayText(raw.category || raw.categoria || raw.tab || raw.aba || raw.tipo || 'gestao');

  return {
    id: displayText(raw.id || raw.slug || raw.sku || raw.codigo || raw.code || `gestao-backup-${index + 1}`),
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

function uniqueProducts(products) {
  const seen = new Set();
  return products.filter((product) => {
    const key = [normalizeText(product.name), normalizeText(product.brand), normalizeText(product.description), String(product.price || '')].join('|');
    if (!product.name && !product.imageUrl) return false;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function analyzeGestaoBackupPayload(payload) {
  const normalizedPayload = flattenLocalStorageLike(payload);
  const productCandidate = extractGestaoProducts(normalizedPayload);
  const salesCandidate = extractGestaoSales(normalizedPayload);
  const clientsCandidate = extractGestaoClients(normalizedPayload);
  const paymentsCandidate = extractGestaoPayments(normalizedPayload);

  const products = uniqueProducts((productCandidate.items || []).map(normalizeGestaoProduct));
  const sales = salesCandidate.items || [];
  const clients = clientsCandidate.items || [];
  const payments = paymentsCandidate.items || [];
  const containers = scanContainers(normalizedPayload, 3);

  return {
    ok: products.length > 0 || sales.length > 0 || clients.length > 0 || payments.length > 0,
    products,
    totalProducts: products.length,
    withImage: products.filter((product) => product.imageUrl).length,
    withPrice: products.filter((product) => product.price !== '' && product.price !== null && product.price !== undefined).length,
    salesCount: sales.length,
    clientsCount: clients.length,
    paymentsCount: payments.length,
    sourceKeys: normalizedPayload && typeof normalizedPayload === 'object' && !Array.isArray(normalizedPayload) ? Object.keys(normalizedPayload).slice(0, 30) : [],
    detectedPaths: {
      products: productCandidate.path || 'não encontrado',
      sales: salesCandidate.path || 'não encontrado',
      clients: clientsCandidate.path || 'não encontrado',
      payments: paymentsCandidate.path || 'não encontrado',
    },
    scannedPaths: containers.map((item) => item.path).slice(0, 40),
  };
}

export async function readGestaoBackupFile(file) {
  if (!file) return { ok: false, error: 'Selecione o JSON do backup real do Gestão.' };
  const text = await file.text();
  const payload = safeParse(text, null);
  if (!payload) return { ok: false, error: 'Arquivo inválido. O backup do Gestão precisa ser um JSON válido.' };
  const analysis = analyzeGestaoBackupPayload(payload);
  if (!analysis.ok) {
    return {
      ok: false,
      error: 'JSON lido, mas nenhum dado reconhecido do Gestão foi encontrado. O diagnóstico foi ampliado; envie print das chaves detectadas se continuar assim.',
      analysis,
    };
  }
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
