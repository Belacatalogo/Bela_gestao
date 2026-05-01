export const PRODUCT_STATUS_FILTERS = Object.freeze({
  ALL: 'all',
  VISIBLE: 'visible',
  HIDDEN: 'hidden',
  NO_IMAGE: 'no-image',
});

export function getProductCategories(products) {
  return [...new Set(products.map((product) => product.category).filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

export function getProductStats(products) {
  const visible = products.filter((product) => product.visibleInCatalog).length;
  const hidden = products.length - visible;
  const withoutUploadedImage = products.filter((product) => String(product.imageUrl || '').startsWith('data:image/svg+xml')).length;

  return {
    total: products.length,
    visible,
    hidden,
    withoutUploadedImage,
  };
}

export function filterProducts(products, filters = {}) {
  const query = String(filters.query || '').trim().toLowerCase();
  const category = String(filters.category || 'all');
  const status = String(filters.status || PRODUCT_STATUS_FILTERS.ALL);

  return products.filter((product) => {
    const searchable = [
      product.name,
      product.brand,
      product.description,
      product.category,
      product.badge,
      ...(product.catalogTabs || []),
    ]
      .join(' ')
      .toLowerCase();

    const matchesQuery = !query || searchable.includes(query);
    const matchesCategory = category === 'all' || product.category === category;

    const hasPlaceholderImage = String(product.imageUrl || '').startsWith('data:image/svg+xml');
    const matchesStatus =
      status === PRODUCT_STATUS_FILTERS.ALL ||
      (status === PRODUCT_STATUS_FILTERS.VISIBLE && product.visibleInCatalog) ||
      (status === PRODUCT_STATUS_FILTERS.HIDDEN && !product.visibleInCatalog) ||
      (status === PRODUCT_STATUS_FILTERS.NO_IMAGE && hasPlaceholderImage);

    return matchesQuery && matchesCategory && matchesStatus;
  });
}
