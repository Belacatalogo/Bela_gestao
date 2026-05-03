import { renderProductFormModal, buildEmptyProductDraft, productToDraft, readProductForm } from './components/ProductFormModal.js';
import { APP_CONFIG, CRITICAL_FEATURES } from './config/appConfig.js';
import { getCatalogSyncReport } from './services/catalogContractService.js';
import { getDataGatewayStatus, getProduct, listProducts, resetProducts, saveProduct, toggleProductVisibility } from './services/dataGateway.js';
import { auditHistoryIntegrity } from './services/historyIntegrityService.js';
import { generateLabImageUrl } from './services/imageUploadLabService.js';
import { downloadLabBackup, importLabBackupFromText } from './services/labBackupService.js';
import { ensurePaymentForSale, getPaymentStats, syncPaymentsFromSales, updateLabPaymentStatus } from './services/labPaymentsService.js';
import { createLabSale, getLabSales, getSalesStats, updateLabSaleStatus } from './services/labSalesService.js';
import { getLegacyFunctionMap, getLegacyFunctionSummary, getBlockingItemsBeforeDelivery } from './services/legacyFunctionMapService.js';
import { analyzeLegacyBackupForOfflineMigration, getOfflineMigrationStatus, importLegacyBackupOfflineToLab } from './services/offlineMigrationService.js';
import { filterProducts, getProductCategories, getProductStats, PRODUCT_STATUS_FILTERS } from './services/productFilterService.js';
import { formatBRL } from './utils/money.js';

const uiState = {
  activeTab: window.localStorage.getItem('belaGestaoLab.cleanTab') || 'produtos',
  modalDraft: null,
  modalErrors: [],
  saleErrors: [],
  notice: '',
  legacyBackupText: '',
  migrationAnalysis: null,
  migrationImportResult: null,
  filters: { query: '', category: 'all', status: PRODUCT_STATUS_FILTERS.ALL },
};

const esc = (value) => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
const notice = (message) => { uiState.notice = message; };
const metric = (label, value, hint = '') => `<article class="clean-metric"><strong>${value}</strong><span>${label}</span>${hint ? `<small>${hint}</small>` : ''}</article>`;

function getState() {
  const gateway = listProducts();
  const products = gateway.products;
  const sales = getLabSales();
  const payments = syncPaymentsFromSales(sales);
  const historyAudit = auditHistoryIntegrity({ products, sales, payments });
  return {
    gateway,
    products,
    sales,
    payments,
    historyAudit,
    salesStats: getSalesStats(sales),
    paymentStats: getPaymentStats(payments),
    productStats: getProductStats(products),
    catalogReport: getCatalogSyncReport(products),
    environment: getDataGatewayStatus(),
    migrationStatus: getOfflineMigrationStatus(),
    functionMap: getLegacyFunctionMap(),
    functionSummary: getLegacyFunctionSummary(),
    blockingItems: getBlockingItemsBeforeDelivery(),
  };
}

function renderHero(state) {
  return `
    <section class="clean-hero">
      <div class="clean-hero-mark">BELA</div>
      <h1>Gestão de Vendas</h1>
      <p>Nova base modular com histórico de cliente, venda e parcela preservado mesmo se produto for removido.</p>
      <div class="clean-version-row"><span>${APP_CONFIG.version}</span><span>${APP_CONFIG.branch}</span><span>${state.environment.canWriteRealData ? 'real' : 'LAB seguro'}</span></div>
    </section>
  `;
}

function renderNav() {
  return `<nav class="clean-tab-nav" aria-label="Navegação principal">${[
    ['dashboard', 'Resumo'], ['produtos', 'Produtos'], ['vendas', 'Vendas'], ['pagamentos', 'Pagamentos'], ['catalogo', 'Catálogo'], ['ajustes', 'Ajustes'],
  ].map(([id, label]) => `<button class="clean-tab-btn ${uiState.activeTab === id ? 'active' : ''}" data-clean-tab="${id}">${label}</button>`).join('')}</nav>`;
}

