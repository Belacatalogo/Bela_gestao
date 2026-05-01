import { renderDiagnosticsPanel } from './components/DiagnosticsPanel.js';
import { renderProductFormModal, buildEmptyProductDraft, productToDraft, readProductForm } from './components/ProductFormModal.js';
import { renderSalesPanel, readSaleForm } from './components/SalesPanel.js';
import { APP_CONFIG, CRITICAL_FEATURES } from './config/appConfig.js';
import { getCatalogSyncReport } from './services/catalogContractService.js';
import { getDataGatewayStatus, getProduct, listProducts, resetProducts, saveProduct, toggleProductVisibility } from './services/dataGateway.js';
import { buildDiagnosticsReport, clearDiagnosticEvents, copyDiagnosticsReport, installRuntimeDiagnostics, logDiagnosticEvent } from './services/diagnosticsService.js';
import { DATA_MODES, setCurrentDataMode } from './services/environmentService.js';
import { generateLabImageUrl } from './services/imageUploadLabService.js';
import { createLabSale, getLabSales, getSalesStats, resetLabSales, updateLabSaleStatus } from './services/labSalesService.js';
import { filterProducts, getProductCategories, getProductStats, PRODUCT_STATUS_FILTERS } from './services/productFilterService.js';
import { formatBRL } from './utils/money.js';

installRuntimeDiagnostics();

const uiState = {
  modalDraft: null,
  modalErrors: [],
  saleErrors: [],
  diagnosticMessage: '',
  filters: {
    query: '',
    category: 'all',
    status: PRODUCT_STATUS_FILTERS.ALL,
  },
};

function featureList() {
  return CRITICAL_FEATURES.map((feature) => `<li>${feature}</li>`).join('');
}

