import { renderDashboardPanel } from './components/DashboardPanel.js';
import { renderDiagnosticsPanel } from './components/DiagnosticsPanel.js';
import { renderLegacyBackupAuditPanel } from './components/LegacyBackupAuditPanel.js';
import { renderPaymentsPanel } from './components/PaymentsPanel.js';
import { renderProductFormModal, buildEmptyProductDraft, productToDraft, readProductForm } from './components/ProductFormModal.js';
import { renderPwaStatusPanel } from './components/PwaStatusPanel.js';
import { renderSalesPanel, readSaleForm } from './components/SalesPanel.js';
import { renderSettingsBackupPanel } from './components/SettingsBackupPanel.js';
import { renderWhatsAppPanel } from './components/WhatsAppPanel.js';
import { APP_CONFIG, CRITICAL_FEATURES } from './config/appConfig.js';
import { getCatalogSyncReport } from './services/catalogContractService.js';
import { getDataGatewayStatus, getProduct, listProducts, resetProducts, saveProduct, toggleProductVisibility } from './services/dataGateway.js';
import { buildDiagnosticsReport, clearDiagnosticEvents, copyDiagnosticsReport, installRuntimeDiagnostics, logDiagnosticEvent } from './services/diagnosticsService.js';
import { DATA_MODES, setCurrentDataMode } from './services/environmentService.js';
import { generateLabImageUrl } from './services/imageUploadLabService.js';
import { clearLabStorageByPrefix, downloadLabBackup, getLabStorageKeys, importLabBackupFromText } from './services/labBackupService.js';
import { auditLegacyBackupText, summarizeLegacyAudit } from './services/legacyBackupAuditService.js';
import { importLegacyBackupToLab } from './services/legacyBackupImportService.js';
import { ensurePaymentForSale, getPaymentStats, resetLabPayments, syncPaymentsFromSales, updateLabPaymentStatus } from './services/labPaymentsService.js';
import { createLabSale, getLabSales, getSalesStats, resetLabSales, updateLabSaleStatus } from './services/labSalesService.js';
import { checkPwaLabUpdate, clearPwaLabCaches, getPwaLabStatus, reloadPwaLab } from './services/pwaLabService.js';
import { filterProducts, getProductCategories, getProductStats, PRODUCT_STATUS_FILTERS } from './services/productFilterService.js';
import { buildWhatsAppUrl } from './services/whatsappLabService.js';
import { formatBRL } from './utils/money.js';

installRuntimeDiagnostics();

const uiState = {
  modalDraft: null,
  modalErrors: [],
  saleErrors: [],
  diagnosticMessage: '',
  legacyAuditReport: null,
  legacyBackupText: '',
  legacyImportResult: null,
  pwaStatus: null,
  pwaStatusLoading: false,
  filters: {
    query: '',
    category: 'all',
    status: PRODUCT_STATUS_FILTERS.ALL,
  },
};