function renderDashboard(state) {
  return `
    <section class="clean-section">
      <div class="clean-section-title"><span>Visão geral</span><h2>Resumo do negócio</h2></div>
      <div class="clean-metric-grid">
        ${metric('Produtos', state.productStats.total)}
        ${metric('Publicados', state.productStats.visible)}
        ${metric('Vendas', state.salesStats.count, formatBRL(state.salesStats.totalSold))}
        ${metric('Lucro estimado', formatBRL(state.salesStats.totalProfit))}
        ${metric('A receber', formatBRL(state.paymentStats.pendingAmount), `${state.paymentStats.pendingCount} pendência(s)`)}
        ${metric('Recebido', formatBRL(state.paymentStats.paidAmount), `${state.paymentStats.paidCount} pago(s)`)}
      </div>
      <div class="clean-card clean-warning-card"><h3>Histórico blindado</h3><p>Vendas e pagamentos agora guardam snapshots próprios. O valor da ficha da cliente não depende mais do produto continuar na lista.</p></div>
    </section>
  `;
}

function renderFilters(products) {
  const categories = getProductCategories(products);
  return `
    <div class="clean-filter-card">
      <input data-filter-query type="search" value="${esc(uiState.filters.query)}" placeholder="Buscar produto, marca ou categoria">
      <button class="secondary-button" data-apply-search>Buscar</button>
      <select data-filter-category><option value="all" ${uiState.filters.category === 'all' ? 'selected' : ''}>Todas as categorias</option>${categories.map((category) => `<option value="${esc(category)}" ${uiState.filters.category === category ? 'selected' : ''}>${esc(category)}</option>`).join('')}</select>
      <select data-filter-status><option value="all" ${uiState.filters.status === PRODUCT_STATUS_FILTERS.ALL ? 'selected' : ''}>Todos</option><option value="visible" ${uiState.filters.status === PRODUCT_STATUS_FILTERS.VISIBLE ? 'selected' : ''}>Publicados</option><option value="hidden" ${uiState.filters.status === PRODUCT_STATUS_FILTERS.HIDDEN ? 'selected' : ''}>Ocultos</option><option value="no-image" ${uiState.filters.status === PRODUCT_STATUS_FILTERS.NO_IMAGE ? 'selected' : ''}>Sem foto real</option></select>
      <button class="secondary-button" data-clear-filters>Limpar</button>
    </div>
  `;
}

function renderProductCard(product) {
  const hasLabPhoto = String(product.imageUrl || '').startsWith('data:image/') && !String(product.imageUrl || '').startsWith('data:image/svg+xml');
  const hasPlaceholder = String(product.imageUrl || '').startsWith('data:image/svg+xml');
  return `
    <article class="clean-product-card">
      <div class="clean-product-thumb"><img src="${esc(product.imageUrl || '')}" alt="${esc(product.name)}"></div>
      <div class="clean-product-body">
        <div class="clean-badge-row"><span>${esc(product.category || 'sem categoria')}</span>${product.visibleInCatalog ? '<span>Publicado</span>' : '<span>Oculto</span>'}${hasLabPhoto ? '<span>foto LAB</span>' : ''}${hasPlaceholder ? '<span>sem foto real</span>' : ''}</div>
        <h3>${esc(product.name)}</h3><p>${esc(product.brand)} · ${formatBRL(product.price)}</p>
        <div class="clean-actions-row"><button class="ghost-button" data-edit-product="${esc(product.id)}">Editar</button><button class="ghost-button" data-toggle-product="${esc(product.id)}">${product.visibleInCatalog ? 'Ocultar' : 'Publicar'}</button></div>
      </div>
    </article>
  `;
}

function renderProducts(state) {
  const visible = filterProducts(state.products, uiState.filters);
  return `
    <section class="clean-section">
      <div class="clean-section-title"><span>Produtos</span><h2>Catálogo interno</h2></div>
      <div class="clean-actions-main"><button class="primary-button" data-new-product>Novo produto</button><a class="secondary-button" href="./catalogo-preview/">Abrir catálogo fictício</a><button class="secondary-button" data-reset-products>Restaurar teste</button></div>
      ${renderFilters(state.products)}
      <div class="clean-count-line">Exibindo ${visible.length} de ${state.products.length} produto(s)</div>
      <div class="clean-product-list">${visible.length ? visible.map(renderProductCard).join('') : '<div class="empty-preview">Nenhum produto encontrado.</div>'}</div>
    </section>
  `;
}

