const FIREBASE_REQUIRED_CONFIG_FIELDS = [
  'apiKey',
  'authDomain',
  'projectId',
  'storageBucket',
  'messagingSenderId',
  'appId',
];

const FIREBASE_REQUIRED_DATA_AREAS = [
  'produtos/catalogo',
  'precos',
  'vendas',
  'clientes',
  'pagamentos/parcelas',
  'pagMeta/vencimentos/observacoes',
  'backups diarios',
  'configuracoes',
  'configuracoes de IA sem chave exposta',
];

export function getFirebaseReadinessReport() {
  return {
    generatedAt: new Date().toISOString(),
    mode: 'readiness-only',
    loginRequiredNow: false,
    wifeLoginRequiredOnlyInFinal: true,
    firebaseConnected: false,
    authConnected: false,
    firestoreConnected: false,
    storageConnected: false,
    realWritesBlocked: true,
    catalogWritesBlocked: true,
    requiredConfigFields: FIREBASE_REQUIRED_CONFIG_FIELDS,
    requiredDataAreas: FIREBASE_REQUIRED_DATA_AREAS,
    plannedReadOnlySteps: [
      'receber configuração Firebase de forma segura',
      'validar campos obrigatórios sem salvar segredo no repositório',
      'ativar leitura somente leitura',
      'listar coleções/chaves disponíveis',
      'comparar Firebase com backup JSON manual',
      'bloquear qualquer escrita até aprovação final',
    ],
    blockedActions: [
      'criar produto real',
      'editar produto real',
      'apagar produto real',
      'publicar no catálogo real',
      'alterar vendas reais',
      'alterar pagamentos reais',
      'restaurar backup sobre Firebase real',
    ],
  };
}

export function readFirebaseReadonlyPlaceholder() {
  return {
    ok: false,
    blocked: true,
    reason: 'Firebase real ainda não foi conectado neste bloco.',
    message: 'Leitura Firebase real será ativada em bloco futuro, com credenciais seguras e sem escrita.',
    data: null,
  };
}
