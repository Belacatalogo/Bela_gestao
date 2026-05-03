import { renderProductFormModal, buildEmptyProductDraft, productToDraft, readProductForm } from './components/ProductFormModal.js';
import { APP_CONFIG, CRITICAL_FEATURES } from './config/appConfig.js';
import { getCatalogSyncReport } from './services/catalogContractService.js';
import { getDataGatewayStatus, getProduct, listProducts, resetProducts, saveProduct, toggleProductVisibility } from './services/dataGateway.js';
import { generateLabImageUrl } from './services/imageUploadLabService.js';
import { downloadLabBackup, importLabBackupFromText } from './services/labBackupService.js';
import { ensurePaymentForSale, getPaymentStats, syncPaymentsFromSales, updateLabPaymentStatus } from './services/labPaymentsService.js';
import { createLabSale, getLabSales, getSalesStats, updateLabSaleStatus } from './services/labSalesService.js';
import { filterProducts, getProductCategories, getProductStats, PRODUCT_STATUS_FILTERS } from './services/productFilterService.js';
import { formatBRL } from './utils/money.js';

const uiState = {
  activeTab: window.localStorage.getItem('belaGestaoLab.cleanTab') || 'produtos',
  modalDraft: null,
  modalErrors: [],
  saleErrors: [],
  notice: '',
  filters: {
    query: '',
    category: 'all',
    status: PRODUCT_STATUS_FILTERS.ALL,
  },
};

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function setNotice(message) {
  uiState.notice = message;
}

function getState() {
  const gateway = listProducts();
  const products = gateway.products;
  const sales = getLabSales();
  const payments = syncPaymentsFromSales(sales);
  const salesStats = getSalesStats(sales);
  const paymentStats = getPaymentStats(payments);
  const productStats = getProductStats(products);
  const catalogReport = getCatalogSyncReport(products);
  const environment = getDataGatewayStatus();
  return { gateway, products, sales, payments, salesStats, paymentStats, productStats, catalogReport, environment };
}

function renderHero(state) {
  return `
    <section class="clean-hero">
      <div class="clean-hero-mark">BELA</div>
      <h1>Gestão de Vendas</h1>
      <p>Nova base modular, com a experiência visual do sistema antigo e somente funções úteis na tela principal.</p>
      <div class="clean-version-row">
        <span>${APP_CONFIG.version}</span>
        <span>${APP_CONFIG.branch}</span>
        <span>${state.environment.canWriteRealData ? 'real' : 'LAB seguro'}</span>
      </div>
    </section>
  `;
}

function renderNav() {
  const tabs = [
    ['dashboard', 'Resumo'],
    ['produtos', 'Produtos'],
    ['vendas', 'Vendas'],
    ['pagamentos', 'Pagamentos'],
    ['catalogo', 'Catálogo'],
    ['ajustes', 'Ajustes'],
  ];

  return `
    <nav class="clean-tab-nav" aria-label="Navegação principal">
      ${tabs.map(([id, label]) => `<button class="clean-tab-btn ${uiState.activeTab === id ? 'active' : ''}" data-clean-tab="${id}">${label}</button>`).join('')}
    </nav>
  `;
}

function renderMetric(label, value, hint = '') {
  return `<article class="clean-metric"><strong>${value}</strong><span>${label}</span>${hint ? `<small>${hint}</small>` : ''}</article>`;
}

function renderDashboard(state) {
  return `
    <section class="clean-section">
      <div class="clean-section-title"><span>Visão geral</span><h2>Resumo do negócio</h2></div>
      <div class="clean-metric-grid">
        ${renderMetric('Produtos', state.productStats.total)}
        ${renderMetric('Publicados', state.productStats.visible)}
        ${renderMetric('Vendas', state.salesStats.count, formatBRL(state.salesStats.totalSold))}
        ${renderMetric('Lucro estimado', formatBRL(state.salesStats.totalProfit))}
        ${renderMetric('A receber', formatBRL(state.paymentStats.pendingAmount), `${state.paymentStats.pendingCount} pendência(s)`)}
        ${renderMetric('Recebido', formatBRL(state.paymentStats.paidAmount), `${state.paymentStats.paidCount} pago(s)`)}
      </div>
      <div class="clean-card clean-warning-card">
        <h3>Estado seguro da reconstrução</h3>
        <p>A tela principal agora está enxuta. Ferramentas técnicas de migração não carregam mais como parte da experiência normal.</p>
      </div>
    </section>
  `;
}