function renderSales(state) {
  return `
    <section class="clean-section">
      <div class="clean-section-title"><span>Vendas</span><h2>Registro de compradores</h2></div>
      <form class="clean-form-card" data-sale-form>
        ${uiState.saleErrors.length ? `<div class="form-errors">${uiState.saleErrors.map((error) => `<div>${esc(error)}</div>`).join('')}</div>` : ''}
        <input name="clientName" placeholder="Nome da cliente" required>
        <select name="productId" required><option value="">Produto vendido</option>${state.products.map((product) => `<option value="${esc(product.id)}">${esc(product.name)} · ${formatBRL(product.price)}</option>`).join('')}</select>
        <input name="quantity" type="number" value="1" min="1" placeholder="Quantidade">
        <input name="unitPrice" type="number" step="0.01" placeholder="Preço final opcional">
        <select name="status"><option value="pendente">Pendente</option><option value="pago">Pago</option></select>
        <textarea name="notes" rows="2" placeholder="Observações"></textarea>
        <button class="primary-button" type="submit">Salvar venda</button>
      </form>
      <div class="clean-sale-list">${state.sales.length ? state.sales.map((sale) => `<article class="clean-card"><div class="clean-row-between"><h3>${esc(sale.clientName)}</h3><span>${sale.status === 'pago' ? 'Pago' : 'Pendente'}</span></div><p>${esc(sale.productName)} · ${sale.quantity} un. · ${formatBRL(sale.total)}</p><p>Snapshot: ${sale.productSnapshot ? 'produto preservado' : 'faltando'} · Cliente: ${sale.customer ? 'preservado' : 'faltando'}</p><div class="clean-actions-row"><button class="ghost-button" data-sale-status="${esc(sale.id)}" data-next-status="pago">Marcar pago</button><button class="ghost-button" data-sale-status="${esc(sale.id)}" data-next-status="pendente">Marcar pendente</button></div></article>`).join('') : '<div class="empty-preview">Nenhuma venda registrada no LAB.</div>'}</div>
    </section>
  `;
}

function renderPayments(state) {
  return `
    <section class="clean-section">
      <div class="clean-section-title"><span>Pagamentos</span><h2>Parcelas e recebimentos</h2></div>
      <div class="clean-metric-grid compact">${metric('A receber', formatBRL(state.paymentStats.pendingAmount))}${metric('Recebido', formatBRL(state.paymentStats.paidAmount))}${metric('Pendentes', state.paymentStats.pendingCount)}</div>
      <div class="clean-sale-list">${state.payments.length ? state.payments.map((payment) => `<article class="clean-card"><div class="clean-row-between"><h3>${esc(payment.saleClientName)}</h3><span>${payment.status === 'pago' ? 'Pago' : 'Pendente'}</span></div><p>${esc(payment.saleProductName)} · ${formatBRL(payment.amount)}</p><p>Snapshot da venda: ${payment.saleSnapshot ? 'preservado' : 'faltando'}</p><div class="clean-actions-row"><button class="ghost-button" data-payment-status="${esc(payment.id)}" data-next-status="pago">Recebido</button><button class="ghost-button" data-payment-status="${esc(payment.id)}" data-next-status="pendente">Pendente</button></div></article>`).join('') : '<div class="empty-preview">Nenhuma parcela gerada ainda.</div>'}</div>
    </section>
  `;
}

function renderCatalog(state) {
  return `<section class="clean-section"><div class="clean-section-title"><span>Catálogo</span><h2>Ligação Gestão ↔ Catálogo</h2></div><div class="clean-card"><h3>Contrato preservado</h3><p>O Gestão continua preparando produtos no formato necessário para o catálogo. A escrita real segue bloqueada até a validação final com Firebase.</p><div class="clean-metric-grid compact">${metric('Iriam ao catálogo', state.catalogReport.visibleProducts)}${metric('Categorias', state.catalogReport.categories.length)}${metric('Alertas', state.catalogReport.warningProducts)}</div><div class="clean-actions-row"><a class="secondary-button" href="./catalogo-preview/">Ver prévia fictícia</a></div></div></section>`;
}

