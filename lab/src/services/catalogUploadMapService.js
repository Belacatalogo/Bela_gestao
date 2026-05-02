const CATALOG_REAL_FIELDS = [
  { field: 'id', label: 'ID real do produto', source: 'catálogo/Firebase real', required: true, labStatus: 'ID legado preservado quando vem do backup' },
  { field: 'name', label: 'Nome real do produto', source: 'catálogo/Firebase real', required: true, labStatus: 'placeholder Produto legado' },
  { field: 'brand', label: 'Marca', source: 'catálogo/Firebase real ou formulário Gestão', required: true, labStatus: 'Backup Real / LAB manual' },
  { field: 'price', label: 'Preço', source: 'JSON prices ou Firebase real', required: true, labStatus: 'importado do JSON' },
  { field: 'imageUrl', label: 'Foto/URL real', source: 'serviço externo de upload/URL automática', required: true, labStatus: 'foto LAB ou placeholder' },
  { field: 'category', label: 'Categoria real', source: 'catálogo/Firebase real', required: true, labStatus: 'backup-real ou categoria LAB' },
  { field: 'catalogTabs', label: 'Abas do catálogo', source: 'catálogo/Firebase real', required: true, labStatus: 'todos/backup-real no LAB' },
  { field: 'visibleInCatalog', label: 'Publicado/Oculto', source: 'Gestão real', required: true, labStatus: 'controlado no LAB local' },
];

const UPLOAD_URL_STEPS = [
  'usuária escolhe foto no Gestão',
  'sistema envia foto ao serviço de upload/URL',
  'serviço retorna URL pública/segura',
  'Gestão salva URL no produto',
  'Catálogo lê a mesma URL',
  'backup final precisa armazenar a URL e metadados da foto',
];

const BLOCKED_REAL_ACTIONS = [
  'enviar foto para serviço real sem validação',
  'substituir URL real de produto',
  'publicar produto no catálogo real',
  'alterar categoria/aba real',
  'escrever no Firebase real',
  'salvar credencial de upload no repositório',
];

export function getCatalogUploadMapReport() {
  return {
    generatedAt: new Date().toISOString(),
    mode: 'mapping-only',
    realCatalogConnected: false,
    realUploadConnected: false,
    realWritesBlocked: true,
    loginRequiredNow: false,
    fields: CATALOG_REAL_FIELDS,
    uploadUrlSteps: UPLOAD_URL_STEPS,
    blockedRealActions: BLOCKED_REAL_ACTIONS,
    nextRequirements: [
      'identificar onde o sistema real salva imageUrl',
      'identificar serviço usado para transformar foto em URL',
      'mapear categorias e abas reais existentes',
      'comparar produtos legados do backup com produtos reais do catálogo',
      'criar importação que preserve URL real quando disponível',
    ],
    compatibility: {
      jsonPricesCovered: true,
      jsonSalesCovered: true,
      jsonImagesCovered: false,
      jsonCategoriesCovered: false,
      jsonCatalogTabsCovered: false,
      labCanStoreImageUrl: true,
      labCanStoreCategories: true,
      labCanStoreCatalogTabs: true,
    },
  };
}
