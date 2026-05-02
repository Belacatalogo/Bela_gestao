import { formatBRL } from '../utils/money.js';

export function renderSalesPanel({ products, sales, stats, errors = [], canWrite = true }) {
  const productOptions = products
    .map((product) => `<option value="${product.id}">${product.name} · ${formatBRL(product.price)}</option>`)
    .join('');
  const importedCount = sales.filter((sale) => sale.legacyProductId || sale.legacySid).length;

  return `
    <section class="panel-card sales-panel">
      <div class="panel-title-row">
        <div>
          <h2>Vendas LAB</h2>
          <p>Vendas fictícias e vendas importadas do backup real para conferência segura.</p>
        </div>
        <span class="safe-pill">${importedCount ? `${importedCount} importadas` : 'LAB'}</span>
      </div>

      <div class="mini-grid four-stats">
        <div class="mini-stat"><strong>${stats.count}</strong><span>vendas</span></div>
        <div class="mini-stat"><strong>${formatBRL(stats.totalSold)}</strong><span>vendido</span></div>
        <div class="mini-stat"><strong>${formatBRL(stats.totalProfit)}</strong><span>lucro</span></div>
        <div class="mini-stat"><strong>${stats.pending}</strong><span>pendentes</span></div>
      </div>

      ${errors.length ? `<div class="form-errors">${errors.map((error) => `<div>${error}</div>`).join('')}</div>` : ''}

      <form class="sale-form" data-sale-form>
        <label class="form-field"><span>Cliente *</span><input name="clientName" type="text" placeholder="Nome da cliente" ${canWrite ? '' : 'disabled'}></label>
        <label class="form-field"><span>Produto *</span><select name="productId" ${canWrite ? '' : 'disabled'}><option value="">Selecione um produto</option>${productOptions}</select></label>
        <div class="form-grid-2">
          <label class="form-field"><span>Quantidade</span><input name="quantity" type="number" min="1" value="1" ${canWrite ? '' : 'disabled'}></label>
          <label class="form-field"><span>Status</span><select name="status" ${canWrite ? '' : 'disabled'}><option value="pendente">Pendente</option><option value="pago">Pago</option><option value="reservado">Reservado</option></select></label>
        </div>
        <label class="form-field"><span>Observação</span><textarea name="notes" rows="2" placeholder="Ex: entregar sábado" ${canWrite ? '' : 'disabled'}></textarea></label>
        <button class="primary-button" type="submit" ${canWrite ? '' : 'disabled'}>Registrar venda LAB</button>
      </form>

      <div class="sales-list">${renderSalesList(sales, canWrite)}</div>
    </section>
  `;
}

function renderSalesList(sales, canWrite) {
  if (!sales.length) return '<div class="empty-preview">Nenhuma venda LAB registrada ainda.</div>';

  return sales.map((sale) => `
    <article class="sale-card">
      <div>
        <div class="badge-row">
          <span class="mini-badge">${sale.status}</span>
          <span class="mini-badge muted-badge">${sale.quantity}x</span>
          ${sale.legacyProductId ? '<span class="mini-badge">backup real</span>' : ''}
        </div>
        <h3>${sale.clientName}</h3>
        <p>${sale.productName} · ${formatBRL(sale.total)}</p>
        <small>Lucro LAB: ${formatBRL(sale.profit)}</small>
        ${renderLegacySaleMeta(sale)}
      </div>
      <div class="product-actions">
        <button class="ghost-button" data-sale-status="${sale.id}" data-next-status="pago" ${canWrite || sale.status !== 'pago' ? '' : 'disabled'}>Pago</button>
        <button class="ghost-button" data-sale-status="${sale.id}" data-next-status="pendente" ${canWrite ? '' : 'disabled'}>Pendente</button>
      </div>
    </article>
  `).join('');
}

function renderLegacySaleMeta(sale) {
  const rows = [];
  if (sale.legacyProductId) rows.push(`ID produto real: ${sale.legacyProductId}`);
  if (sale.legacySid) rows.push(`SID: ${sale.legacySid}`);
  if (sale.purchaseDate) rows.push(`Compra: ${sale.purchaseDate}`);
  if (sale.dueDate) rows.push(`Vencimento: ${sale.dueDate}`);
  if (sale.installmentsTotal) rows.push(`Parcelas: ${sale.installmentsTotal}`);
  if (sale.phone) rows.push(`Telefone: ${sale.phone}`);
  if (sale.cpf) rows.push(`CPF: ${sale.cpf}`);
  if (sale.notes) rows.push(`Obs: ${sale.notes}`);

  if (!rows.length) return '';
  return `<div class="storage-note legacy-meta">${rows.map((row) => `<span>${row}</span>`).join('<br>')}</div>`;
}

export function readSaleForm(form) {
  const data = new FormData(form);
  return {
    clientName: data.get('clientName') || '',
    productId: data.get('productId') || '',
    quantity: data.get('quantity') || '1',
    status: data.get('status') || 'pendente',
    notes: data.get('notes') || '',
  };
}
