import { getVisibleCatalogProducts } from '../src/services/labDataService.js';
import { formatBRL } from '../src/utils/money.js';

const root = document.getElementById('catalog-preview');

function productCards(products) {
  if (!products.length) {
    return `
      <div class="empty-preview">
        Nenhum produto visível no catálogo fictício.
      </div>
    `;
  }

  return products
    .map((product) => `
      <article class="preview-product-card">
        <div class="preview-image-wrap">
          <img src="${product.imageUrl}" alt="${product.name}" loading="lazy">
          ${product.badge ? `<span class="preview-badge">${product.badge}</span>` : ''}
        </div>
        <div class="preview-product-body">
          <span class="preview-brand">${product.brand}</span>
          <h2>${product.name}</h2>
          <p>${product.description}</p>
          <strong>${formatBRL(product.price)}</strong>
        </div>
      </article>
    `)
    .join('');
}

function uniqueTabs(products) {
  const tabs = new Set();
  products.forEach((product) => {
    (product.catalogTabs || []).forEach((tab) => tabs.add(tab));
  });
  return [...tabs];
}

function render() {
  if (!root) return;
  const products = getVisibleCatalogProducts();
  const tabs = uniqueTabs(products);

  root.innerHTML = `
    <main class="preview-page">
      <section class="preview-hero">
        <div class="eyebrow">Modo LAB · catálogo fictício</div>
        <h1>Bela <span>Catálogo</span></h1>
        <p>
          Esta vitrine usa somente dados de teste do navegador. Não altera nem lê o catálogo real.
        </p>
        <a class="back-link" href="../">Voltar para Gestão LAB</a>
      </section>

      <section class="preview-info-card">
        <strong>${products.length}</strong>
        <span>produtos visíveis</span>
        <small>Abas simuladas: ${tabs.length ? tabs.join(' · ') : 'nenhuma'}</small>
      </section>

      <section class="preview-grid">
        ${productCards(products)}
      </section>
    </main>
  `;
}

render();
