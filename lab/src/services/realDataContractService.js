export const REAL_DATA_SOURCES = Object.freeze({
  MANUAL_JSON: 'manual-json',
  FIREBASE_DAILY_BACKUP: 'firebase-daily-backup',
  FIREBASE_LIVE: 'firebase-live',
});

const COMPLETE_BACKUP_REQUIREMENTS = [
  'produtos e IDs reais',
  'preços',
  'categorias e abas do catálogo',
  'fotos e URLs',
  'visibilidade/publicação',
  'vendas',
  'clientes',
  'telefone',
  'CPF quando existir',
  'parcelas',
  'status pago/pendente',
  'vencimentos',
  'observações',
  'histórico de pagamento',
  'configurações',
  'funções/configurações de IA sem expor chave sensível',
  'PWA/cache/versionamento',
];

const JSON_CONTRACT = {
  source: REAL_DATA_SOURCES.MANUAL_JSON,
  label: 'Backup JSON manual',
  role: 'backup completo sob demanda',
  loginRequired: false,
  writeAllowedInLab: false,
  knownRootKeys: ['version', 'exportedAt', 'prices', 'sold', 'sales', 'pagMeta'],
  mappedInLab: ['prices', 'sales', 'paid[]', 'pagMeta.date', 'pagMeta.venc', 'pagMeta.obs', 'pagMeta.parcHist'],
  missingOrPartial: ['catálogo de produtos com nomes/fotos reais', 'configurações de IA', 'configurações visuais completas'],
};

const FIREBASE_BACKUP_CONTRACT = {
  source: REAL_DATA_SOURCES.FIREBASE_DAILY_BACKUP,
  label: 'Backup automático diário via Firebase',
  role: 'snapshot automático para recuperação',
  loginRequired: true,
  writeAllowedInLab: false,
  expectedCollections: ['products/catalog', 'prices', 'sales', 'payments/pagMeta', 'settings', 'backups/daily'],
  status: 'contrato planejado; leitura real ainda não conectada',
};

const FIREBASE_LIVE_CONTRACT = {
  source: REAL_DATA_SOURCES.FIREBASE_LIVE,
  label: 'Firebase real/fonte viva',
  role: 'fonte compartilhada entre Gestão e Catálogo',
  loginRequired: true,
  writeAllowedInLab: false,
  expectedCollections: ['products/catalog', 'sales', 'payments', 'settings'],
  status: 'somente leitura planejada; escrita real bloqueada',
};

export function getRealDataContractReport({ appVersion, environment }) {
  return {
    generatedAt: new Date().toISOString(),
    appVersion,
    environmentMode: environment?.mode || 'unknown',
    realWritesBlocked: true,
    loginRequiredForFinal: true,
    wifeLoginOnlyInFinal: true,
    catalogWritesBlocked: true,
    sources: [JSON_CONTRACT, FIREBASE_BACKUP_CONTRACT, FIREBASE_LIVE_CONTRACT],
    completeBackupRequirements: COMPLETE_BACKUP_REQUIREMENTS,
    compatibility: {
      manualJsonAlreadyAudited: true,
      manualJsonCanImportToLab: true,
      firebaseReadConnected: false,
      firebaseWriteConnected: false,
      catalogRealWriteConnected: false,
      finalNeedsSameContractOrAdapters: true,
    },
    rules: [
      'JSON manual e Firebase automático devem convergir para um backup completo.',
      'Nenhuma escrita real será feita no LAB.',
      'Login Google da esposa fica para a versão final/controlada.',
      'Backup final deve armazenar literalmente tudo que existir no sistema.',
      'Chaves de IA não devem ser expostas em backup público ou repositório.',
    ],
  };
}

export function getRealDataContractStatus() {
  return {
    jsonManual: 'auditado e importável no LAB',
    firebaseDailyBackup: 'planejado / somente leitura futura',
    firebaseLive: 'planejado / somente leitura futura',
    realWrites: 'bloqueadas',
    catalogWrites: 'bloqueadas',
    loginGoogle: 'adiado para versão final',
  };
}
