const COMPATIBILITY_ROWS = [
  {
    area: 'Produtos / IDs reais',
    jsonManual: 'parcial',
    firebasePlanned: 'obrigatorio',
    labStatus: 'produto legado criado pelo ID',
    note: 'JSON traz IDs e preços, mas não garante nome/foto real do produto.',
  },
  {
    area: 'Preços',
    jsonManual: 'coberto',
    firebasePlanned: 'obrigatorio',
    labStatus: 'importado',
    note: 'prices já vira preço do Produto legado no LAB.',
  },
  {
    area: 'Vendas',
    jsonManual: 'coberto',
    firebasePlanned: 'obrigatorio',
    labStatus: 'importado',
    note: 'sales já vira Vendas LAB.',
  },
  {
    area: 'Clientes',
    jsonManual: 'coberto',
    firebasePlanned: 'obrigatorio',
    labStatus: 'importado/anonimizavel',
    note: 'nome, telefone e CPF podem ser preservados ou anonimizados.',
  },
  {
    area: 'Parcelas',
    jsonManual: 'coberto',
    firebasePlanned: 'obrigatorio',
    labStatus: 'importado',
    note: 'paid[] vira parcelas LAB.',
  },
  {
    area: 'Vencimentos',
    jsonManual: 'coberto',
    firebasePlanned: 'obrigatorio',
    labStatus: 'importado',
    note: 'pagMeta.venc já aparece em Pagamentos LAB.',
  },
  {
    area: 'Observações',
    jsonManual: 'coberto',
    firebasePlanned: 'obrigatorio',
    labStatus: 'importado',
    note: 'pagMeta.obs já é preservado quando existe.',
  },
  {
    area: 'Histórico de pagamento',
    jsonManual: 'coberto',
    firebasePlanned: 'obrigatorio',
    labStatus: 'importado',
    note: 'pagMeta.parcHist já aparece como histórico.',
  },
  {
    area: 'Fotos / URLs reais',
    jsonManual: 'nao-coberto',
    firebasePlanned: 'obrigatorio',
    labStatus: 'placeholder',
    note: 'Precisa mapear catálogo/fonte real de produtos e upload externo.',
  },
  {
    area: 'Categorias / abas do catálogo',
    jsonManual: 'nao-coberto',
    firebasePlanned: 'obrigatorio',
    labStatus: 'categoria backup-real',
    note: 'Precisa vir da fonte real do catálogo.',
  },
  {
    area: 'Configurações do sistema',
    jsonManual: 'parcial',
    firebasePlanned: 'obrigatorio',
    labStatus: 'LAB separado',
    note: 'Backup final precisa armazenar configurações completas.',
  },
  {
    area: 'Funções/configurações de IA',
    jsonManual: 'desconhecido',
    firebasePlanned: 'obrigatorio-sem-chave-publica',
    labStatus: 'função crítica registrada',
    note: 'IA deve ser mapeada sem expor chave sensível no repositório/backup público.',
  },
  {
    area: 'Backup automático diário',
    jsonManual: 'manual',
    firebasePlanned: 'obrigatorio',
    labStatus: 'planejado',
    note: 'Firebase deve gerar snapshot automático além do JSON manual.',
  },
];

function countByStatus(rows, field, expected) {
  return rows.filter((row) => row[field] === expected).length;
}

export function getSourceCompatibilityReport() {
  return {
    generatedAt: new Date().toISOString(),
    rows: COMPATIBILITY_ROWS,
    counts: {
      areas: COMPATIBILITY_ROWS.length,
      jsonCovered: countByStatus(COMPATIBILITY_ROWS, 'jsonManual', 'coberto'),
      jsonPartial: countByStatus(COMPATIBILITY_ROWS, 'jsonManual', 'parcial'),
      jsonNotCovered: countByStatus(COMPATIBILITY_ROWS, 'jsonManual', 'nao-coberto'),
      firebaseRequired: COMPATIBILITY_ROWS.filter((row) => String(row.firebasePlanned).startsWith('obrigatorio')).length,
    },
    blockersBeforeRealFirebase: [
      'mapear coleção real de produtos/catálogo',
      'mapear onde ficam fotos/URLs reais',
      'mapear configurações reais e IA',
      'definir como backup diário Firebase será restaurado com segurança',
      'manter escrita real bloqueada até validação final',
    ],
  };
}
