import { formatBRL } from '../utils/money.js';

export function renderPaymentsPanel({ payments, stats, canWrite = true }) {
  const importedPayments = payments.filter((payment) => payment.legacyProductId || payment.legacySid);
  const importedPending = importedPayments.filter((payment) => payment.status !== 'pago');
  const importedPaid = importedPayments.filter((payment) => payment.status === 'pago');
  const dueGroups = groupPendingByDueDate(importedPending);
  const orderedPayments = orderPaymentsForReview(payments);

  return `
    <section class="panel-card payments-panel">
      <div class="panel-title-row">
        <div>
          <h2>Pagamentos LAB</h2>
          <p>Controle fictício e parcelas importadas do backup real.</p>
        </div>
        <span class="safe-pill">${importedPayments.length ? `${importedPayments.length} importadas` : 'LAB'}</span>
      </div>

      <div class="mini-grid four-stats">
        <div class="mini-stat"><strong>${stats.count}</strong><span>parcelas</span></div>
        <div class="mini-stat"><strong>${formatBRL(stats.paidAmount)}</strong><span>recebido</span></div>
        <div class="mini-stat"><strong>${formatBRL(stats.pendingAmount)}</strong><span>pendente</span></div>
        <div class="mini-stat"><strong>${stats.pendingCount}</strong><span>abertas</span></div>
      </div>

      ${importedPayments.length ? `
        <div class="mini-grid four-stats">
          <div class="mini-stat"><strong>${importedPending.length}</strong><span>importadas abertas</span></div>
          <div class="mini-stat"><strong>${importedPaid.length}</strong><span>importadas pagas</span></div>
          <div class="mini-stat"><strong>${dueGroups.length}</strong><span>vencimentos</span></div>
          <div class="mini-stat"><strong>${countWithNotes(importedPayments)}</strong><span>com observação</span></div>
        </div>
        ${renderDueSummary(dueGroups)}
      ` : ''}

      <div class="storage-note">
        Parcelas pendentes aparecem primeiro. Parcelas importadas preservam vencimento, histórico e observação quando disponíveis.
      </div>

      <div class="sales-list">${renderPaymentRows(orderedPayments, canWrite)}</div>
    </section>
  `;
}

function orderPaymentsForReview(payments) {
  return [...payments].sort((a, b) => {
    const aPending = a.status === 'pago' ? 1 : 0;
    const bPending = b.status === 'pago' ? 1 : 0;
    if (aPending !== bPending) return aPending - bPending;
    const aDue = a.dueDate || '9999-99-99';
    const bDue = b.dueDate || '9999-99-99';
    if (aDue !== bDue) return aDue.localeCompare(bDue);
    return String(a.saleClientName || '').localeCompare(String(b.saleClientName || ''));
  });
}

function groupPendingByDueDate(payments) {
  const map = new Map();
  payments.forEach((payment) => {
    const key = payment.dueDate || 'sem vencimento';
    map.set(key, (map.get(key) || 0) + 1);
  });
  return Array.from(map.entries())
    .map(([dueDate, count]) => ({ dueDate, count }))
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}

function countWithNotes(payments) {
  return payments.filter((payment) => String(payment.notes || '').trim()).length;
}

function renderDueSummary(groups) {
  if (!groups.length) return '<div class="diagnostic-ok">Nenhuma parcela importada pendente.</div>';
  return `
    <details class="diagnostic-details" open>
      <summary>Resumo por vencimento</summary>
      <div class="diagnostic-table">
        ${groups.map((group) => `
          <div class="diagnostic-row">
            <span>${group.dueDate}</span>
            <strong>${group.count} parcela(s)</strong>
          </div>
        `).join('')}
      </div>
    </details>
  `;
}

function renderPaymentRows(payments, canWrite) {
  if (!payments.length) return '<div class="empty-preview">Nenhuma parcela LAB gerada ainda.</div>';

  return payments.map((payment) => `
    <article class="sale-card ${payment.status === 'pago' ? 'payment-paid' : 'payment-pending'}">
      <div>
        <div class="badge-row">
          <span class="mini-badge">${payment.status}</span>
          <span class="mini-badge muted-badge">${payment.installmentNumber}/${payment.installmentsTotal}</span>
          ${payment.legacyProductId ? '<span class="mini-badge">backup real</span>' : ''}
          ${payment.dueDate ? `<span class="mini-badge muted-badge">venc. ${payment.dueDate}</span>` : ''}
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
