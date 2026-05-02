import { formatBRL } from '../utils/money.js';

export function renderPaymentsPanel({ payments, stats, canWrite = true }) {
  const importedCount = payments.filter((payment) => payment.legacyProductId || payment.legacySid).length;

  return `
    <section class="panel-card payments-panel">
      <div class="panel-title-row">
        <div>
          <h2>Pagamentos LAB</h2>
          <p>Controle fictício e parcelas importadas do backup real.</p>
        </div>
        <span class="safe-pill">${importedCount ? `${importedCount} importadas` : 'LAB'}</span>
      </div>

      <div class="mini-grid four-stats">
        <div class="mini-stat"><strong>${stats.count}</strong><span>parcelas</span></div>
        <div class="mini-stat"><strong>${formatBRL(stats.paidAmount)}</strong><span>recebido</span></div>
        <div class="mini-stat"><strong>${formatBRL(stats.pendingAmount)}</strong><span>pendente</span></div>
        <div class="mini-stat"><strong>${stats.pendingCount}</strong><span>abertas</span></div>
      </div>

      <div class="storage-note">
        Parcelas LAB são locais. Parcelas importadas preservam vencimento, histórico e observação quando disponíveis.
      </div>

      <div class="sales-list">${renderPaymentRows(payments, canWrite)}</div>
    </section>
  `;
}

function renderPaymentRows(payments, canWrite) {
  if (!payments.length) return '<div class="empty-preview">Nenhuma parcela LAB gerada ainda.</div>';

  return payments.map((payment) => `
    <article class="sale-card">
      <div>
        <div class="badge-row">
          <span class="mini-badge">${payment.status}</span>
          <span class="mini-badge muted-badge">${payment.installmentNumber}/${payment.installmentsTotal}</span>
          ${payment.legacyProductId ? '<span class="mini-badge">backup real</span>' : ''}
        </div>
        <h3>${payment.saleClientName}</h3>
        <p>${payment.saleProductName} · ${formatBRL(payment.amount)}</p>
        <small>${payment.status === 'pago' ? 'Parcela recebida no LAB' : 'Parcela pendente no LAB'}</small>
        ${renderLegacyPaymentMeta(payment)}
      </div>
      <div class="product-actions">
        <button class="ghost-button" data-payment-status="${payment.id}" data-next-status="pago" ${canWrite ? '' : 'disabled'}>Pago</button>
        <button class="ghost-button" data-payment-status="${payment.id}" data-next-status="pendente" ${canWrite ? '' : 'disabled'}>Pendente</button>
      </div>
    </article>
  `).join('');
}

function renderLegacyPaymentMeta(payment) {
  const rows = [];
  if (payment.legacyProductId) rows.push(`ID produto real: ${payment.legacyProductId}`);
  if (payment.legacySid) rows.push(`SID: ${payment.legacySid}`);
  if (payment.dueDate) rows.push(`Vencimento: ${payment.dueDate}`);
  if (payment.paidAt) rows.push(`Histórico: ${payment.paidAt}`);
  if (payment.notes) rows.push(`Obs: ${payment.notes}`);

  if (!rows.length) return '';
  return `<div class="storage-note legacy-meta">${rows.map((row) => `<span>${row}</span>`).join('<br>')}</div>`;
}
