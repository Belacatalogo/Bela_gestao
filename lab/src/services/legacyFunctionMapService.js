export const LEGACY_FUNCTION_STATUS = Object.freeze({
  CONFIRMED: 'confirmed',
  PARTIAL: 'partial',
  NEEDS_VALIDATION: 'needs-validation',
  BLOCKED_IN_LAB: 'blocked-in-lab',
});

export const LEGACY_FUNCTION_MAP = Object.freeze([
  {
    id: 'products',
    title: 'Produtos',
    status: LEGACY_FUNCTION_STATUS.PARTIAL,
    currentSystemRole: 'Cadastro, edição, preço, custo, publicação/ocultação e ligação com catálogo.',
    evidence: [
      'index.html antigo contém interface de produtos, cards, preço, custo/lucro, busca e filtros.',
      'Backup antigo contém chave prices com 71 registros no teste enviado pelo usuário.',
      'LAB novo já tem cadastro/edição de produtos fictícios e contrato de catálogo.',
    ],
    mustPreserve: [
      'Adicionar produto sem quebrar catálogo.',
      'Editar nome, marca, descrição, preço e custo.',
      'Publicar/ocultar produto.',
      'Não apagar histórico financeiro se produto for removido.',
    ],
    nextStep: 'Mapear campos reais do produto no catálogo e no Firebase antes de liberar escrita real.',
  },
  {
    id: 'catalog-sync',
    title: 'Ligação Gestão ↔ Catálogo',
    status: LEGACY_FUNCTION_STATUS.PARTIAL,
    currentSystemRole: 'Produto criado no Gestão precisa aparecer/atualizar/sumir no catálogo público.',
    evidence: [
      'Contrato docs/contrato-gestao-catalogo.md já define o fluxo Gestão → fonte compartilhada/Firebase → Catálogo.',
      'LAB possui catálogo fictício para testar publicação sem tocar produção.',
    ],
    mustPreserve: [
      'Produto publicado aparece no catálogo.',
      'Produto oculto some do catálogo.',
      'Categorias e abas continuam compatíveis.',
      'Catálogo real não pode ser alterado durante LAB.',
    ],
    nextStep: 'Ler o repositório Belacatalogo/Bela-catalogo e mapear exatamente quais campos ele consome.',
  },
  {
    id: 'photo-upload',
    title: 'Upload de foto / URL automática',
    status: LEGACY_FUNCTION_STATUS.PARTIAL,
    currentSystemRole: 'Usuária envia foto e o sistema obtém uma URL utilizável no catálogo.',
    evidence: [
      'Usuário confirmou que no sistema real a imagem não é inserida manualmente por URL.',
      'LAB já gera data:image local para teste, sem serviço externo real.',
    ],
    mustPreserve: [
      'Selecionar foto no iPhone.',
      'Gerar URL automaticamente.',
      'Salvar imagem no produto.',
      'Exibir imagem no catálogo.',
    ],
    nextStep: 'Mapear o serviço externo real usado para transformar foto em URL, sem expor segredo.',
  },
  {
    id: 'sales',
    title: 'Vendas e compradores',
    status: LEGACY_FUNCTION_STATUS.CONFIRMED,
    currentSystemRole: 'Registrar compradores/clientes associados a produtos e valores.',
    evidence: [
      'Backup antigo contém chave sales.',
      'Auditoria de backup detecta campos name, phone, cpf, sid, paid, count, purchaseDate e qty.',
      'Teste do usuário mostrou 18 vendas em backup antigo.',
    ],
    mustPreserve: [
      'Nome da cliente.',
      'Telefone e CPF quando existirem.',
      'Produto vendido.',
      'Quantidade, valor, data e observações.',
      'Histórico não pode sumir se produto for apagado.',
    ],
    nextStep: 'Criar modelo final Sale/Customer separado de Product para preservar histórico.',
  },
  {
    id: 'payments',
    title: 'Pagamentos e parcelas',
    status: LEGACY_FUNCTION_STATUS.CONFIRMED,
    currentSystemRole: 'Controlar parcelas pagas/pendentes, vencimento, observações e histórico.',
    evidence: [
      'Backup antigo contém pagMeta.',
      'Auditoria detecta vencimento, observação, data e histórico de parcelas.',
      'Teste do usuário mostrou 33 parcelas, 11 pagas e 22 pendentes.',
    ],
    mustPreserve: [
      'Status pago/pendente por parcela.',
      'Quantidade de parcelas.',
      'Vencimento.',
      'Observações.',
      'Histórico de pagamento.',
    ],
    nextStep: 'Criar modelo final Payment separado de Product e Sale.',
  },
  {
    id: 'firebase-google',
    title: 'Firebase, login Google e backup automático',
    status: LEGACY_FUNCTION_STATUS.NEEDS_VALIDATION,
    currentSystemRole: 'Sistema ativo da esposa usa Google/Firebase e backup automático, segundo confirmação do usuário.',
    evidence: [
      'Usuário confirmou que os dados da esposa no sistema antigo são salvos/backup via Firebase e conectados via Google.',
      'LAB mantém Firebase real bloqueado e ainda não pede login Google.',
    ],
    mustPreserve: [
      'Login com a conta correta.',
      'Leitura segura antes de escrita.',
      'Backup automático atual sem interrupção.',
      'Backup completo antes da migração final.',
      'Rollback se a migração falhar.',
    ],
    nextStep: 'Implementar etapa futura de leitura real somente leitura, nunca escrita direta, após backup completo.',
  },
  {
    id: 'ai-product',
    title: 'IA na criação de produto',
    status: LEGACY_FUNCTION_STATUS.NEEDS_VALIDATION,
    currentSystemRole: 'Função de IA ajuda na adição/descrição de novo produto.',
    evidence: [
      'Usuário confirmou que existe função de IA na adição do novo produto.',
      'Handoff registra IA como função crítica que não pode ser removida.',
    ],
    mustPreserve: [
      'Gerar/ajustar descrição do produto.',
      'Não expor chave sensível.',
      'Não enviar automaticamente sem ação da usuária.',
      'Fallback manual se IA falhar.',
    ],
    nextStep: 'Mapear implementação antiga de IA e criar aiProductService modular com fallback manual.',
  },
  {
    id: 'whatsapp',
    title: 'WhatsApp',
    status: LEGACY_FUNCTION_STATUS.PARTIAL,
    currentSystemRole: 'Enviar mensagens para clientes e/ou abrir conversa com dados de venda/pagamento.',
    evidence: [
      'Sistema antigo possui botões/estilos de WhatsApp em pagamentos e catálogo.',
      'LAB possui whatsappLabService para gerar link seguro.',
    ],
    mustPreserve: [
      'Abrir WhatsApp com mensagem pronta.',
      'Não enviar automaticamente sem toque da usuária.',
      'Usar telefone da cliente quando existir.',
    ],
    nextStep: 'Mapear mensagens reais antigas antes de portar para produção.',
  },
  {
    id: 'pwa-iphone',
    title: 'PWA/iPhone',
    status: LEGACY_FUNCTION_STATUS.PARTIAL,
    currentSystemRole: 'Sistema funciona instalado/aberto no iPhone.',
    evidence: [
      'index.html antigo gera manifest, ícone e service worker inline.',
      'LAB usa manifest e service worker separados.',
    ],
    mustPreserve: [
      'Abrir bem no iPhone.',
      'Não quebrar cache.',
      'Versão visível para confirmar deploy.',
    ],
    nextStep: 'Testar PWA no iPhone após cada bloco importante.',
  },
]);

export function getLegacyFunctionMap() {
  return LEGACY_FUNCTION_MAP;
}

export function getLegacyFunctionSummary() {
  return LEGACY_FUNCTION_MAP.reduce((summary, item) => {
    summary.total += 1;
    summary[item.status] = (summary[item.status] || 0) + 1;
    return summary;
  }, { total: 0 });
}

export function getBlockingItemsBeforeDelivery() {
  return LEGACY_FUNCTION_MAP.filter((item) => item.status !== LEGACY_FUNCTION_STATUS.CONFIRMED);
}