function renderMigrationPanel(state) {
  const analysis = uiState.migrationAnalysis;
  const importResult = uiState.migrationImportResult;
  return `<div class="clean-card clean-warning-card"><h3>Migração offline do sistema antigo</h3><p>Use um backup/export antigo para testar a migração no LAB. Nada aqui altera o sistema ativo da sua esposa.</p><div class="clean-lock-grid">${state.migrationStatus.lockedRealTargets.map((item) => `<span>${esc(item)} bloqueado</span>`).join('')}</div><div class="clean-actions-row"><label class="secondary-button clean-file-button">Analisar backup antigo<input type="file" accept="application/json,.json" data-analyze-legacy-backup hidden></label>${analysis?.ok ? '<button class="primary-button" data-import-legacy-offline>Importar para LAB</button>' : ''}</div>${analysis ? `<div class="clean-migration-result"><h4>${analysis.ok ? 'Análise segura concluída' : 'Falha na análise'}</h4><p>${esc(analysis.ok ? analysis.summary : analysis.error)}</p>${analysis.ok ? `<div class="clean-metric-grid compact">${metric('Preços', analysis.audit.counts.prices)}${metric('Vendas', analysis.audit.counts.sales)}${metric('Parcelas', analysis.audit.counts.installmentsTotal)}</div><p><strong>Simulação:</strong> Firebase real: não · Login Google: não · Catálogo real: não · Sistema ativo: não.</p>` : ''}</div>` : ''}${importResult ? `<div class="clean-migration-result"><h4>${importResult.ok ? 'Importação LAB concluída' : 'Importação não concluída'}</h4><p>${esc(importResult.message || importResult.error || '')}</p></div>` : ''}</div>`;
}

function renderHistoryAudit(state) {
  const audit = state.historyAudit;
  return `
    <div class="clean-card clean-warning-card">
      <h3>Auditoria de histórico</h3>
      <p>Confirma se vendas e pagamentos têm cópias próprias dos dados importantes, sem depender da lista atual de produtos.</p>
      <div class="clean-metric-grid compact">
        ${metric('Vendas blindadas', audit.counts.salesWithSnapshot)}
        ${metric('Pagamentos blindados', audit.counts.paymentsWithSnapshot)}
        ${metric('Alertas', audit.warnings.length)}
      </div>
      <ul class="clean-feature-list">${audit.guarantees.map((item) => `<li>${esc(item)}</li>`).join('')}</ul>
      ${audit.warnings.length ? `<div class="clean-migration-result"><h4>Ajustes necessários</h4><ul>${audit.warnings.map((warning) => `<li>${esc(warning)}</li>`).join('')}</ul></div>` : '<div class="clean-migration-result"><h4>Histórico protegido</h4><p>Nenhuma venda ou parcela depende exclusivamente do produto atual.</p></div>'}
    </div>
  `;
}

function statusLabel(status) { return ({ confirmed: 'Confirmado', partial: 'Parcial', 'needs-validation': 'Validar', 'blocked-in-lab': 'Bloqueado' }[status] || status); }
function renderFunctionMap(state) { return `<div class="clean-card"><h3>Mapa real de funções antigas</h3><p>Lista do que precisa ser preservado antes de entregar o sistema final. Isto é apenas mapeamento: nada real é conectado aqui.</p><div class="clean-metric-grid compact">${metric('Mapeadas', state.functionSummary.total)}${metric('Confirmadas', state.functionSummary.confirmed || 0)}${metric('Pendentes', state.blockingItems.length)}</div><div class="legacy-function-list">${state.functionMap.map((item) => `<details class="legacy-function-card"><summary><span>${esc(item.title)}</span><strong class="legacy-status ${esc(item.status)}">${statusLabel(item.status)}</strong></summary><p>${esc(item.currentSystemRole)}</p><h4>Precisa preservar</h4><ul>${item.mustPreserve.map((entry) => `<li>${esc(entry)}</li>`).join('')}</ul><h4>Evidências</h4><ul>${item.evidence.map((entry) => `<li>${esc(entry)}</li>`).join('')}</ul><h4>Próximo passo</h4><p>${esc(item.nextStep)}</p></details>`).join('')}</div></div>`; }

