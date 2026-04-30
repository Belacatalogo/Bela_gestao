import { APP_CONFIG, CRITICAL_FEATURES } from './config/appConfig.js';
import { getDataGatewayStatus, listProducts, resetProducts, toggleProductVisibility } from './services/dataGateway.js';
import { DATA_MODES, setCurrentDataMode } from './services/environmentService.js';
import { formatBRL } from './utils/money.js';

function featureList() {
  return CRITICAL_FEATURES.map((feature) => `<li>${feature}</li>`).join('');
}

function productRows(products, canToggle = true) {
  if (!products.length) {
    return `
      <div class="empty-preview">
        Nenhum produto disponível neste modo.
      </div>
    `;
  }

  return products
    .map((product) => {
      const status = product.visibleInCatalog ? 'Publicado no preview' : 'Oculto no preview';
      const action = product.visibleInCatalog ? 'Ocultar' : 'Publicar';
      return `
        <article class="lab-product-card">
          <div>
            <span class="mini-badge">${product.category}</span>
            <h3>${product.name}</h3>
            <p>${product.brand} · ${formatBRL(product.price)}</p>
            <small>${status}</small>
          </div>
          <button class="ghost-button" data-toggle-product="${product.id}" ${canToggle ? '' : 'disabled'}>${action}</button>
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

function renderProductsPanel() {
  const gateway = listProducts();
  const products = gateway.products;
  const visibleCount = products.filter((product) => product.visibleInCatalog).length;
  const status = getDataGatewayStatus();

  return `
    <section class="panel-card lab-test-panel">
      <div class="panel-title-row">
        <div>
          <h2>Modo visitante</h2>
          <p>
            Produtos fictícios salvos apenas neste navegador. Não usa Google, Firebase nem catálogo real.
          </p>
        </div>
        <span class="safe-pill">Seguro</span>
      </div>

      <div class="mini-grid">
        <div class="mini-stat">
          <strong>${products.length}</strong>
          <span>produtos teste</span>
        </div>
        <div class="mini-stat">
          <strong>${visibleCount}</strong>
          <span>visíveis no preview</span>
        </div>
        <div class="mini-stat">
          <strong>0</strong>
          <span>alterações reais</span>
        </div>
      </div>

      <div class="lab-actions">
        <a class="primary-button" href="./catalogo-preview/">Abrir catálogo fictício</a>
        <button class="secondary-button" data-reset-lab ${status.mode === DATA_MODES.LAB ? '' : 'disabled'}>Restaurar dados teste</button>
      </div>

      <div class="storage-note">
        <strong>Fonte atual:</strong> ${gateway.source}<br>
        <strong>Chave LAB:</strong> <code>${status.labStorage.key}</code>
        ${gateway.warning ? `<br><strong>Aviso:</strong> ${gateway.warning}` : ''}
      </div>

      <div class="lab-product-list">
        ${productRows(products, status.mode === DATA_MODES.LAB)}
      </div>
    </section>
  `;
}

function bindLabActions(root) {
  root.querySelectorAll('[data-toggle-product]').forEach((button) => {
    button.addEventListener('click', () => {
      const productId = button.getAttribute('data-toggle-product');
      toggleProductVisibility(productId);
      renderApp(root);
    });
  });

  root.querySelectorAll('[data-mode]').forEach((button) => {
    button.addEventListener('click', () => {
      const mode = button.getAttribute('data-mode');
      setCurrentDataMode(mode);
      renderApp(root);
    });
  });

  const resetButton = root.querySelector('[data-reset-lab]');
  if (resetButton) {
    resetButton.addEventListener('click', () => {
      resetProducts();
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
        <h2>Estado do BLOCO 2</h2>
        <p>
          Camada de dados segura criada. O modo real aparece apenas como somente leitura e
          continua bloqueado para escrita. Firebase, login Google, catálogo real e IA real ainda não foram conectados.
        </p>
      </section>
    </main>
  `;

  bindLabActions(root);
}
