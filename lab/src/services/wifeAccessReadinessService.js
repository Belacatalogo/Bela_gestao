import { getLabProducts } from './labDataService.js';
import { getConsolidatedRealData } from './realDataConsolidatorService.js';

const ACCESS_READINESS_KEY = 'belaGestaoLab.wifeAccessReadiness.v1';

function hasValue(value) {
  return String(value ?? '').trim().length > 0;
}

function countReadyProducts(products) {
  return products.filter((product) => {
    const syncStatus = product.catalogSyncStatus || '';
    if (syncStatus === 'pronto_catalogo') return true;
    return Boolean(product.name && product.imageUrl && Number(product.price || 0) > 0);
  }).length;
}

function buildChecklist({ labProducts, consolidated }) {
  const products = consolidated?.products || labProducts;
  const customers = consolidated?.customers || [];
  const sales = consolidated?.sales || [];
  const payments = consolidated?.payments || [];
  const readyProducts = countReadyProducts(products);
  const withPrice = products.filter((product) => Number(product.price || 0) > 0).length;
  const withImage = products.filter((product) => hasValue(product.imageUrl)).length;

  return [
    {
      id: 'products-present',
      label: 'Produtos reais carregados',
      ok: products.length > 0,
      detail: `${products.length} produto(s) encontrados no LAB/consolidado.`,
      severity: 'critical',
    },
    {
      id: 'products-ready',
      label: 'Produtos prontos para catálogo',
      ok: readyProducts > 0,
      detail: `${readyProducts} produto(s) parecem prontos para catálogo.`,
      severity: 'important',
    },
    {
      id: 'products-with-price',
      label: 'Produtos com preço',
      ok: withPrice > 0,
      detail: `${withPrice} produto(s) com preço.`,
      severity: 'important',
    },
    {
      id: 'products-with-image',
      label: 'Produtos com imagem',
      ok: withImage > 0,
      detail: `${withImage} produto(s) com imagem.`,
      severity: 'important',
    },
    {
      id: 'backup-consolidated',
      label: 'Dados consolidados salvos no LAB',
      ok: Boolean(consolidated),
      detail: consolidated ? `Consolidado em ${consolidated.consolidatedAt || 'data não informada'}.` : 'Ainda não há consolidação salva no LAB.',
      severity: 'critical',
    },
    {
      id: 'customers-migrated',
      label: 'Clientes migrados do backup',
      ok: customers.length > 0,
      detail: `${customers.length} cliente(s) consolidado(s).`,
      severity: 'important',
    },
    {
      id: 'sales-migrated',
      label: 'Vendas migradas do backup',
      ok: sales.length > 0,
      detail: `${sales.length} venda(s) consolidada(s).`,
      severity: 'important',
    },
    {
      id: 'payments-migrated',
      label: 'Parcelas/pagamentos migrados',
      ok: payments.length > 0,
      detail: `${payments.length} parcela(s)/pagamento(s) consolidado(s).`,
      severity: 'important',
    },
    {
      id: 'restore-missing',
      label: 'Backup/restore completo ainda pendente',
      ok: false,
      detail: 'Antes de uso real, falta criar exportação/restauração completa do novo Gestão.',
      severity: 'critical',
    },
    {
      id: 'auth-missing',
      label: 'Login/acesso real ainda pendente',
      ok: false,
      detail: 'Este bloco prepara o acesso, mas não libera login real de produção.',
      severity: 'critical',
    },
  ];
}

function computeReadiness(checklist) {
  const critical = checklist.filter((item) => item.severity === 'critical');
  const criticalOk = critical.filter((item) => item.ok).length;
  const important = checklist.filter((item) => item.severity === 'important');
  const importantOk = important.filter((item) => item.ok).length;
  const score = Math.round(((criticalOk / Math.max(critical.length, 1)) * 70) + ((importantOk / Math.max(important.length, 1)) * 30));

  let status = 'bloqueado';
  if (score >= 80) status = 'quase_pronto';
  if (score >= 95) status = 'pronto_para_teste';

  return {
    status,
    score,
    criticalOk,
    criticalTotal: critical.length,
    importantOk,
    importantTotal: important.length,
  };
}

export function buildWifeAccessReadiness() {
  const labProducts = getLabProducts();
  const consolidated = getConsolidatedRealData();
  const checklist = buildChecklist({ labProducts, consolidated });
  const readiness = computeReadiness(checklist);
  const nextBlocks = [
    'BLOCO 14D — Backup e restore completo do Gestão novo',
    'BLOCO 14E — Identidade visual definitiva do Gestão',
    'BLOCO 14F — Login/acesso controlado da esposa',
    'BLOCO 15A — Catálogo novo gerado pelo Gestão',
  ];

  const payload = {
    ok: true,
    generatedAt: new Date().toISOString(),
    environment: 'lab',
    productionAccessEnabled: false,
    firebaseWriteExecuted: false,
    catalogWriteExecuted: false,
    readiness,
    checklist,
    counts: {
      labProducts: labProducts.length,
      consolidatedProducts: consolidated?.products?.length || 0,
      consolidatedCustomers: consolidated?.customers?.length || 0,
      consolidatedSales: consolidated?.sales?.length || 0,
      consolidatedPayments: consolidated?.payments?.length || 0,
    },
    nextBlocks,
    message: 'Diagnóstico de acesso preparado. Uso real ainda não deve ser liberado antes de backup/restore e login controlado.',
  };

  try {
    window.localStorage.setItem(ACCESS_READINESS_KEY, JSON.stringify(payload));
  } catch {}

  return payload;
}