function escapeAttr(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function productRows(products, canToggle = true) {
  if (!products.length) {
    return `
      <div class="empty-preview">
        Nenhum produto encontrado com os filtros atuais.
      </div>
    `;
  }

  return products
    .map((product) => {
      const status = product.visibleInCatalog ? 'Publicado no preview' : 'Oculto no preview';
      const action = product.visibleInCatalog ? 'Ocultar' : 'Publicar';
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
            <small>${status}</small>
          </div>
          <div class="product-actions">
            <button class="ghost-button" data-edit-product="${product.id}" ${canToggle ? '' : 'disabled'}>Editar</button>
            <button class="ghost-button" data-toggle-product="${product.id}" ${canToggle ? '' : 'disabled'}>${action}</button>
          </div>
        </article>
      `;
    })
    .join('');
}

function renderEnvironmentPanel() {
  const status = getDataGatewayStatus();

  return `
    <section class="panel-card environment-panel">
      <div class="panel-title-row">
        <div>
          <h2>Ambiente de dados</h2>
          <p>${status.warning}</p>
        </div>
        <span class="safe-pill">${status.label}</span>
      </div>

      <div class="mode-switch" role="group" aria-label="Modo de dados">
        <button class="mode-button ${status.mode === DATA_MODES.LAB ? 'active' : ''}" data-mode="${DATA_MODES.LAB}">
          LAB visitante
        </button>
        <button class="mode-button ${status.mode === DATA_MODES.REAL_READONLY ? 'active' : ''}" data-mode="${DATA_MODES.REAL_READONLY}">
          Real somente leitura
        </button>
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
        <div>
          <h2>Contrato do Catálogo LAB</h2>
          <p>
            Validação dos campos que o catálogo precisa ler. Ainda não conecta nem altera o catálogo real.
          </p>
        </div>
        <span class="safe-pill">Contrato</span>
      </div>

      <div class="mini-grid four-stats">
        <div class="mini-stat">
          <strong>${report.visibleProducts}</strong>
          <span>irão ao catálogo</span>
        </div>
        <div class="mini-stat">
          <strong>${report.categories.length}</strong>
          <span>categorias</span>
        </div>
        <div class="mini-stat">
          <strong>${report.tabs.length}</strong>
          <span>abas</span>
        </div>
        <div class="mini-stat">
          <strong>${report.warningProducts}</strong>
          <span>alertas</span>
        </div>
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
      ` : `
        <div class="contract-ok">
          Todos os produtos LAB têm os campos obrigatórios para o catálogo fictício.
        </div>
      `}
    </section>
  `;
}

function renderFilterControls(products) {
  const categories = getProductCategories(products);

  return `
    <div class="product-filters">
      <label class="compact-field full-row">
        <span>Buscar</span>
        <input data-filter-query type="search" value="${escapeAttr(uiState.filters.query)}" placeholder="Nome, marca, categoria...">
      </label>

      <button class="secondary-button full-row" data-apply-search>Aplicar busca</button>

      <label class="compact-field">
        <span>Categoria</span>
        <select data-filter-category>
          <option value="all" ${uiState.filters.category === 'all' ? 'selected' : ''}>Todas</option>
          ${categories.map((category) => `
            <option value="${escapeAttr(category)}" ${uiState.filters.category === category ? 'selected' : ''}>${category}</option>
          `).join('')}
        </select>
      </label>

      <label class="compact-field">
        <span>Status</span>
        <select data-filter-status>
          <option value="all" ${uiState.filters.status === PRODUCT_STATUS_FILTERS.ALL ? 'selected' : ''}>Todos</option>
          <option value="visible" ${uiState.filters.status === PRODUCT_STATUS_FILTERS.VISIBLE ? 'selected' : ''}>Publicados</option>
          <option value="hidden" ${uiState.filters.status === PRODUCT_STATUS_FILTERS.HIDDEN ? 'selected' : ''}>Ocultos</option>
          <option value="no-image" ${uiState.filters.status === PRODUCT_STATUS_FILTERS.NO_IMAGE ? 'selected' : ''}>Sem foto real</option>
        </select>
      </label>

      <button class="secondary-button full-row" data-clear-filters>Limpar filtros</button>
    </div>
  `;
}

function renderProductsPanel() {
  const gateway = listProducts();
  const products = gateway.products;
  const filteredProducts = filterProducts(products, uiState.filters);
  const stats = getProductStats(products);
  const status = getDataGatewayStatus();
  const isLabMode = status.mode === DATA_MODES.LAB;

  return `
    <section class="panel-card lab-test-panel">
      <div class="panel-title-row">
        <div>
          <h2>Produtos LAB</h2>
          <p>
            Produtos fictícios salvos apenas neste navegador. Não usa Google, Firebase nem catálogo real.
          </p>
        </div>
        <span class="safe-pill">Seguro</span>
      </div>

      <div class="mini-grid four-stats">
        <div class="mini-stat">
          <strong>${stats.total}</strong>
          <span>produtos</span>
        </div>
        <div class="mini-stat">
          <strong>${stats.visible}</strong>
          <span>publicados</span>
        </div>
        <div class="mini-stat">
          <strong>${stats.hidden}</strong>
          <span>ocultos</span>
        </div>
        <div class="mini-stat">
          <strong>${stats.withoutUploadedImage}</strong>
          <span>sem foto real</span>
        </div>
      </div>

      <div class="lab-actions three-actions">
        <button class="primary-button" data-new-product ${isLabMode ? '' : 'disabled'}>Novo produto</button>
        <a class="secondary-button" href="./catalogo-preview/">Abrir catálogo fictício</a>
        <button class="secondary-button" data-reset-lab ${isLabMode ? '' : 'disabled'}>Restaurar dados teste</button>
      </div>

      ${renderFilterControls(products)}

      <div class="storage-note">
        <strong>Fonte atual:</strong> ${gateway.source}<br>
        <strong>Exibindo:</strong> ${filteredProducts.length} de ${products.length} produtos<br>
        <strong>Chave LAB:</strong> <code>${status.labStorage.key}</code>
        ${gateway.warning ? `<br><strong>Aviso:</strong> ${gateway.warning}` : ''}
      </div>

      <div class="lab-product-list">
        ${productRows(filteredProducts, isLabMode)}
      </div>
    </section>
  `;
}

function closeModal() {
  uiState.modalDraft = null;
  uiState.modalErrors = [];
}

function applySearch(root) {
  const queryInput = root.querySelector('[data-filter-query]');
  if (queryInput) uiState.filters.query = queryInput.value;
  renderApp(root);
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

  if (uploadResult.imageUrl) {
    draft.imageUrl = uploadResult.imageUrl;
  }

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
  const draft = readSaleForm(form);
  const result = createLabSale(draft, products);

  if (!result.ok) {
    uiState.saleErrors = result.errors || ['Não foi possível registrar a venda.'];
    logDiagnosticEvent('error', 'sale.save', 'Falha ao registrar venda LAB.', { errors: uiState.saleErrors });
    renderApp(root);
    return;
  }

  logDiagnosticEvent('info', 'sale.save', 'Venda LAB registrada.', { saleId: result.sale?.id, clientName: result.sale?.clientName });
  uiState.saleErrors = [];
  form.reset();
  renderApp(root);
}

function buildCurrentDiagnosticsReport() {
  const gateway = listProducts();
  const sales = getLabSales();
  const salesStats = getSalesStats(sales);
  const catalogReport = getCatalogSyncReport(gateway.products);

  return buildDiagnosticsReport({
    appConfig: APP_CONFIG,
    environment: getDataGatewayStatus(),
    products: gateway.products,
    sales,
    salesStats,
    catalogReport,
  });
}

function bindLabActions(root) {
  root.querySelectorAll('[data-toggle-product]').forEach((button) => {
    button.addEventListener('click', () => {
      const productId = button.getAttribute('data-toggle-product');
      toggleProductVisibility(productId);
      logDiagnosticEvent('info', 'product.visibility', 'Visibilidade do produto LAB alterada.', { productId });
      renderApp(root);
    });
  });

  root.querySelectorAll('[data-edit-product]').forEach((button) => {
    button.addEventListener('click', () => {
      const productId = button.getAttribute('data-edit-product');
      uiState.modalDraft = productToDraft(getProduct(productId));
      uiState.modalErrors = [];
      renderApp(root);
    });
  });

  root.querySelectorAll('[data-mode]').forEach((button) => {
    button.addEventListener('click', () => {
      const mode = button.getAttribute('data-mode');
      setCurrentDataMode(mode);
      logDiagnosticEvent('info', 'environment.mode', 'Modo de dados alterado.', { mode });
      closeModal();
      renderApp(root);
    });
  });

  const queryInput = root.querySelector('[data-filter-query]');
  if (queryInput) {
    queryInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        applySearch(root);
      }
    });
  }

  const applySearchButton = root.querySelector('[data-apply-search]');
  if (applySearchButton) {
    applySearchButton.addEventListener('click', () => applySearch(root));
  }

  const categoryFilter = root.querySelector('[data-filter-category]');
  if (categoryFilter) {
    categoryFilter.addEventListener('change', () => {
      uiState.filters.category = categoryFilter.value;
      renderApp(root);
    });
  }

  const statusFilter = root.querySelector('[data-filter-status]');
  if (statusFilter) {
    statusFilter.addEventListener('change', () => {
      uiState.filters.status = statusFilter.value;
      renderApp(root);
    });
  }

  const clearFilters = root.querySelector('[data-clear-filters]');
  if (clearFilters) {
    clearFilters.addEventListener('click', () => {
      uiState.filters = {
        query: '',
        category: 'all',
        status: PRODUCT_STATUS_FILTERS.ALL,
      };
      renderApp(root);
    });
  }

  const newButton = root.querySelector('[data-new-product]');
  if (newButton) {
    newButton.addEventListener('click', () => {
      uiState.modalDraft = buildEmptyProductDraft();
      uiState.modalErrors = [];
      renderApp(root);
    });
  }

  const resetButton = root.querySelector('[data-reset-lab]');
  if (resetButton) {
    resetButton.addEventListener('click', () => {
      resetProducts();
      resetLabSales();
      closeModal();
      uiState.saleErrors = [];
      uiState.filters = {
        query: '',
        category: 'all',
        status: PRODUCT_STATUS_FILTERS.ALL,
      };
      logDiagnosticEvent('warn', 'lab.reset', 'Dados teste restaurados pelo usuário.');
      renderApp(root);
    });
  }

  root.querySelectorAll('[data-sale-status]').forEach((button) => {
    button.addEventListener('click', () => {
      updateLabSaleStatus(button.getAttribute('data-sale-status'), button.getAttribute('data-next-status'));
      logDiagnosticEvent('info', 'sale.status', 'Status da venda LAB alterado.', {
        saleId: button.getAttribute('data-sale-status'),
        status: button.getAttribute('data-next-status'),
      });
      renderApp(root);
    });
  });

  const copyDiagnostics = root.querySelector('[data-copy-diagnostics]');
  if (copyDiagnostics) {
    copyDiagnostics.addEventListener('click', async () => {
      try {
        await copyDiagnosticsReport(buildCurrentDiagnosticsReport());
        uiState.diagnosticMessage = 'Diagnóstico copiado.';
        logDiagnosticEvent('info', 'diagnostics.copy', 'Diagnóstico copiado para a área de transferência.');
      } catch (error) {
        uiState.diagnosticMessage = 'Não foi possível copiar automaticamente.';
        logDiagnosticEvent('error', 'diagnostics.copy', 'Falha ao copiar diagnóstico.', { error: String(error.message || error) });
      }
      renderApp(root);
    });
  }

  const clearDiagnostics = root.querySelector('[data-clear-diagnostics]');
  if (clearDiagnostics) {
    clearDiagnostics.addEventListener('click', () => {
      clearDiagnosticEvents();
      uiState.diagnosticMessage = 'Eventos limpos.';
      renderApp(root);
    });
  }

  root.querySelectorAll('[data-close-modal], [data-modal-backdrop]').forEach((element) => {
    element.addEventListener('click', (event) => {
      if (event.target !== element && !element.hasAttribute('data-close-modal')) return;
      closeModal();
      renderApp(root);
    });
  });

  const form = root.querySelector('[data-product-form]');
  if (form) {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      saveProductFromForm(root, form);
    });
  }

  const saleForm = root.querySelector('[data-sale-form]');
  if (saleForm) {
    saleForm.addEventListener('submit', (event) => {
      event.preventDefault();
      saveSaleFromForm(root, saleForm, listProducts().products);
    });
  }
}

