export function buildEmptyProductDraft() {
  return {
    id: '',
    name: '',
    brand: 'O Boticário',
    description: '',
    price: '',
    cost: '',
    imageUrl: '',
    category: 'feminino',
    catalogTabs: 'todos',
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
    imageUrl: product.imageUrl?.startsWith('data:image/svg+xml') ? '' : product.imageUrl || '',
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

function isSelected(value, current) {
  const selected = String(current || '').toLowerCase().split(',').map((item) => item.trim());
  return selected.includes(String(value).toLowerCase());
}

function field({ label, name, value, type = 'text', placeholder = '', required = false, hint = '' }) {
  return `
    <label class="legacy-product-field">
      <span>${label}${required ? ' *' : ''}</span>
      <input name="${name}" type="${type}" value="${escapeAttr(value)}" placeholder="${escapeAttr(placeholder)}" ${required ? 'required' : ''}>
      ${hint ? `<small>${hint}</small>` : ''}
    </label>
  `;
}

function imagePreview(draft) {
  if (!draft.imageUrl) return '<div class="legacy-no-photo" data-upload-status>Nenhuma foto adicionada</div>';
  return `
    <div class="legacy-product-preview" data-upload-status>
      <img src="${escapeAttr(draft.imageUrl)}" alt="Prévia da imagem do produto">
      <span>URL pronta para IA</span>
    </div>
  `;
}

function chipGroup({ title, name, current, options, multi = false }) {
  return `
    <div class="legacy-chip-group" data-chip-group="${name}" data-chip-multi="${multi ? 'true' : 'false'}">
      <span>${title}</span>
      <div>
        ${options.map((option) => {
          const active = multi ? isSelected(option.value, current) : String(current || '').toLowerCase() === String(option.value).toLowerCase();
          return `<button type="button" class="legacy-choice-chip ${active ? 'active' : ''}" data-chip-value="${escapeAttr(option.value)}">${option.label}</button>`;
        }).join('')}
      </div>
      <input type="hidden" name="${name}" value="${escapeAttr(current)}">
    </div>
  `;
}

function aiSuggestionBox(draft) {
  const hasUrl = Boolean(String(draft.imageUrl || '').trim());
  return `
    <section class="legacy-ai-panel ${hasUrl ? 'ready' : 'locked'}" data-ai-panel>
      <div>
        <h3>✨ IA do produto</h3>
        <p>A análise da foto só libera depois que o Cloudinary gerar e preencher a URL automaticamente.</p>
      </div>
      <div class="legacy-ai-actions">
        <button type="button" class="secondary-button" data-ai-fill-product ${hasUrl ? '' : 'disabled'}>Preencher com IA LAB</button>
        <button type="button" class="ghost-button" data-ai-photo-hint ${hasUrl ? '' : 'disabled'}>${hasUrl ? 'Analisar foto' : 'Aguardando URL'}</button>
      </div>
      <div class="legacy-ai-hint" data-ai-product-hint>
        ${hasUrl ? 'URL pronta. A análise por IA poderá usar esta imagem.' : 'Escolha uma foto do celular. O upload começa automaticamente; quando a URL aparecer, a IA será liberada.'}
      </div>
    </section>
  `;
}

export function renderProductFormModal({ draft, errors = [], isEditing = false }) {
  if (!draft) return '';

  return `
    <div class="modal-backdrop legacy-product-backdrop" data-modal-backdrop>
      <section class="product-modal legacy-product-modal" role="dialog" aria-modal="true" aria-labelledby="product-modal-title">
        <div class="modal-handle"></div>
        <div class="legacy-product-title">
          <div>
            <h2 id="product-modal-title">${isEditing ? 'Editar Produto' : 'Novo Produto'}</h2>
            <p>Foto → Cloudinary → URL → IA</p>
          </div>
          <button class="icon-button" data-close-modal aria-label="Fechar">×</button>
        </div>

        ${errors.length ? `<div class="form-errors">${errors.map((error) => `<div>${error}</div>`).join('')}</div>` : ''}

        <form class="product-form legacy-product-form" data-product-form>
          <input type="hidden" name="id" value="${escapeAttr(draft.id)}">

          <section class="legacy-product-section">
            <h3>Fotos do produto — upload automático no Cloudinary</h3>
            ${imagePreview(draft)}
            <div class="legacy-photo-box">
              <label class="legacy-product-field">
                <span>URL gerada automaticamente</span>
                <input name="imageUrl" value="${escapeAttr(draft.imageUrl)}" placeholder="A URL aparecerá aqui após o upload" data-product-image-url>
                <small>Quando a URL aparecer, a análise com IA será liberada.</small>
              </label>
              <div class="legacy-photo-actions auto-only">
                <label class="secondary-button legacy-file-button">📷 Escolher foto<input name="imageFile" type="file" accept="image/*" hidden data-cloudinary-file-input></label>
              </div>
              <div class="legacy-upload-hint" data-cloudinary-upload-hint>Toque em Escolher foto. O envio ao Cloudinary começa automaticamente.</div>
            </div>
          </section>

          ${aiSuggestionBox(draft)}

          ${field({ label: 'Nome', name: 'name', value: draft.name, placeholder: 'Ex: Glamour Secret Black', required: true })}
          ${field({ label: 'Marca', name: 'brand', value: draft.brand, placeholder: 'Ex: O Boticário', required: true })}
          ${field({ label: 'Descrição', name: 'description', value: draft.description, placeholder: 'Ex: Deo Parfum 90ml' })}

          <div class="legacy-price-row">
            <span>R$</span>
            ${field({ label: 'Preço de venda (R$)', name: 'price', type: 'number', value: draft.price, placeholder: '0,00', required: true })}
          </div>

          <div class="legacy-hidden-grid">
            ${field({ label: 'Custo', name: 'cost', type: 'number', value: draft.cost, placeholder: 'opcional' })}
            ${field({ label: 'Estoque', name: 'stock', type: 'number', value: draft.stock, placeholder: '1' })}
          </div>

          ${chipGroup({
            title: 'Categoria (gestão)',
            name: 'category',
            current: draft.category,
            options: [
              { value: 'feminino', label: 'Feminino' },
              { value: 'masculino', label: 'Masculino' },
              { value: 'kit', label: 'Kit' },
              { value: 'hidratante', label: 'Hidratante' },
              { value: 'dia das mães', label: 'Dia das Mães' },
              { value: 'kids', label: 'Kids' },
              { value: 'maquiagem', label: 'Maquiagem' },
            ],
          })}

          ${chipGroup({
            title: 'Abas no catálogo',
            name: 'catalogTabs',
            current: draft.catalogTabs,
            multi: true,
            options: [
              { value: 'todos', label: 'Todos ✓' },
              { value: 'coleção', label: 'Coleção' },
              { value: 'dia das mães', label: 'Dia das Mães' },
              { value: 'beleza & kids', label: 'Beleza & Kids' },
            ],
          })}

          <div class="legacy-hidden-grid">
            ${field({ label: 'Selo', name: 'badge', value: draft.badge, placeholder: 'Promoção' })}
            ${field({ label: 'Ordem', name: 'order', type: 'number', value: draft.order, placeholder: '1' })}
          </div>

          <label class="toggle-field legacy-publish-toggle">
            <input type="checkbox" name="visibleInCatalog" ${draft.visibleInCatalog ? 'checked' : ''}>
            <span>Salvar e publicar no catálogo fictício</span>
          </label>

          <div class="modal-actions legacy-product-actions">
            <button class="secondary-button" type="button" data-close-modal>Cancelar</button>
            <button class="primary-button" type="submit">Salvar & Publicar</button>
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
    imageFile: null,
    category: data.get('category') || '',
    catalogTabs: data.get('catalogTabs') || '',
    visibleInCatalog: data.get('visibleInCatalog') === 'on',
    badge: data.get('badge') || '',
    stock: data.get('stock') || '',
    order: data.get('order') || '',
  };
}