function escapeAttr(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function renderEnvironmentPanel() {
  const status = getDataGatewayStatus();
  return `
    <section class="panel-card environment-panel">
      <div class="panel-title-row">
        <div><h2>Ambiente de dados</h2><p>${status.warning}</p></div>
        <span class="safe-pill">${status.label}</span>
      </div>
      <div class="mode-switch" role="group" aria-label="Modo de dados">
        <button class="mode-button ${status.mode === DATA_MODES.LAB ? 'active' : ''}" data-mode="${DATA_MODES.LAB}">LAB visitante</button>
        <button class="mode-button ${status.mode === DATA_MODES.REAL_READONLY ? 'active' : ''}" data-mode="${DATA_MODES.REAL_READONLY}">Real somente leitura</button>
      </div>
      <div class="storage-note">
        <strong>Firebase:</strong> ${status.firebaseConfigured ? 'configurado' : 'não conectado neste bloco'}<br>
        <strong>Login Google:</strong> ${status.googleLoginConfigured ? 'configurado' : 'não conectado neste bloco'}<br>
        <strong>Escrita real:</strong> ${status.canWriteRealData ? 'permitida' : 'bloqueada'}<br>
        <strong>Catálogo real:</strong> ${status.affectsRealCatalog ? 'pode ser alterado' : 'não será alterado'}
      </div>
    </section>
  `;
}

function renderCatalogContractPanel(products) {
  const report = getCatalogSyncReport(products);
  const rowsWithIssues = report.rows.filter((row) => !row.ok || row.warnings.length > 0);
  return `
    <section class="panel-card catalog-contract-panel">
      <div class="panel-title-row">
        <div><h2>Contrato do Catálogo LAB</h2><p>Validação dos campos que o catálogo precisa ler. Ainda não conecta nem altera o catálogo real.</p></div>
        <span class="safe-pill">Contrato</span>
      </div>
      <div class="mini-grid four-stats">
        <div class="mini-stat"><strong>${report.visibleProducts}</strong><span>irão ao catálogo</span></div>
        <div class="mini-stat"><strong>${report.categories.length}</strong><span>categorias</span></div>
        <div class="mini-stat"><strong>${report.tabs.length}</strong><span>abas</span></div>
        <div class="mini-stat"><strong>${report.warningProducts}</strong><span>alertas</span></div>
      </div>
      <div class="storage-note">
        <strong>Modo:</strong> ${report.mode}<br>
        <strong>Escrita no catálogo real:</strong> ${report.canSyncRealCatalog ? 'permitida' : 'bloqueada'}<br>
        <strong>Categorias visíveis:</strong> ${report.categories.length ? report.categories.join(', ') : 'nenhuma'}<br>
        <strong>Abas visíveis:</strong> ${report.tabs.length ? report.tabs.join(', ') : 'nenhuma'}
      </div>
      ${rowsWithIssues.length ? `
        <div class="contract-issues">
          ${rowsWithIssues.map((row) => `
            <article class="contract-issue-card">
              <strong>${row.name}</strong>
              ${row.missing.length ? `<span>Faltando: ${row.missing.join(', ')}</span>` : ''}
              ${row.warnings.length ? `<span>Aviso: ${row.warnings.join(' · ')}</span>` : ''}
            </article>
          `).join('')}
        </div>
      ` : '<div class="contract-ok">Todos os produtos LAB têm os campos obrigatórios para o catálogo fictício.</div>'}
    </section>
  `;
}

function renderFilterControls(products) {
  const categories = getProductCategories(products);
  return `
    <div class="product-filters">
      <label class="compact-field full-row"><span>Buscar</span><input data-filter-query type="search" value="${escapeAttr(uiState.filters.query)}" placeholder="Nome, marca, categoria..."></label>
      <button class="secondary-button full-row" data-apply-search>Aplicar busca</button>
      <label class="compact-field"><span>Categoria</span><select data-filter-category>
        <option value="all" ${uiState.filters.category === 'all' ? 'selected' : ''}>Todas</option>
        ${categories.map((category) => `<option value="${escapeAttr(category)}" ${uiState.filters.category === category ? 'selected' : ''}>${category}</option>`).join('')}
      </select></label>
      <label class="compact-field"><span>Status</span><select data-filter-status>
        <option value="all" ${uiState.filters.status === PRODUCT_STATUS_FILTERS.ALL ? 'selected' : ''}>Todos</option>
        <option value="visible" ${uiState.filters.status === PRODUCT_STATUS_FILTERS.VISIBLE ? 'selected' : ''}>Publicados</option>
        <option value="hidden" ${uiState.filters.status === PRODUCT_STATUS_FILTERS.HIDDEN ? 'selected' : ''}>Ocultos</option>
        <option value="no-image" ${uiState.filters.status === PRODUCT_STATUS_FILTERS.NO_IMAGE ? 'selected' : ''}>Sem foto real</option>
      </select></label>
      <button class="secondary-button full-row" data-clear-filters>Limpar filtros</button>
    </div>
  `;
}

function renderProductRows(products, canWrite) {
  if (!products.length) return '<div class="empty-preview">Nenhum produto encontrado com os filtros atuais.</div>';
  return products.map((product) => {
    const hasPlaceholderImage = String(product.imageUrl || '').startsWith('data:image/svg+xml');
    const hasLabUpload = String(product.imageUrl || '').startsWith('data:image/') && !hasPlaceholderImage;
    return `
      <article class="lab-product-card">
        <div>
          <div class="badge-row">
            <span class="mini-badge">${product.category}</span>
            ${hasPlaceholderImage ? '<span class="mini-badge muted-badge">sem foto real</span>' : ''}
            ${hasLabUpload ? '<span class="mini-badge">foto LAB</span>' : ''}
          </div>
          <h3>${product.name}</h3>
          <p>${product.brand} · ${formatBRL(product.price)}</p>
          <small>${product.visibleInCatalog ? 'Publicado no preview' : 'Oculto no preview'}</small>
        </div>
        <div class="product-actions">
          <button class="ghost-button" data-edit-product="${product.id}" ${canWrite ? '' : 'disabled'}>Editar</button>
          <button class="ghost-button" data-toggle-product="${product.id}" ${canWrite ? '' : 'disabled'}>${product.visibleInCatalog ? 'Ocultar' : 'Publicar'}</button>
        </div>
      </article>
    `;
  }).join('');
}

function renderProductsPanel(products, gateway, canWrite) {
  const filteredProducts = filterProducts(products, uiState.filters);
  const stats = getProductStats(products);
  const status = getDataGatewayStatus();
  return `
    <section class="panel-card lab-test-panel">
      <div class="panel-title-row"><div><h2>Produtos LAB</h2><p>Produtos fictícios salvos apenas neste navegador. Não usa Google, Firebase nem catálogo real.</p></div><span class="safe-pill">Seguro</span></div>
      <div class="mini-grid four-stats">
        <div class="mini-stat"><strong>${stats.total}</strong><span>produtos</span></div>
        <div class="mini-stat"><strong>${stats.visible}</strong><span>publicados</span></div>
        <div class="mini-stat"><strong>${stats.hidden}</strong><span>ocultos</span></div>
        <div class="mini-stat"><strong>${stats.withoutUploadedImage}</strong><span>sem foto real</span></div>
      </div>
      <div class="lab-actions three-actions">
        <button class="primary-button" data-new-product ${canWrite ? '' : 'disabled'}>Novo produto</button>
        <a class="secondary-button" href="./catalogo-preview/">Abrir catálogo fictício</a>
        <button class="secondary-button" data-reset-lab ${canWrite ? '' : 'disabled'}>Restaurar dados teste</button>
      </div>
      ${renderFilterControls(products)}
      <div class="storage-note">
        <strong>Fonte atual:</strong> ${gateway.source}<br>
        <strong>Exibindo:</strong> ${filteredProducts.length} de ${products.length} produtos<br>
        <strong>Chave LAB:</strong> <code>${status.labStorage.key}</code>
        ${gateway.warning ? `<br><strong>Aviso:</strong> ${gateway.warning}` : ''}
      </div>
      <div class="lab-product-list">${renderProductRows(filteredProducts, canWrite)}</div>
    </section>
  `;
}

function closeModal() {
  uiState.modalDraft = null;
  uiState.modalErrors = [];
}

function buildCurrentState() {
  const gateway = listProducts();
  const products = gateway.products;
  const sales = getLabSales();
  const payments = syncPaymentsFromSales(sales);
  const salesStats = getSalesStats(sales);
  const paymentStats = getPaymentStats(payments);
  const catalogReport = getCatalogSyncReport(products);
  const environment = getDataGatewayStatus();
  const diagnostics = buildDiagnosticsReport({
    appConfig: APP_CONFIG,
    environment,
    products,
    sales,
    payments,
    paymentStats,
    salesStats,
    catalogReport,
  });
  return { gateway, products, sales, payments, salesStats, paymentStats, catalogReport, environment, diagnostics };
}

async function refreshPwaStatus(root, silent = true) {
  try {
    uiState.pwaStatusLoading = true;
    uiState.pwaStatus = await getPwaLabStatus();
    uiState.pwaStatusLoading = false;
    if (!silent) uiState.diagnosticMessage = 'Status PWA atualizado.';
    renderApp(root, { skipPwaRefresh: true });
  } catch (error) {
    uiState.pwaStatusLoading = false;
    uiState.diagnosticMessage = 'Não foi possível ler status PWA.';
    logDiagnosticEvent('error', 'pwa.status', 'Falha ao ler status PWA LAB.', { error: String(error.message || error) });
    renderApp(root, { skipPwaRefresh: true });
  }
}

async function saveProductFromForm(root, form) {
  const draft = readProductForm(form);
  const uploadResult = await generateLabImageUrl(draft.imageFile);
  if (!uploadResult.ok) {
    uiState.modalDraft = draft;
    uiState.modalErrors = [uploadResult.error || 'Não foi possível gerar a URL da imagem.'];
    logDiagnosticEvent('error', 'product.save', 'Falha ao gerar imagem LAB.', { error: uploadResult.error });
    renderApp(root);
    return;
  }
  if (uploadResult.imageUrl) draft.imageUrl = uploadResult.imageUrl;
  const result = saveProduct(draft);
  if (!result.ok) {
    uiState.modalDraft = draft;
    uiState.modalErrors = result.errors || [result.message || 'Não foi possível salvar.'];
    logDiagnosticEvent('error', 'product.save', 'Falha ao salvar produto LAB.', { errors: uiState.modalErrors });
    renderApp(root);
    return;
  }
  logDiagnosticEvent('info', 'product.save', 'Produto LAB salvo.', { productId: result.product?.id, name: result.product?.name });
  closeModal();
  renderApp(root);
}

function saveSaleFromForm(root, form, products) {
  const result = createLabSale(readSaleForm(form), products);
  if (!result.ok) {
    uiState.saleErrors = result.errors || ['Não foi possível registrar a venda.'];
    logDiagnosticEvent('error', 'sale.save', 'Falha ao registrar venda LAB.', { errors: uiState.saleErrors });
    renderApp(root);
    return;
  }
  ensurePaymentForSale(result.sale);
  logDiagnosticEvent('info', 'sale.save', 'Venda LAB registrada e parcela criada.', { saleId: result.sale?.id, clientName: result.sale?.clientName });
  uiState.saleErrors = [];
  form.reset();
  renderApp(root);
}

async function importBackupFromInput(root, input) {
  const file = input.files?.[0];
  if (!file) return;
  const text = await file.text();
  const result = importLabBackupFromText(text);
  if (!result.ok) {
    uiState.diagnosticMessage = result.error || 'Falha ao importar backup.';
    logDiagnosticEvent('error', 'backup.import', 'Falha ao importar backup LAB.', { error: uiState.diagnosticMessage });
    renderApp(root);
    return;
  }
  uiState.diagnosticMessage = `Backup importado: ${result.importedKeys.length} chave(s).`;
  logDiagnosticEvent('info', 'backup.import', 'Backup LAB importado.', { keys: result.importedKeys });
  renderApp(root);
}

async function auditLegacyBackupFromInput(root, input) {
  const file = input.files?.[0];
  if (!file) return;
  const text = await file.text();
  const report = auditLegacyBackupText(text);
  uiState.legacyAuditReport = report;
  uiState.legacyBackupText = report.ok ? text : '';
  uiState.legacyImportResult = null;
  uiState.diagnosticMessage = report.ok ? summarizeLegacyAudit(report) : report.error;
  logDiagnosticEvent(report.ok ? 'info' : 'error', 'legacy.audit', report.ok ? 'Backup real auditado.' : 'Falha ao auditar backup real.', {
    summary: report.ok ? summarizeLegacyAudit(report) : report.error,
  });
  renderApp(root);
}

function importLegacyBackup(root, mode) {
  if (!uiState.legacyBackupText) {
    uiState.diagnosticMessage = 'Analise um backup real antes de importar.';
    renderApp(root);
    return;
  }

  const result = importLegacyBackupToLab(uiState.legacyBackupText, { anonymize: mode !== 'real' });
  uiState.legacyImportResult = result;
  uiState.diagnosticMessage = result.ok
    ? `Backup real importado para LAB: ${result.counts.products} produtos, ${result.counts.sales} vendas, ${result.counts.payments} parcelas.`
    : result.error;
  logDiagnosticEvent(result.ok ? 'info' : 'error', 'legacy.import', result.ok ? 'Backup real importado para LAB.' : 'Falha ao importar backup real para LAB.', {
    anonymized: mode !== 'real',
    counts: result.counts || {},
    skipped: result.skipped || [],
    error: result.error || '',
  });
  renderApp(root);
}

function bindLabActions(root) {
  root.querySelectorAll('[data-mode]').forEach((button) => button.addEventListener('click', () => {
    setCurrentDataMode(button.getAttribute('data-mode'));
    closeModal();
    logDiagnosticEvent('info', 'environment.mode', 'Modo de dados alterado.', { mode: button.getAttribute('data-mode') });
    renderApp(root);
  }));

  const queryInput = root.querySelector('[data-filter-query]');
  const applySearch = () => {
    if (queryInput) uiState.filters.query = queryInput.value;
    renderApp(root);
  };
  if (queryInput) queryInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') { event.preventDefault(); applySearch(); }
  });
  root.querySelector('[data-apply-search]')?.addEventListener('click', applySearch);
  root.querySelector('[data-filter-category]')?.addEventListener('change', (event) => { uiState.filters.category = event.target.value; renderApp(root); });
  root.querySelector('[data-filter-status]')?.addEventListener('change', (event) => { uiState.filters.status = event.target.value; renderApp(root); });
  root.querySelector('[data-clear-filters]')?.addEventListener('click', () => { uiState.filters = { query: '', category: 'all', status: PRODUCT_STATUS_FILTERS.ALL }; renderApp(root); });

  root.querySelector('[data-new-product]')?.addEventListener('click', () => { uiState.modalDraft = buildEmptyProductDraft(); uiState.modalErrors = []; renderApp(root); });
  root.querySelectorAll('[data-edit-product]').forEach((button) => button.addEventListener('click', () => { uiState.modalDraft = productToDraft(getProduct(button.getAttribute('data-edit-product'))); uiState.modalErrors = []; renderApp(root); }));
  root.querySelectorAll('[data-toggle-product]').forEach((button) => button.addEventListener('click', () => { toggleProductVisibility(button.getAttribute('data-toggle-product')); logDiagnosticEvent('info', 'product.visibility', 'Visibilidade do produto LAB alterada.'); renderApp(root); }));

  root.querySelector('[data-reset-lab]')?.addEventListener('click', () => {
    resetProducts(); resetLabSales(); resetLabPayments(); closeModal(); uiState.saleErrors = []; uiState.filters = { query: '', category: 'all', status: PRODUCT_STATUS_FILTERS.ALL };
    logDiagnosticEvent('warn', 'lab.reset', 'Dados teste restaurados pelo usuário.');
    renderApp(root);
  });

  root.querySelector('[data-export-backup]')?.addEventListener('click', () => {
    const result = downloadLabBackup();
    uiState.diagnosticMessage = result.ok ? 'Backup LAB exportado.' : result.error;
    logDiagnosticEvent(result.ok ? 'info' : 'error', 'backup.export', result.ok ? 'Backup LAB exportado.' : 'Falha ao exportar backup LAB.', { error: result.error || '' });
    renderApp(root);
  });

  root.querySelector('[data-import-backup]')?.addEventListener('change', (event) => importBackupFromInput(root, event.currentTarget));
  root.querySelector('[data-legacy-backup-audit]')?.addEventListener('change', (event) => auditLegacyBackupFromInput(root, event.currentTarget));
  root.querySelectorAll('[data-import-legacy-backup]').forEach((button) => button.addEventListener('click', () => importLegacyBackup(root, button.getAttribute('data-import-legacy-backup'))));
  root.querySelector('[data-clear-legacy-buffer]')?.addEventListener('click', () => {
    uiState.legacyAuditReport = null;
    uiState.legacyBackupText = '';
    uiState.legacyImportResult = null;
    uiState.diagnosticMessage = 'Análise de backup real limpa.';
    renderApp(root);
  });

  root.querySelector('[data-clear-lab-storage]')?.addEventListener('click', () => {
    const removed = clearLabStorageByPrefix();
    uiState.diagnosticMessage = `LAB limpo: ${removed.length} chave(s) removida(s).`;
    logDiagnosticEvent('warn', 'backup.clear', 'Storage LAB limpo pelo usuário.', { removed });
    renderApp(root);
  });

  root.querySelector('[data-pwa-check-update]')?.addEventListener('click', async () => {
    const result = await checkPwaLabUpdate();
    uiState.diagnosticMessage = result.message;
    logDiagnosticEvent(result.ok ? 'info' : 'warn', 'pwa.update', result.message);
    await refreshPwaStatus(root, true);
  });

  root.querySelector('[data-pwa-clear-cache]')?.addEventListener('click', async () => {
    const result = await clearPwaLabCaches();
    uiState.diagnosticMessage = result.message;
    logDiagnosticEvent(result.ok ? 'warn' : 'error', 'pwa.cache.clear', result.message, { removed: result.removed || [] });
    await refreshPwaStatus(root, true);
  });

  root.querySelector('[data-pwa-reload]')?.addEventListener('click', () => {
    logDiagnosticEvent('info', 'pwa.reload', 'Recarregamento manual do PWA LAB solicitado.');
    reloadPwaLab();
  });

  root.querySelectorAll('[data-sale-status]').forEach((button) => button.addEventListener('click', () => { updateLabSaleStatus(button.getAttribute('data-sale-status'), button.getAttribute('data-next-status')); logDiagnosticEvent('info', 'sale.status', 'Status da venda LAB alterado.'); renderApp(root); }));
  root.querySelectorAll('[data-payment-status]').forEach((button) => button.addEventListener('click', () => { updateLabPaymentStatus(button.getAttribute('data-payment-status'), button.getAttribute('data-next-status')); logDiagnosticEvent('info', 'payment.status', 'Status da parcela LAB alterado.'); renderApp(root); }));

  root.querySelectorAll('[data-whatsapp-link]').forEach((link) => link.addEventListener('click', (event) => {
    if (link.getAttribute('aria-disabled') === 'true') { event.preventDefault(); return; }
    const phone = root.querySelector('[data-whatsapp-phone]')?.value || '';
    const message = new URL(link.href).searchParams.get('text') || '';
    link.href = buildWhatsAppUrl({ phone, message });
    logDiagnosticEvent('info', 'whatsapp.open', 'Link de WhatsApp LAB aberto.', { type: link.getAttribute('data-message-type'), phoneProvided: Boolean(phone) });
  }));

  root.querySelector('[data-copy-diagnostics]')?.addEventListener('click', async () => {
    try { await copyDiagnosticsReport(buildCurrentState().diagnostics); uiState.diagnosticMessage = 'Diagnóstico copiado.'; logDiagnosticEvent('info', 'diagnostics.copy', 'Diagnóstico copiado para a área de transferência.'); }
    catch (error) { uiState.diagnosticMessage = 'Não foi possível copiar automaticamente.'; logDiagnosticEvent('error', 'diagnostics.copy', 'Falha ao copiar diagnóstico.', { error: String(error.message || error) }); }
    renderApp(root);
  });
  root.querySelector('[data-clear-diagnostics]')?.addEventListener('click', () => { clearDiagnosticEvents(); uiState.diagnosticMessage = 'Eventos limpos.'; renderApp(root); });

  root.querySelectorAll('[data-close-modal], [data-modal-backdrop]').forEach((element) => element.addEventListener('click', (event) => { if (event.target !== element && !element.hasAttribute('data-close-modal')) return; closeModal(); renderApp(root); }));
  root.querySelector('[data-product-form]')?.addEventListener('submit', (event) => { event.preventDefault(); saveProductFromForm(root, event.currentTarget); });
  root.querySelector('[data-sale-form]')?.addEventListener('submit', (event) => { event.preventDefault(); saveSaleFromForm(root, event.currentTarget, listProducts().products); });
}