export function renderApp(root) {
  if (!root) return;
  const gateway = listProducts();
  const sales = getLabSales();
  const salesStats = getSalesStats(sales);
  const catalogReport = getCatalogSyncReport(gateway.products);
  const diagnosticReport = buildDiagnosticsReport({
    appConfig: APP_CONFIG,
    environment: getDataGatewayStatus(),
    products: gateway.products,
    sales,
    salesStats,
    catalogReport,
  });
  const status = getDataGatewayStatus();
  const isLabMode = status.mode === DATA_MODES.LAB;

  root.innerHTML = `
    <main class="lab-page">
      <section class="hero-card" aria-labelledby="lab-title">
        <div class="eyebrow">Reconstrução modular</div>
        <h1 id="lab-title">Bela Gestão <span>LAB</span></h1>
        <p class="hero-text">
          Esta é a área segura de reconstrução. O sistema atual da raiz não foi substituído.
        </p>
        <div class="status-grid" aria-label="Status da versão">
          <div class="status-card">
            <strong>${APP_CONFIG.branch}</strong>
            <small>branch de trabalho</small>
          </div>
          <div class="status-card">
            <strong>${APP_CONFIG.version}</strong>
            <small>versão lab</small>
          </div>
          <div class="status-card">
            <strong>${APP_CONFIG.productionBranch}</strong>
            <small>produção protegida</small>
          </div>
        </div>
      </section>

      ${renderEnvironmentPanel()}
      ${renderDiagnosticsPanel(diagnosticReport)}
      ${uiState.diagnosticMessage ? `<div class="diagnostic-toast">${uiState.diagnosticMessage}</div>` : ''}
      ${renderCatalogContractPanel(gateway.products)}
      ${renderSalesPanel({
        products: gateway.products,
        sales,
        stats: salesStats,
        errors: uiState.saleErrors,
        canWrite: isLabMode,
      })}
      ${renderProductsPanel()}

      <section class="panel-card">
        <h2>Funções críticas preservadas</h2>
        <p>
          Nenhum módulo abaixo será removido sem auditoria e teste por bloco.
        </p>
        <ul class="feature-list">
          ${featureList()}
        </ul>
      </section>

      <section class="panel-card warning-card">
        <h2>Estado do BLOCO 8A</h2>
        <p>
          Diagnóstico LAB completo adicionado. Ele mostra versão, ambiente, storage, produtos,
          imagens, vendas, navegador, alertas e eventos de erro para facilitar correções futuras.
        </p>
      </section>
    </main>

    ${renderProductFormModal({
      draft: uiState.modalDraft,
      errors: uiState.modalErrors,
      isEditing: Boolean(uiState.modalDraft?.id),
    })}
  `;

  bindLabActions(root);
}
