const AI_FUNCTIONS = [
  {
    id: 'catalog-description',
    label: 'Gerar descrição de produto',
    purpose: 'Ajudar a escrever descrição comercial para produtos do catálogo.',
    backupPolicy: 'salvar resultado e configurações não sensíveis',
    sensitive: false,
    status: 'planejado/mapear sistema real',
  },
  {
    id: 'whatsapp-message',
    label: 'Gerar mensagem para WhatsApp',
    purpose: 'Criar mensagens de venda, cobrança, confirmação e atendimento.',
    backupPolicy: 'salvar templates e histórico quando existir',
    sensitive: false,
    status: 'LAB já tem templates fixos; IA real ainda não conectada',
  },
  {
    id: 'sales-insights',
    label: 'Resumo inteligente de vendas',
    purpose: 'Gerar análise de pendências, clientes e vendas.',
    backupPolicy: 'salvar preferências e relatórios gerados quando necessário',
    sensitive: true,
    status: 'planejado',
  },
  {
    id: 'image-support',
    label: 'Apoio para imagem/foto de produto',
    purpose: 'Ajudar com título, categoria ou descrição a partir de foto/URL.',
    backupPolicy: 'salvar somente metadados e resultado aprovado',
    sensitive: true,
    status: 'planejado; não chamar API real no LAB',
  },
];

const AI_BACKUP_REQUIREMENTS = [
  'templates de prompts aprovados',
  'preferências de tom e estilo',
  'modelos/configurações não sensíveis',
  'resultados aprovados usados no catálogo',
  'histórico essencial de mensagens se fizer parte do sistema',
  'flags de uso/ativação das funções',
];

const NEVER_STORE_PUBLICLY = [
  'API keys',
  'tokens de acesso',
  'secrets de backend',
  'credenciais Firebase privadas',
  'dados sensíveis de clientes em exemplos públicos',
  'prompts com segredos operacionais',
];

export function getAiFunctionsMapReport() {
  return {
    generatedAt: new Date().toISOString(),
    mode: 'mapping-only',
    aiApiConnected: false,
    realCallsEnabled: false,
    keysStoredInRepo: false,
    backupMustIncludeAiConfig: true,
    functions: AI_FUNCTIONS,
    backupRequirements: AI_BACKUP_REQUIREMENTS,
    neverStorePublicly: NEVER_STORE_PUBLICLY,
    safetyRules: [
      'IA real só será conectada depois que dados, backup e permissões estiverem estáveis.',
      'Chaves de API não devem ser salvas no repositório.',
      'Backup final pode guardar configuração de IA, mas não segredo sensível.',
      'Resultado gerado por IA só deve ir para catálogo real após confirmação da usuária.',
      'Dados de cliente usados em IA precisam ser tratados como sensíveis.',
    ],
    compatibility: {
      labWhatsappTemplatesReady: true,
      labAiPanelReady: false,
      realAiConnected: false,
      backupPolicyDefined: true,
    },
  };
}
