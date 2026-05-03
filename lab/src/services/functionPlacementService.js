export const FUNCTION_PLACEMENT_GROUPS = Object.freeze([
  {
    section: 'Produtos',
    dailyUse: true,
    description: 'Tudo que a esposa usa para cadastrar, editar e preparar produtos para o catálogo.',
    items: [
      { name: 'Adicionar produto', status: 'no-lugar', target: 'Produtos → Novo produto' },
      { name: 'Editar produto', status: 'no-lugar', target: 'Produtos → Card do produto → Editar' },
      { name: 'Enviar foto', status: 'no-lugar-lab', target: 'Produtos → Novo/Editar produto → Enviar foto' },
      { name: 'Publicar/ocultar no catálogo', status: 'no-lugar-lab', target: 'Produtos → Card do produto → Publicar/Ocultar' },
      { name: 'IA de descrição de produto', status: 'pendente', target: 'Produtos → Novo/Editar produto' },
    ],
  },
  {
    section: 'Vendas',
    dailyUse: true,
    description: 'Registro de cliente, produto vendido, valor, lucro e histórico seguro.',
    items: [
      { name: 'Registrar cliente/compradora', status: 'no-lugar', target: 'Vendas → Formulário de venda' },
      { name: 'Produto vendido', status: 'no-lugar', target: 'Vendas → Produto vendido' },
      { name: 'Valor final da venda', status: 'no-lugar', target: 'Vendas → Preço final opcional' },
      { name: 'Histórico preservado', status: 'no-lugar', target: 'Vendas → Snapshot preservado' },
      { name: 'Lucro', status: 'parcial', target: 'Resumo/Vendas → Lucro estimado' },
    ],
  },
  {
    section: 'Pagamentos',
    dailyUse: true,
    description: 'Controle de recebido, pendente, parcelas e cobrança.',
    items: [
      { name: 'Pagamento recebido/pendente', status: 'no-lugar', target: 'Pagamentos → Card do pagamento' },
      { name: 'Valor da parcela', status: 'no-lugar', target: 'Pagamentos → Valor próprio do pagamento' },
      { name: 'Parcelas múltiplas', status: 'pendente', target: 'Pagamentos → Controle de parcelas' },
      { name: 'WhatsApp de cobrança', status: 'pendente', target: 'Pagamentos → Botão WhatsApp' },
      { name: 'Observações/vencimento', status: 'pendente', target: 'Pagamentos → Detalhe do pagamento' },
    ],
  },
  {
    section: 'Catálogo',
    dailyUse: true,
    description: 'Prévia e status da ligação Gestão ↔ Catálogo.',
    items: [
      { name: 'Preview do catálogo', status: 'no-lugar-lab', target: 'Catálogo → Ver prévia fictícia' },
      { name: 'Produtos que iriam ao catálogo', status: 'no-lugar-lab', target: 'Catálogo → Métricas' },
      { name: 'Categorias/abas', status: 'parcial', target: 'Catálogo → Categorias' },
      { name: 'Escrita no catálogo real', status: 'bloqueado', target: 'Futuro Firebase/Catálogo controlado' },
    ],
  },
  {
    section: 'Ajustes',
    dailyUse: false,
    description: 'Área administrativa. No produto final, ferramentas LAB devem ficar recolhidas ou protegidas.',
    items: [
      { name: 'Backup LAB', status: 'lab', target: 'Ajustes → Ferramentas LAB' },
      { name: 'Migração offline do sistema antigo', status: 'lab', target: 'Ajustes → Ferramentas LAB' },
      { name: 'Auditoria de histórico', status: 'lab', target: 'Ajustes → Ferramentas LAB' },
      { name: 'Mapa de funções antigas', status: 'lab', target: 'Ajustes → Ferramentas LAB' },
      { name: 'Login Google/Firebase real', status: 'bloqueado', target: 'Futuro modo leitura controlada' },
    ],
  },
]);

export function getFunctionPlacementGroups() {
  return FUNCTION_PLACEMENT_GROUPS;
}

export function getFunctionPlacementSummary() {
  const allItems = FUNCTION_PLACEMENT_GROUPS.flatMap((group) => group.items);
  return allItems.reduce((summary, item) => {
    summary.total += 1;
    summary[item.status] = (summary[item.status] || 0) + 1;
    return summary;
  }, { total: 0 });
}

export function getDailyUseGroups() {
  return FUNCTION_PLACEMENT_GROUPS.filter((group) => group.dailyUse);
}

export function getLabToolGroups() {
  return FUNCTION_PLACEMENT_GROUPS.filter((group) => !group.dailyUse);
}
