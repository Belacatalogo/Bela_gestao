export const CATALOG_REQUIRED_FIELDS = Object.freeze([
  'id',
  'name',
  'brand',
  'description',
  'price',
  'imageUrl',
  'category',
  'catalogTabs',
  'visibleInCatalog',
]);

export const CATALOG_OPTIONAL_FIELDS = Object.freeze([
  'badge',
  'stock',
  'order',
  'cost',
  'createdAt',
  'updatedAt',
]);

function hasValue(value) {
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'boolean') return true;
  if (typeof value === 'number') return Number.isFinite(value);
  return String(value ?? '').trim().length > 0;
}

export function validateCatalogProduct(product) {
  const missing = CATALOG_REQUIRED_FIELDS.filter((field) => !hasValue(product?.[field]));
  const warnings = [];

  if (!Array.isArray(product?.catalogTabs)) {
    warnings.push('catalogTabs deve ser uma lista de abas.');
  }

  if (Number(product?.price || 0) <= 0) {
    warnings.push('price deve ser maior que zero.');
  }

  if (String(product?.imageUrl || '').startsWith('data:image/svg+xml')) {
    warnings.push('produto usa imagem provisória LAB, ainda sem foto real.');
  }

  return {
    ok: missing.length === 0,
    missing,
    warnings,
  };
}

export function buildCatalogProduct(product) {
  return {
    id: product.id,
    name: product.name,
    brand: product.brand,
    description: product.description,
    price: product.price,
    imageUrl: product.imageUrl,
    category: product.category,
    catalogTabs: Array.isArray(product.catalogTabs) ? product.catalogTabs : ['todos'],
    visibleInCatalog: Boolean(product.visibleInCatalog),
    badge: product.badge || '',
    stock: Number(product.stock || 0),
    order: Number(product.order || 0),
    updatedAt: product.updatedAt || '',
  };
}

export function getCatalogSyncReport(products) {
  const visibleProducts = products.filter((product) => product.visibleInCatalog);
  const rows = products.map((product) => {
    const validation = validateCatalogProduct(product);
    return {
      id: product.id,
      name: product.name,
      category: product.category,
      visibleInCatalog: Boolean(product.visibleInCatalog),
      ok: validation.ok,
      missing: validation.missing,
      warnings: validation.warnings,
    };
  });

  const invalidRows = rows.filter((row) => !row.ok);
  const warningRows = rows.filter((row) => row.warnings.length > 0);
  const categories = [...new Set(visibleProducts.map((product) => product.category).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  const tabs = [...new Set(visibleProducts.flatMap((product) => product.catalogTabs || []).filter(Boolean))].sort((a, b) => a.localeCompare(b));

  return {
    totalProducts: products.length,
    visibleProducts: visibleProducts.length,
    invalidProducts: invalidRows.length,
    warningProducts: warningRows.length,
    categories,
    tabs,
    rows,
    canSyncRealCatalog: false,
    mode: 'lab-contract-only',
  };
}
