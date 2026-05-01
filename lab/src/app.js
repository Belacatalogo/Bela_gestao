import { renderProductFormModal, buildEmptyProductDraft, productToDraft, readProductForm } from './components/ProductFormModal.js';
import { APP_CONFIG, CRITICAL_FEATURES } from './config/appConfig.js';
import { getDataGatewayStatus, getProduct, listProducts, resetProducts, saveProduct, toggleProductVisibility } from './services/dataGateway.js';
import { DATA_MODES, setCurrentDataMode } from './services/environmentService.js';
import { filterProducts, getProductCategories, getProductStats, PRODUCT_STATUS_FILTERS } from './services/productFilterService.js';
import { formatBRL } from './utils/money.js';

const uiState = {
  modalDraft: null,
  modalErrors: [],
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
      return `
        <article class="lab-product-card">
          <div>
            <div class="badge-row">
              <span class="mini-badge">${product.category}</span>
              ${hasPlaceholderImage ? '<span class="mini-badge muted-badge">sem foto real</span>' : ''}
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

function renderFilterControls(products) {
  const categories = getProductCategories(products);

  return `
    <div class="product-filters">
      <label class="compact-field full-row">
        <span>Buscar</span>
        <input data-filter-query type="search" value="${escapeAttr(uiState.filters.query)}" placeholder="Nome, marca, categoria...">
      </label>

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

function bindLabActions(root) {
  root.querySelectorAll('[data-toggle-product]').forEach((button) => {
    button.addEventListener('click', () => {
      const productId = button.getAttribute('data-toggle-product');
      toggleProductVisibility(productId);
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
      closeModal();
      renderApp(root);
    });
  });

  const queryInput = root.querySelector('[data-filter-query]');
  if (queryInput) {
    queryInput.addEventListener('input', () => {
      uiState.filters.query = queryInput.value;
      renderApp(root);
    });
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
      closeModal();
      uiState.filters = {
        query: '',
        category: 'all',
        status: PRODUCT_STATUS_FILTERS.ALL,
      };
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
      const draft = readProductForm(form);
      const result = saveProduct(draft);

      if (!result.ok) {
        uiState.modalDraft = draft;
        uiState.modalErrors = result.errors || [result.message || 'Não foi possível salvar.'];
        renderApp(root);
        return;
      }

      closeModal();
      renderApp(root);
    });
  }
}

export function renderApp(root) {
  if (!root) return;

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
        <h2>Estado do BLOCO 4</h2>
        <p>
          Busca, filtros, contadores e refinamento da tela de produtos LAB adicionados. Firebase,
          login Google, catálogo real, IA real, vendas reais e pagamentos reais continuam desconectados.
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
