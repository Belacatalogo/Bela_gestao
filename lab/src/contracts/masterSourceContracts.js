export const PRODUCT_RECOVERY_STATUS = Object.freeze({
  CONFIRMED: 'confirmado',
  PROBABLE: 'provavel',
  DOUBTFUL: 'duvidoso',
  PENDING_REVIEW: 'pendente_revisao',
});

export const CATALOG_SYNC_STATUS = Object.freeze({
  READY: 'pronto_catalogo',
  MISSING_IMAGE: 'sem_foto',
  HIDDEN: 'oculto',
  NEEDS_REVIEW: 'precisa_revisao',
  BLOCKED: 'bloqueado',
});

export const DATA_ORIGINS = Object.freeze({
  FIREBASE: 'firebase',
  MANUAL_BACKUP: 'backup_manual',
  PUBLIC_CATALOG: 'catalogo_publico_antigo',
  OLD_GESTAO: 'gestao_antigo',
  MANUAL_ENTRY: 'entrada_manual',
  LAB: 'lab',
});

export const MASTER_PRODUCT_CONTRACT_VERSION = 1;
export const MASTER_CUSTOMER_CONTRACT_VERSION = 1;
export const MASTER_SALE_CONTRACT_VERSION = 1;
export const MASTER_PAYMENT_CONTRACT_VERSION = 1;

export function createMasterProductContract(overrides = {}) {
  const now = new Date().toISOString();
  return {
    contract: 'bela-master-product',
    contractVersion: MASTER_PRODUCT_CONTRACT_VERSION,
    id: '',
    legacyIds: [],
    firebaseId: '',
    publicCatalogId: '',
    name: '',
    brand: '',
    description: '',
    price: 0,
    cost: 0,
    imageUrl: '',
    extraImages: [],
    category: 'catalogo',
    catalogTabs: ['todos'],
    badge: '',
    stock: 0,
    visibleInGestao: true,
    visibleInCatalog: false,
    catalogSyncStatus: CATALOG_SYNC_STATUS.NEEDS_REVIEW,
    recoveryStatus: PRODUCT_RECOVERY_STATUS.PENDING_REVIEW,
    origins: [],
    originDetails: {},
    sold: false,
    notes: '',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

export function createMasterCustomerContract(overrides = {}) {
  const now = new Date().toISOString();
  return {
    contract: 'bela-master-customer',
    contractVersion: MASTER_CUSTOMER_CONTRACT_VERSION,
    id: '',
    name: '',
    phone: '',
    cpf: '',
    notes: '',
    origins: [],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

export function createMasterSaleContract(overrides = {}) {
  const now = new Date().toISOString();
  return {
    contract: 'bela-master-sale',
    contractVersion: MASTER_SALE_CONTRACT_VERSION,
    id: '',
    legacySaleId: '',
    productId: '',
    legacyProductId: '',
    customerId: '',
    customerSnapshot: null,
    quantity: 1,
    installmentCount: 1,
    purchaseDate: '',
    totalValue: 0,
    paidValue: 0,
    status: 'aberta',
    origins: [],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

export function createMasterPaymentContract(overrides = {}) {
  const now = new Date().toISOString();
  return {
    contract: 'bela-master-payment',
    contractVersion: MASTER_PAYMENT_CONTRACT_VERSION,
    id: '',
    saleId: '',
    installmentIndex: 0,
    dueDate: '',
    paidAt: '',
    paid: false,
    value: 0,
    obs: '',
    history: [],
    origins: [],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

export function deriveCatalogSyncStatus(product) {
  if (!product?.visibleInGestao) return CATALOG_SYNC_STATUS.BLOCKED;
  if (!product?.visibleInCatalog) return CATALOG_SYNC_STATUS.HIDDEN;
  if (!String(product?.imageUrl || '').trim()) return CATALOG_SYNC_STATUS.MISSING_IMAGE;
  if ([PRODUCT_RECOVERY_STATUS.DOUBTFUL, PRODUCT_RECOVERY_STATUS.PENDING_REVIEW].includes(product?.recoveryStatus)) {
    return CATALOG_SYNC_STATUS.NEEDS_REVIEW;
  }
  return CATALOG_SYNC_STATUS.READY;
}

export function explainCatalogSyncStatus(status) {
  const map = {
    [CATALOG_SYNC_STATUS.READY]: 'Produto pronto para aparecer no catálogo novo.',
    [CATALOG_SYNC_STATUS.MISSING_IMAGE]: 'Produto sem foto. Não deve ser publicado no catálogo até receber imagem.',
    [CATALOG_SYNC_STATUS.HIDDEN]: 'Produto existe no Gestão, mas está oculto no catálogo.',
    [CATALOG_SYNC_STATUS.NEEDS_REVIEW]: 'Produto precisa de revisão antes de sincronizar com o catálogo.',
    [CATALOG_SYNC_STATUS.BLOCKED]: 'Produto bloqueado/desativado no Gestão.',
  };
  return map[status] || 'Status desconhecido.';
}
