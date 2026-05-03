import { getLabProducts } from './labDataService.js';

function normalizeText(value) {
  return String(value ?? '').trim();
}

function normalizeId(value) {
  return normalizeText(value);
}

function isObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value);
}

function objectKeys(value) {
  return isObject(value) ? Object.keys(value) : [];
}

function countSalesItems(sales) {
  if (!isObject(sales)) return { productIds: [], saleRows: 0, installmentRows: 0 };
  const productIds = Object.keys(sales);
  let saleRows = 0;
  let installmentRows = 0;
  Object.values(sales).forEach((rows) => {
    if (!Array.isArray(rows)) return;
    saleRows += rows.length;
    rows.forEach((sale) => {
      if (Array.isArray(sale?.paid)) installmentRows += sale.paid.length;
      else installmentRows += Number(sale?.count || sale?.qty || 0);
    });
  });
  return { productIds, saleRows, installmentRows };
}

function parseBackupText(rawText) {
  try {
    const parsed = JSON.parse(rawText);
    if (!isObject(parsed)) throw new Error('Backup não é um objeto JSON válido.');
    return { ok: true, data: parsed };
  } catch (error) {
    return { ok: false, error: String(error?.message || error) };
  }
}

function compareIds(backupIds, labProducts) {
  const labIds = new Set(labProducts.map((product) => normalizeId(product.firebaseId || product.id).replace(/^firebase-(recovered-)?/, '')));
  const backupSet = new Set(backupIds.map(normalizeId));
  const inBoth = backupIds.filter((id) => labIds.has(normalizeId(id)));
  const onlyBackup = backupIds.filter((id) => !labIds.has(normalizeId(id)));
  const onlyLab = labProducts
    .map((product) => normalizeId(product.firebaseId || product.id).replace(/^firebase-(recovered-)?/, ''))
    .filter((id) => id && !backupSet.has(id));
  return {
    inBoth,
    onlyBackup,
    onlyLab,
  };
}

function detectProductCatalogFields(data) {
  const candidates = [];
  const stack = [{ path: '/', value: data, depth: 0 }];
  const visited = new Set();

  while (stack.length) {
    const item = stack.shift();
    if (!item || item.depth > 4) continue;
    if (item.value && typeof item.value === 'object') {
      if (visited.has(item.value)) continue;
      visited.add(item.value);
    }

    if (Array.isArray(item.value)) {
      const objectRows = item.value.filter(isObject);
      const productLike = objectRows.filter((row) => {
        const keys = Object.keys(row).map((key) => key.toLowerCase());
        return ['name', 'nome', 'brand', 'marca', 'foto', 'imageurl', 'price', 'preco', 'category'].some((key) => keys.includes(key));
      });
      if (productLike.length) {
        candidates.push({ path: item.path, type: 'array', count: productLike.length, keys: Object.keys(productLike[0] || {}) });
      }
      item.value.forEach((value, index) => stack.push({ path: `${item.path}/${index}`, value, depth: item.depth + 1 }));
      continue;
    }

    if (isObject(item.value)) {
      const entries = Object.entries(item.value);
      const productLikeChildren = entries.filter(([, value]) => {
        if (!isObject(value)) return false;
        const keys = Object.keys(value).map((key) => key.toLowerCase());
        return ['name', 'nome', 'brand', 'marca', 'foto', 'imageurl', 'price', 'preco', 'category'].some((key) => keys.includes(key));
      });
      if (productLikeChildren.length) {
        candidates.push({ path: item.path, type: 'object-map', count: productLikeChildren.length, keys: Object.keys(productLikeChildren[0]?.[1] || {}) });
      }
      entries.forEach(([key, value]) => stack.push({ path: `${item.path === '/' ? '' : item.path}/${key}`, value, depth: item.depth + 1 }));
    }
  }

  return candidates.slice(0, 20);
}

export function analyzeGestaoBackupText(rawText) {
  const parsed = parseBackupText(rawText);
  if (!parsed.ok) {
    return {
      ok: false,
      message: 'Não foi possível ler o JSON de backup.',
      error: parsed.error,
    };
  }

  const data = parsed.data;
  const labProducts = getLabProducts();
  const priceIds = objectKeys(data.prices || data.precos);
  const soldIds = objectKeys(data.sold || data.vendidos);
  const salesSummary = countSalesItems(data.sales || data.vendas);
  const pagMetaIds = objectKeys(data.pagMeta || data.pagamentosMeta || data.paymentMeta);
  const allBackupIds = Array.from(new Set([...priceIds, ...soldIds, ...salesSummary.productIds].map(normalizeId).filter(Boolean)));
  const comparison = compareIds(allBackupIds, labProducts);
  const productCatalogCandidates = detectProductCatalogFields(data);

  const sourceConclusion = productCatalogCandidates.length
    ? 'O backup contém candidatos de catálogo com nome/foto/categoria. Pode ser usado para importar produtos completos depois de validação.'
    : 'Este backup parece guardar preços/vendas/pagamentos, mas não contém catálogo completo com nome/foto/categoria.';

  const syncFunctionConclusion = 'A função antiga “Sincronizar produtos com o catálogo” provavelmente usa uma lista interna/localStorage do Gestão, diferente deste backup manual. Próximo passo: mapear localStorage/chaves antigas do Gestão em execução ou ler o trecho exato da função no index legado.';

  return {
    ok: true,
    message: 'Backup do Gestão analisado no LAB. Nenhuma escrita foi feita.',
    version: data.version ?? null,
    exportedAt: data.exportedAt || '',
    counts: {
      prices: priceIds.length,
      sold: soldIds.length,
      salesProductIds: salesSummary.productIds.length,
      saleRows: salesSummary.saleRows,
      installmentRows: salesSummary.installmentRows,
      pagMeta: pagMetaIds.length,
      uniqueBackupProductIds: allBackupIds.length,
      labProducts: labProducts.length,
      overlapWithLab: comparison.inBoth.length,
      onlyBackup: comparison.onlyBackup.length,
      onlyLab: comparison.onlyLab.length,
      productCatalogCandidates: productCatalogCandidates.reduce((sum, item) => sum + Number(item.count || 0), 0),
    },
    samples: {
      priceIds: priceIds.slice(0, 80),
      soldIds: soldIds.slice(0, 40),
      salesIds: salesSummary.productIds.slice(0, 40),
      pagMetaIds: pagMetaIds.slice(0, 40),
      onlyBackup: comparison.onlyBackup.slice(0, 80),
      onlyLab: comparison.onlyLab.slice(0, 80),
      productCatalogCandidates,
    },
    conclusions: {
      sourceConclusion,
      syncFunctionConclusion,
    },
    writeBlocked: true,
    firebaseWriteExecuted: false,
    catalogWriteExecuted: false,
  };
}
