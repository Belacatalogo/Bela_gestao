import { DATA_MODES, getEnvironmentStatus } from './environmentService.js';
import {
  getLabProducts,
  getLabProductById,
  getLabStorageInfo,
  resetLabProducts,
  updateLabProductVisibility,
  upsertLabProduct,
} from './labDataService.js';

function blockedRealWriteResult(action) {
  return {
    ok: false,
    blocked: true,
    action,
    message: 'Escrita real bloqueada no LAB. Nenhum dado real foi alterado.',
  };
}

export function getDataGatewayStatus() {
  const environment = getEnvironmentStatus();

  return {
    ...environment,
    labStorage: getLabStorageInfo(),
    realWritesBlocked: true,
    firebaseConfigured: false,
    googleLoginConfigured: false,
  };
}

export function listProducts() {
  const status = getEnvironmentStatus();

  if (status.mode === DATA_MODES.REAL_READONLY) {
    return {
      source: 'real-readonly-placeholder',
      products: [],
      warning: 'Leitura real ainda não foi conectada. Modo seguro sem dados reais.',
    };
  }

  return {
    source: 'lab-localStorage',
    products: getLabProducts(),
    warning: null,
  };
}

export function getProduct(productId) {
  const status = getEnvironmentStatus();

  if (status.mode === DATA_MODES.REAL_READONLY) return null;
  return getLabProductById(productId);
}

export function saveProduct(draft) {
  const status = getEnvironmentStatus();

  if (status.mode === DATA_MODES.REAL_READONLY) {
    return blockedRealWriteResult('saveProduct');
  }

  return upsertLabProduct(draft);
}

export function toggleProductVisibility(productId) {
  const status = getEnvironmentStatus();

  if (status.mode === DATA_MODES.REAL_READONLY) {
    return blockedRealWriteResult('toggleProductVisibility');
  }

  const current = getLabProducts().find((product) => product.id === productId);
  if (!current) {
    return {
      ok: false,
      blocked: false,
      message: 'Produto de teste não encontrado.',
    };
  }

  const products = updateLabProductVisibility(productId, !current.visibleInCatalog);

  return {
    ok: true,
    blocked: false,
    products,
    message: current.visibleInCatalog ? 'Produto ocultado no LAB.' : 'Produto publicado no LAB.',
  };
}

export function resetProducts() {
  const status = getEnvironmentStatus();

  if (status.mode === DATA_MODES.REAL_READONLY) {
    return blockedRealWriteResult('resetProducts');
  }

  return {
    ok: true,
    blocked: false,
    products: resetLabProducts(),
    message: 'Dados de teste restaurados.',
  };
}