export function renderApp(root, options = {}) {
  if (!root) return;
  const state = buildCurrentState();
  const isLabMode = state.environment.mode === DATA_MODES.LAB;

  root.innerHTML = `
    <main class="lab-page">
      <section class="hero-card" aria-labelledby="lab-title">
        <div class="eyebrow">Reconstrução modular</div>
        <h1 id="lab-title">Bela Gestão <span>LAB</span></h1>
        <p class="hero-text">Esta é a área segura de reconstrução. O sistema atual da raiz não foi substituído.</p>
        <div class="status-grid" aria-label="Status da versão">
          <div class="status-card"><strong>${APP_CONFIG.branch}</strong><small>branch de trabalho</small></div>
          <div class="status-card"><strong>${APP_CONFIG.version}</strong><small>versão lab</small></div>
          <div class="status-card"><strong>${APP_CONFIG.productionBranch}</strong><small>produção protegida</small></div>
        </div>
      </section>
      ${renderEnvironmentPanel()}
      ${renderDashboardPanel({ products: state.products, salesStats: state.salesStats, paymentStats: state.paymentStats, catalogReport: state.catalogReport })}
      ${renderDiagnosticsPanel(state.diagnostics)}
      ${uiState.diagnosticMessage ? `<div class="diagnostic-toast">${uiState.diagnosticMessage}</div>` : ''}
      ${renderPwaStatusPanel({ pwaStatus: uiState.pwaStatus })}
      ${renderSettingsBackupPanel({ storageKeys: getLabStorageKeys() })}
      ${renderLegacyBackupAuditPanel({ report: uiState.legacyAuditReport, importResult: uiState.legacyImportResult })}
      ${renderCatalogContractPanel(state.products)}
      ${renderSalesPanel({ products: state.products, sales: state.sales, stats: state.salesStats, errors: uiState.saleErrors, canWrite: isLabMode })}
      ${renderPaymentsPanel({ payments: state.payments, stats: state.paymentStats, canWrite: isLabMode })}
      ${renderWhatsAppPanel({ sales: state.sales, payments: state.payments })}
      ${renderProductsPanel(state.products, state.gateway, isLabMode)}
      <section class="panel-card"><h2>Funções críticas preservadas</h2><p>Nenhum módulo abaixo será removido sem auditoria e teste por bloco.</p><ul class="feature-list">${CRITICAL_FEATURES.map((feature) => `<li>${feature}</li>`).join('')}</ul></section>
      <section class="panel-card warning-card"><h2>Estado do BLOCO 11B</h2><p>Controle de PWA/cache LAB adicionado para verificar atualização, limpar cache e recarregar o app no iPhone.</p></section>
    </main>
    ${renderProductFormModal({ draft: uiState.modalDraft, errors: uiState.modalErrors, isEditing: Boolean(uiState.modalDraft?.id) })}
  `;
  bindLabActions(root);

  if (!options.skipPwaRefresh && !uiState.pwaStatus && !uiState.pwaStatusLoading) {
    refreshPwaStatus(root, true);
  }
}
