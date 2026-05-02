const REQUIRED_FIREBASE_CONFIG_FIELDS = [
  'apiKey',
  'authDomain',
  'projectId',
  'storageBucket',
  'messagingSenderId',
  'appId',
];

const PLANNED_READ_PATHS = [
  {
    id: 'catalog-products',
    label: 'Produtos do catálogo',
    plannedCollections: ['products', 'catalog', 'catalogProducts'],
    masterSection: 'catalog.products',
  },
  {
    id: 'sales-orders',
    label: 'Vendas e pedidos',
    plannedCollections: ['sales', 'orders'],
    masterSection: 'sales.orders',
  },
  {
    id: 'payments-installments',
    label: 'Pagamentos e parcelas',
    plannedCollections: ['payments', 'installments', 'pagMeta'],
    masterSection: 'payments.installments',
  },
  {
    id: 'customers',
    label: 'Clientes/compradores',
    plannedCollections: ['customers', 'clients', 'buyers'],
    masterSection: 'customers.list',
  },
  {
    id: 'settings',
    label: 'Configurações',
    plannedCollections: ['settings', 'config'],
    masterSection: 'settings',
  },
  {
    id: 'daily-backups',
    label: 'Backups automáticos diários',
    plannedCollections: ['backups', 'dailyBackups'],
    masterSection: 'meta/source=firebase-daily-backup',
  },
];

const BLOCKED_WRITE_ACTIONS = [
  'setDoc',
  'addDoc',
  'updateDoc',
  'deleteDoc',
  'writeBatch',
  'runTransaction',
  'uploadBytes',
  'deleteObject',
  'restoreBackupToFirebase',
  'publishRealCatalogProduct',
];

function isObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value);
}

export function validateFirebaseReadonlyConfig(config = {}) {
  const presentFields = REQUIRED_FIREBASE_CONFIG_FIELDS.filter((field) => Boolean(config[field]));
  const missingFields = REQUIRED_FIREBASE_CONFIG_FIELDS.filter((field) => !config[field]);

  return {
    ok: missingFields.length === 0,
    presentFields,
    missingFields,
    safeToStoreInRepo: false,
    note: 'Mesmo campos públicos do Firebase devem ser tratados com cuidado e não devem ser hardcoded até validação final do ambiente.',
  };
}

export function getFirebaseReadonlyStatus(config = null) {
  const hasConfigObject = isObject(config);
  const validation = validateFirebaseReadonlyConfig(hasConfigObject ? config : {});

  return {
    mode: 'readonly-adapter',
    adapterReady: true,
    firebaseSdkLoaded: false,
    realConfigProvided: hasConfigObject,
    configValid: hasConfigObject && validation.ok,
    authRequiredNow: false,
    wifeLoginRequiredNow: false,
    readonlyEnabled: false,
    realReadsExecuted: false,
    realWritesBlocked: true,
    catalogWritesBlocked: true,
    validation,
    plannedReadPaths: PLANNED_READ_PATHS,
    blockedWriteActions: BLOCKED_WRITE_ACTIONS,
    nextStep: hasConfigObject && validation.ok
      ? 'habilitar leitura real em modo somente leitura controlado'
      : 'fornecer configuração Firebase de forma segura em bloco futuro, sem salvar segredo no repositório',
  };
}

export async function readFirebaseReadonlyPlaceholder(collectionName) {
  return {
    ok: false,
    blocked: true,
    collectionName,
    reason: 'Leitura Firebase real ainda não foi ativada neste bloco.',
    message: 'O adaptador READ-ONLY está preparado, mas nenhuma credencial real foi conectada e nenhuma leitura real foi executada.',
    data: [],
  };
}

export function assertFirebaseWriteBlocked(actionName) {
  return {
    ok: false,
    blocked: true,
    actionName,
    reason: `Ação ${actionName || 'desconhecida'} bloqueada no LAB. Este bloco permite somente preparação de leitura.`,
  };
}

export function getFirebaseReadonlyContractReport() {
  const status = getFirebaseReadonlyStatus();
  return {
    ...status,
    contractRules: [
      'Nenhuma credencial real deve ser hardcoded neste bloco.',
      'Nenhum login Google deve ser exigido neste bloco.',
      'Nenhuma escrita real pode ser executada pelo LAB.',
      'A primeira conexão real deve listar dados em modo somente leitura.',
      'A leitura real futura deve ser comparada com JSON manual e schema mestre antes de qualquer migração.',
    ],
  };
}