function renderFilterControls(products) {
  const categories = getProductCategories(products);
  return `
    <div class="clean-filter-card">
      <input data-filter-query type="search" value="${escapeHtml(uiState.filters.query)}" placeholder="Buscar produto, marca ou categoria">
      <select data-filter-category>
        <option value="all" ${uiState.filters.category === 'all' ? 'selected' : ''}>Todas as categorias</option>
        ${categories.map((category) => `<option value="${escapeHtml(category)}" ${uiState.filters.category === category ? 'selected' : ''}>${escapeHtml(category)}</option>`).join('')}
      </select>
      <select data-filter-status>
        <option value="all" ${uiState.filters.status === PRODUCT_STATUS_FILTERS.ALL ? 'selected' : ''}>Todos</option>
        <option value="visible" ${uiState.filters.status === PRODUCT_STATUS_FILTERS.VISIBLE ? 'selected' : ''}>Publicados</option>
        <option value="hidden" ${uiState.filters.status === PRODUCT_STATUS_FILTERS.HIDDEN ? 'selected' : ''}>Ocultos</option>
        <option value="no-image" ${uiState.filters.status === PRODUCT_STATUS_FILTERS.NO_IMAGE ? 'selected' : ''}>Sem foto real</option>
      </select>
      <button class="secondary-button" data-clear-filters>Limpar</button>
    </div>
  `;
}

function renderProductCard(product) {
  const hasLabPhoto = String(product.imageUrl || '').startsWith('data:image/') && !String(product.imageUrl || '').startsWith('data:image/svg+xml');
  const hasPlaceholder = String(product.imageUrl || '').startsWith('data:image/svg+xml');
  return `
    <article class="clean-product-card">
      <div class="clean-product-thumb">
        <img src="${escapeHtml(product.imageUrl || '')}" alt="${escapeHtml(product.name)}">
      </div>
      <div class="clean-product-body">
        <div class="clean-badge-row">
          <span>${escapeHtml(product.category || 'sem categoria')}</span>
          ${product.visibleInCatalog ? '<span>Publicado</span>' : '<span>Oculto</span>'}
          ${hasLabPhoto ? '<span>foto LAB</span>' : ''}
          ${hasPlaceholder ? '<span>sem foto real</span>' : ''}
        </div>
        <h3>${escapeHtml(product.name)}</h3>
        <p>${escapeHtml(product.brand)} · ${formatBRL(product.price)}</p>
        <div class="clean-actions-row">
          <button class="ghost-button" data-edit-product="${escapeHtml(product.id)}">Editar</button>
          <button class="ghost-button" data-toggle-product="${escapeHtml(product.id)}">${product.visibleInCatalog ? 'Ocultar' : 'Publicar'}</button>
        </div>
      </div>
    </article>
  `;
}

function renderProducts(state) {
  const filtered = filterProducts(state.products, uiState.filters);
  return `
    <section class="clean-section">
      <div class="clean-section-title"><span>Produtos</span><h2>Catálogo interno</h2></div>
      <div class="clean-actions-main">
        <button class="primary-button" data-new-product>Novo produto</button>
        <a class="secondary-button" href="./catalogo-preview/">Abrir catálogo fictício</a>
        <button class="secondary-button" data-reset-products>Restaurar teste</button>
      </div>
      ${renderFilterControls(state.products)}
      <div class="clean-count-line">Exibindo ${filtered.length} de ${state.products.length} produto(s)</div>
      <div class="clean-product-list">
        ${filtered.length ? filtered.map(renderProductCard).join('') : '<div class="empty-preview">Nenhum produto encontrado.</div>'}
      </div>
    </section>
  `;
}

function renderSales(state) {
  return `
    <section class="clean-section">
      <div class="clean-section-title"><span>Vendas</span><h2>Registro de compradores</h2></div>
      <form class="clean-form-card" data-sale-form>
        ${uiState.saleErrors.length ? `<div class="form-errors">${uiState.saleErrors.map((error) => `<div>${escapeHtml(error)}</div>`).join('')}</div>` : ''}
        <input name="clientName" placeholder="Nome da cliente" required>
        <select name="productId" required>
          <option value="">Produto vendido</option>
          ${state.products.map((product) => `<option value="${escapeHtml(product.id)}">${escapeHtml(product.name)} · ${formatBRL(product.price)}</option>`).join('')}
        </select>
        <input name="quantity" type="number" value="1" min="1" placeholder="Quantidade">
        <input name="unitPrice" type="number" step="0.01" placeholder="Preço final opcional">
        <select name="status">
          <option value="pendente">Pendente</option>
          <option value="pago">Pago</option>
        </select>
        <textarea name="notes" rows="2" placeholder="Observações"></textarea>
        <button class="primary-button" type="submit">Salvar venda</button>
      </form>
      <div class="clean-sale-list">
        ${state.sales.length ? state.sales.map((sale) => `
          <article class="clean-card">
            <div class="clean-row-between"><h3>${escapeHtml(sale.clientName)}</h3><span>${sale.status === 'pago' ? 'Pago' : 'Pendente'}</span></div>
            <p>${escapeHtml(sale.productName)} · ${sale.quantity} un. · ${formatBRL(sale.total)}</p>
            <div class="clean-actions-row">
              <button class="ghost-button" data-sale-status="${escapeHtml(sale.id)}" data-next-status="pago">Marcar pago</button>
              <button class="ghost-button" data-sale-status="${escapeHtml(sale.id)}" data-next-status="pendente">Marcar pendente</button>
            </div>
          </article>
        `).join('') : '<div class="empty-preview">Nenhuma venda registrada no LAB.</div>'}
      </div>
    </section>
  `;
}

