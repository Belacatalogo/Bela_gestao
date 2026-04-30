import { APP_CONFIG, CRITICAL_FEATURES } from './config/appConfig.js';
import {
  getLabProducts,
  getLabStorageInfo,
  resetLabProducts,
  updateLabProductVisibility,
} from './services/labDataService.js';
import { formatBRL } from './utils/money.js';

function featureList() {
  return CRITICAL_FEATURES.map((feature) => `<li>${feature}</li>`).join('');
}

function productRows(products) {
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
          <button class="ghost-button" data-toggle-product="${product.id}">${action}</button>
        </article>
      `;
    })
    .join('');
}

function renderProductsPanel() {
  const products = getLabProducts();
  const visibleCount = products.filter((product) => product.visibleInCatalog).length;
  const storageInfo = getLabStorageInfo();

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
        <button class="secondary-button" data-reset-lab>Restaurar dados teste</button>
      </div>

      <div class="storage-note">
        <strong>Armazenamento:</strong> ${storageInfo.mode}<br>
        <strong>Chave:</strong> <code>${storageInfo.key}</code>
      </div>

      <div class="lab-product-list">
        ${productRows(products)}
      </div>
    </section>
  `;
}

function bindLabActions(root) {
  root.querySelectorAll('[data-toggle-product]').forEach((button) => {
    button.addEventListener('click', () => {
      const productId = button.getAttribute('data-toggle-product');
      const product = getLabProducts().find((item) => item.id === productId);
      if (!product) return;
      updateLabProductVisibility(productId, !product.visibleInCatalog);
      renderApp(root);
    });
  });

  const resetButton = root.querySelector('[data-reset-lab]');
  if (resetButton) {
    resetButton.addEventListener('click', () => {
      resetLabProducts();
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
        <h2>Estado do BLOCO 1B</h2>
        <p>
          Modo visitante e catálogo fictício criados. Ainda não conecta Firebase,
          login Google, Catálogo real, IA real, vendas reais ou pagamentos reais.
        </p>
      </section>
    </main>
  `;

  bindLabActions(root);
}
