export function buildEmptyProductDraft() {
  return {
    id: '',
    name: '',
    brand: 'Bela LAB',
    description: '',
    price: '',
    cost: '',
    imageUrl: '',
    category: 'perfumes',
    catalogTabs: 'todos, perfumes',
    visibleInCatalog: true,
    badge: '',
    stock: '1',
    order: '',
  };
}

export function productToDraft(product) {
  if (!product) return buildEmptyProductDraft();

  return {
    id: product.id || '',
    name: product.name || '',
    brand: product.brand || '',
    description: product.description || '',
    price: product.price || '',
    cost: product.cost || '',
    imageUrl: product.imageUrl || '',
    category: product.category || '',
    catalogTabs: (product.catalogTabs || []).join(', '),
    visibleInCatalog: Boolean(product.visibleInCatalog),
    badge: product.badge || '',
    stock: product.stock || '0',
    order: product.order || '',
  };
}

function escapeAttr(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function field({ label, name, value, type = 'text', placeholder = '', required = false }) {
  return `
    <label class="form-field">
      <span>${label}${required ? ' *' : ''}</span>
      <input
        name="${name}"
        type="${type}"
        value="${escapeAttr(value)}"
        placeholder="${escapeAttr(placeholder)}"
        ${required ? 'required' : ''}
      >
    </label>
  `;
}

export function renderProductFormModal({ draft, errors = [], isEditing = false }) {
  if (!draft) return '';

  return `
    <div class="modal-backdrop" data-modal-backdrop>
      <section class="product-modal" role="dialog" aria-modal="true" aria-labelledby="product-modal-title">
        <div class="modal-handle"></div>
        <div class="panel-title-row">
          <div>
            <h2 id="product-modal-title">${isEditing ? 'Editar produto LAB' : 'Novo produto LAB'}</h2>
            <p>Produto fictício. Não altera Firebase nem catálogo real.</p>
          </div>
          <button class="icon-button" data-close-modal aria-label="Fechar">×</button>
        </div>

        ${errors.length ? `
          <div class="form-errors">
            ${errors.map((error) => `<div>${error}</div>`).join('')}
          </div>
        ` : ''}

        <form class="product-form" data-product-form>
          <input type="hidden" name="id" value="${escapeAttr(draft.id)}">

          ${field({ label: 'Nome', name: 'name', value: draft.name, placeholder: 'Ex: Perfume Glamour', required: true })}
          ${field({ label: 'Marca', name: 'brand', value: draft.brand, placeholder: 'Ex: Avon', required: true })}

          <label class="form-field">
            <span>Descrição</span>
            <textarea name="description" rows="3" placeholder="Descrição para aparecer no catálogo">${escapeAttr(draft.description)}</textarea>
          </label>

          <div class="form-grid-2">
            ${field({ label: 'Preço', name: 'price', type: 'number', value: draft.price, placeholder: '89.90', required: true })}
            ${field({ label: 'Custo', name: 'cost', type: 'number', value: draft.cost, placeholder: '50.00' })}
          </div>

          ${field({ label: 'Imagem URL', name: 'imageUrl', value: draft.imageUrl, placeholder: 'https://...', required: true })}

          <div class="form-grid-2">
            ${field({ label: 'Categoria', name: 'category', value: draft.category, placeholder: 'perfumes', required: true })}
            ${field({ label: 'Estoque', name: 'stock', type: 'number', value: draft.stock, placeholder: '1' })}
          </div>

          ${field({ label: 'Abas do catálogo', name: 'catalogTabs', value: draft.catalogTabs, placeholder: 'todos, perfumes, destaques' })}

          <div class="form-grid-2">
            ${field({ label: 'Selo', name: 'badge', value: draft.badge, placeholder: 'Promoção' })}
            ${field({ label: 'Ordem', name: 'order', type: 'number', value: draft.order, placeholder: '1' })}
          </div>

          <label class="toggle-field">
            <input type="checkbox" name="visibleInCatalog" ${draft.visibleInCatalog ? 'checked' : ''}>
            <span>Publicado no catálogo fictício</span>
          </label>

          <div class="modal-actions">
            <button class="primary-button" type="submit">Salvar no LAB</button>
            <button class="secondary-button" type="button" data-close-modal>Cancelar</button>
          </div>
        </form>
      </section>
    </div>
  `;
}

export function readProductForm(form) {
  const data = new FormData(form);

  return {
    id: data.get('id') || '',
    name: data.get('name') || '',
    brand: data.get('brand') || '',
    description: data.get('description') || '',
    price: data.get('price') || '',
    cost: data.get('cost') || '',
    imageUrl: data.get('imageUrl') || '',
    category: data.get('category') || '',
    catalogTabs: data.get('catalogTabs') || '',
    visibleInCatalog: data.get('visibleInCatalog') === 'on',
    badge: data.get('badge') || '',
    stock: data.get('stock') || '',
    order: data.get('order') || '',
  };
}