function renderPayments(state) {
  return `
    <section class="clean-section">
      <div class="clean-section-title"><span>Pagamentos</span><h2>Parcelas e recebimentos</h2></div>
      <div class="clean-metric-grid compact">
        ${renderMetric('A receber', formatBRL(state.paymentStats.pendingAmount))}
        ${renderMetric('Recebido', formatBRL(state.paymentStats.paidAmount))}
        ${renderMetric('Pendentes', state.paymentStats.pendingCount)}
      </div>
      <div class="clean-sale-list">
        ${state.payments.length ? state.payments.map((payment) => `
          <article class="clean-card">
            <div class="clean-row-between"><h3>${escapeHtml(payment.saleClientName)}</h3><span>${payment.status === 'pago' ? 'Pago' : 'Pendente'}</span></div>
            <p>${escapeHtml(payment.saleProductName)} · ${formatBRL(payment.amount)}</p>
            <div class="clean-actions-row">
              <button class="ghost-button" data-payment-status="${escapeHtml(payment.id)}" data-next-status="pago">Recebido</button>
              <button class="ghost-button" data-payment-status="${escapeHtml(payment.id)}" data-next-status="pendente">Pendente</button>
            </div>
          </article>
        `).join('') : '<div class="empty-preview">Nenhuma parcela gerada ainda.</div>'}
      </div>
    </section>
  `;
}

function renderCatalog(state) {
  return `
    <section class="clean-section">
      <div class="clean-section-title"><span>Catálogo</span><h2>Ligação Gestão ↔ Catálogo</h2></div>
      <div class="clean-card">
        <h3>Contrato preservado</h3>
        <p>O Gestão continua preparando produtos no formato necessário para o catálogo. A escrita real segue bloqueada até a validação final com Firebase.</p>
        <div class="clean-metric-grid compact">
          ${renderMetric('Iriam ao catálogo', state.catalogReport.visibleProducts)}
          ${renderMetric('Categorias', state.catalogReport.categories.length)}
          ${renderMetric('Alertas', state.catalogReport.warningProducts)}
        </div>
        <div class="clean-actions-row"><a class="secondary-button" href="./catalogo-preview/">Ver prévia fictícia</a></div>
      </div>
    </section>
  `;
}

function renderSettings(state) {
  return `
    <section class="clean-section">
      <div class="clean-section-title"><span>Ajustes</span><h2>Backup e segurança</h2></div>
      <div class="clean-card">
        <h3>Backup LAB</h3>
        <p>Exporta e importa apenas dados do ambiente LAB/localStorage. Não escreve no Firebase real.</p>
        <div class="clean-actions-row">
          <button class="primary-button" data-export-backup>Exportar backup LAB</button>
          <label class="secondary-button clean-file-button">Importar backup<input type="file" accept="application/json,.json" data-import-backup hidden></label>
        </div>
      </div>
      <div class="clean-card">
        <h3>Funções preservadas</h3>
        <ul class="clean-feature-list">${CRITICAL_FEATURES.map((feature) => `<li>${escapeHtml(feature)}</li>`).join('')}</ul>
      </div>
      <div class="clean-card clean-muted-card">
        <h3>Ferramentas LAB ocultas</h3>
        <p>Auditorias, probes, importadores e consolidadores continuam no código para migração, mas não carregam mais na tela principal.</p>
      </div>
    </section>
  `;
}

function renderActiveTab(state) {
  const tabs = {
    dashboard: renderDashboard,
    produtos: renderProducts,
    vendas: renderSales,
    pagamentos: renderPayments,
    catalogo: renderCatalog,
    ajustes: renderSettings,
  };
  return (tabs[uiState.activeTab] || renderProducts)(state);
}

function render(root) {
  const state = getState();
  root.innerHTML = `
    <main class="clean-page">
      ${renderHero(state)}
      ${renderNav()}
      ${uiState.notice ? `<div class="clean-notice">${escapeHtml(uiState.notice)}</div>` : ''}
      ${renderActiveTab(state)}
    </main>
    ${renderProductFormModal({ draft: uiState.modalDraft, errors: uiState.modalErrors, isEditing: Boolean(uiState.modalDraft?.id) })}
  `;
  bind(root);
}