function renderSettings(state) {
  return `<section class="clean-section"><div class="clean-section-title"><span>Ajustes</span><h2>Backup, segurança e histórico</h2></div><div class="clean-card"><h3>Backup LAB</h3><p>Exporta e importa apenas dados do ambiente LAB/localStorage. Não escreve no Firebase real.</p><div class="clean-actions-row"><button class="primary-button" data-export-backup>Exportar backup LAB</button><label class="secondary-button clean-file-button">Importar backup LAB<input type="file" accept="application/json,.json" data-import-backup hidden></label></div></div>${renderHistoryAudit(state)}${renderMigrationPanel(state)}${renderFunctionMap(state)}<div class="clean-card"><h3>Funções finais que precisam continuar</h3><ul class="clean-feature-list">${CRITICAL_FEATURES.map((feature) => `<li>${esc(feature)}</li>`).join('')}</ul></div></section>`;
}

function renderActiveTab(state) {
  return ({ dashboard: renderDashboard, produtos: renderProducts, vendas: renderSales, pagamentos: renderPayments, catalogo: renderCatalog, ajustes: renderSettings }[uiState.activeTab] || renderProducts)(state);
}

function render(root) {
  const state = getState();
  root.innerHTML = `<main class="clean-page">${renderHero(state)}${renderNav()}${uiState.notice ? `<div class="clean-notice">${esc(uiState.notice)}</div>` : ''}${renderActiveTab(state)}</main>${renderProductFormModal({ draft: uiState.modalDraft, errors: uiState.modalErrors, isEditing: Boolean(uiState.modalDraft?.id) })}`;
  bind(root);
}

async function saveProductFromForm(root, form) {
  const draft = readProductForm(form);
  const upload = await generateLabImageUrl(draft.imageFile);
  if (!upload.ok) { uiState.modalDraft = draft; uiState.modalErrors = [upload.error || 'Não foi possível processar a imagem.']; render(root); return; }
  if (upload.imageUrl) draft.imageUrl = upload.imageUrl;
  const result = saveProduct(draft);
  if (!result.ok) { uiState.modalDraft = draft; uiState.modalErrors = result.errors || [result.message || 'Não foi possível salvar.']; render(root); return; }
  uiState.modalDraft = null; uiState.modalErrors = []; notice('Produto salvo no LAB.'); render(root);
}

async function importBackup(root, input) {
  const file = input.files?.[0];
  if (!file) return;
  const result = importLabBackupFromText(await file.text());
  notice(result.ok ? `Backup LAB importado: ${result.importedKeys.length} chave(s).` : result.error || 'Falha ao importar backup LAB.');
  render(root);
}

async function analyzeLegacyBackup(root, input) {
  const file = input.files?.[0];
  if (!file) return;
  uiState.legacyBackupText = await file.text();
  uiState.migrationAnalysis = analyzeLegacyBackupForOfflineMigration(uiState.legacyBackupText);
  uiState.migrationImportResult = null;
  notice(uiState.migrationAnalysis.ok ? 'Backup antigo analisado em modo offline.' : 'Backup antigo não pôde ser analisado.');
  render(root);
}

function importLegacyOffline(root) {
  if (!uiState.legacyBackupText) { notice('Analise um backup antigo antes de importar.'); render(root); return; }
  uiState.migrationImportResult = importLegacyBackupOfflineToLab(uiState.legacyBackupText, { anonymize: false });
  notice(uiState.migrationImportResult.ok ? uiState.migrationImportResult.message : uiState.migrationImportResult.error || 'Não foi possível importar para LAB.');
  render(root);
}