async function saveProductFromForm(root, form) {
  const draft = readProductForm(form);
  const upload = await generateLabImageUrl(draft.imageFile);
  if (!upload.ok) {
    uiState.modalDraft = draft;
    uiState.modalErrors = [upload.error || 'Não foi possível processar a imagem.'];
    render(root);
    return;
  }
  if (upload.imageUrl) draft.imageUrl = upload.imageUrl;
  const result = saveProduct(draft);
  if (!result.ok) {
    uiState.modalDraft = draft;
    uiState.modalErrors = result.errors || [result.message || 'Não foi possível salvar.'];
    render(root);
    return;
  }
  uiState.modalDraft = null;
  uiState.modalErrors = [];
  setNotice('Produto salvo no LAB.');
  render(root);
}

async function importBackup(root, input) {
  const file = input.files?.[0];
  if (!file) return;
  const text = await file.text();
  const result = importLabBackupFromText(text);
  setNotice(result.ok ? `Backup importado: ${result.importedKeys.length} chave(s).` : result.error || 'Falha ao importar backup.');
  render(root);
}

function bind(root) {
  root.querySelectorAll('[data-clean-tab]').forEach((button) => button.addEventListener('click', () => {
    uiState.activeTab = button.getAttribute('data-clean-tab');
    window.localStorage.setItem('belaGestaoLab.cleanTab', uiState.activeTab);
    uiState.notice = '';
    render(root);
  }));

  root.querySelector('[data-new-product]')?.addEventListener('click', () => {
    uiState.modalDraft = buildEmptyProductDraft();
    uiState.modalErrors = [];
    render(root);
  });

  root.querySelectorAll('[data-edit-product]').forEach((button) => button.addEventListener('click', () => {
    uiState.modalDraft = productToDraft(getProduct(button.getAttribute('data-edit-product')));
    uiState.modalErrors = [];
    render(root);
  }));

  root.querySelectorAll('[data-toggle-product]').forEach((button) => button.addEventListener('click', () => {
    const result = toggleProductVisibility(button.getAttribute('data-toggle-product'));
    setNotice(result.message || 'Visibilidade alterada.');
    render(root);
  }));

  root.querySelector('[data-reset-products]')?.addEventListener('click', () => {
    const result = resetProducts();
    setNotice(result.message || 'Produtos de teste restaurados.');
    render(root);
  });

  root.querySelector('[data-filter-query]')?.addEventListener('input', (event) => { uiState.filters.query = event.target.value; render(root); });
  root.querySelector('[data-filter-category]')?.addEventListener('change', (event) => { uiState.filters.category = event.target.value; render(root); });
  root.querySelector('[data-filter-status]')?.addEventListener('change', (event) => { uiState.filters.status = event.target.value; render(root); });
  root.querySelector('[data-clear-filters]')?.addEventListener('click', () => { uiState.filters = { query: '', category: 'all', status: PRODUCT_STATUS_FILTERS.ALL }; render(root); });

  root.querySelector('[data-sale-form]')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const result = createLabSale(Object.fromEntries(new FormData(event.currentTarget)), listProducts().products);
    if (!result.ok) {
      uiState.saleErrors = result.errors || ['Não foi possível registrar a venda.'];
      render(root);
      return;
    }
    ensurePaymentForSale(result.sale);
    uiState.saleErrors = [];
    setNotice('Venda salva e pagamento criado.');
    render(root);
  });

  root.querySelectorAll('[data-sale-status]').forEach((button) => button.addEventListener('click', () => {
    updateLabSaleStatus(button.getAttribute('data-sale-status'), button.getAttribute('data-next-status'));
    setNotice('Status da venda atualizado.');
    render(root);
  }));

  root.querySelectorAll('[data-payment-status]').forEach((button) => button.addEventListener('click', () => {
    updateLabPaymentStatus(button.getAttribute('data-payment-status'), button.getAttribute('data-next-status'));
    setNotice('Pagamento atualizado.');
    render(root);
  }));

  root.querySelector('[data-export-backup]')?.addEventListener('click', () => {
    const result = downloadLabBackup();
    setNotice(result.ok ? 'Backup LAB exportado.' : result.error || 'Falha ao exportar backup.');
    render(root);
  });

  root.querySelector('[data-import-backup]')?.addEventListener('change', (event) => importBackup(root, event.currentTarget));

  root.querySelectorAll('[data-close-modal], [data-modal-backdrop]').forEach((element) => element.addEventListener('click', (event) => {
    if (event.target !== element && !element.hasAttribute('data-close-modal')) return;
    uiState.modalDraft = null;
    uiState.modalErrors = [];
    render(root);
  }));

  root.querySelector('[data-product-form]')?.addEventListener('submit', (event) => {
    event.preventDefault();
    saveProductFromForm(root, event.currentTarget);
  });
}

export function renderCleanApp(root) {
  if (!root) return;
  render(root);
}