function bind(root) {
  root.querySelectorAll('[data-clean-tab]').forEach((button) => button.addEventListener('click', () => { uiState.activeTab = button.getAttribute('data-clean-tab'); window.localStorage.setItem('belaGestaoLab.cleanTab', uiState.activeTab); uiState.notice = ''; render(root); }));
  root.querySelector('[data-new-product]')?.addEventListener('click', () => { uiState.modalDraft = buildEmptyProductDraft(); uiState.modalErrors = []; render(root); });
  root.querySelectorAll('[data-edit-product]').forEach((button) => button.addEventListener('click', () => { uiState.modalDraft = productToDraft(getProduct(button.getAttribute('data-edit-product'))); uiState.modalErrors = []; render(root); }));
  root.querySelectorAll('[data-toggle-product]').forEach((button) => button.addEventListener('click', () => { const result = toggleProductVisibility(button.getAttribute('data-toggle-product')); notice(result.message || 'Visibilidade alterada.'); render(root); }));
  root.querySelector('[data-reset-products]')?.addEventListener('click', () => { const result = resetProducts(); notice(result.message || 'Produtos de teste restaurados.'); render(root); });
  const queryInput = root.querySelector('[data-filter-query]');
  const applySearch = () => { uiState.filters.query = queryInput?.value || ''; render(root); };
  queryInput?.addEventListener('keydown', (event) => { if (event.key === 'Enter') { event.preventDefault(); applySearch(); } });
  root.querySelector('[data-apply-search]')?.addEventListener('click', applySearch);
  root.querySelector('[data-filter-category]')?.addEventListener('change', (event) => { uiState.filters.category = event.target.value; render(root); });
  root.querySelector('[data-filter-status]')?.addEventListener('change', (event) => { uiState.filters.status = event.target.value; render(root); });
  root.querySelector('[data-clear-filters]')?.addEventListener('click', () => { uiState.filters = { query: '', category: 'all', status: PRODUCT_STATUS_FILTERS.ALL }; render(root); });
  root.querySelector('[data-sale-form]')?.addEventListener('submit', (event) => { event.preventDefault(); const result = createLabSale(Object.fromEntries(new FormData(event.currentTarget)), listProducts().products); if (!result.ok) { uiState.saleErrors = result.errors || ['Não foi possível registrar a venda.']; render(root); return; } ensurePaymentForSale(result.sale); uiState.saleErrors = []; notice('Venda salva com snapshot de cliente/produto e pagamento criado.'); render(root); });
  root.querySelectorAll('[data-sale-status]').forEach((button) => button.addEventListener('click', () => { updateLabSaleStatus(button.getAttribute('data-sale-status'), button.getAttribute('data-next-status')); notice('Status da venda atualizado.'); render(root); }));
  root.querySelectorAll('[data-payment-status]').forEach((button) => button.addEventListener('click', () => { updateLabPaymentStatus(button.getAttribute('data-payment-status'), button.getAttribute('data-next-status')); notice('Pagamento atualizado.'); render(root); }));
  root.querySelector('[data-export-backup]')?.addEventListener('click', () => { const result = downloadLabBackup(); notice(result.ok ? 'Backup LAB exportado.' : result.error || 'Falha ao exportar backup.'); render(root); });
  root.querySelector('[data-import-backup]')?.addEventListener('change', (event) => importBackup(root, event.currentTarget));
  root.querySelector('[data-analyze-legacy-backup]')?.addEventListener('change', (event) => analyzeLegacyBackup(root, event.currentTarget));
  root.querySelector('[data-import-legacy-offline]')?.addEventListener('click', () => importLegacyOffline(root));
  root.querySelectorAll('[data-close-modal], [data-modal-backdrop]').forEach((element) => element.addEventListener('click', (event) => { if (event.target !== element && !element.hasAttribute('data-close-modal')) return; uiState.modalDraft = null; uiState.modalErrors = []; render(root); }));
  root.querySelector('[data-product-form]')?.addEventListener('submit', (event) => { event.preventDefault(); saveProductFromForm(root, event.currentTarget); });
}

export function renderCleanApp(root) { if (root) render(root); }
