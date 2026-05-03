import { renderCleanApp as renderClientsApp } from './cleanAppClients.js';
import { APP_CONFIG } from './config/appConfig.js';
import { buildPaymentInsights, buildWhatsAppChargeLink, filterPaymentInsights } from './services/paymentInsightsService.js';
import { syncPaymentsFromSales, updateLabPaymentStatus } from './services/labPaymentsService.js';
import { getLabSales } from './services/labSalesService.js';
import { formatBRL } from './utils/money.js';

const PAYMENT_STATE = {
  query: '',
  mode: 'todos',
  sort: 'vencimento',
};

function esc(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function getPaymentData() {
  const sales = getLabSales();
  const payments = syncPaymentsFromSales(sales);
  return buildPaymentInsights({ sales, payments });
}

function renderPaymentMetrics(stats) {
  return `
    ${stats.dueThisWeek ? `<div class="payment-alert">⚠ ${stats.dueThisWeek} vence${stats.dueThisWeek === 1 ? '' : 'm'} essa semana</div>` : ''}
    <div class="payments-dashboard">
      <article><strong>${stats.clients}</strong><span>Clientes</span></article>
      <article><strong>${stats.overdue}</strong><span>Em atraso</span></article>
      <article><strong>${stats.due7}</strong><span>Vencem 7 dias</span></article>
      <article><strong>${formatBRL(stats.totalToReceive)}</strong><span>A receber</span></article>
      <article><strong>${formatBRL(stats.totalReceived)}</strong><span>Recebido</span></article>
    </div>
  `;
}

function renderPaymentFilters() {
  const modes = [
    ['todos', 'Todos'],
    ['pendentes', 'Pendentes'],
    ['atraso', 'Em atraso'],
    ['vence7', 'Vence 7 dias'],
    ['parceladas', 'Parceladas'],
    ['quitadas', 'Quitadas'],
  ];
  const sorts = [
    ['vencimento', 'Vencimento'],
    ['maior-atraso', 'Maior atraso'],
    ['maior-valor', 'Maior valor'],
    ['nome', 'Nome A-Z'],
  ];

  return `
    <div class="payment-chip-row">${modes.map(([id, label]) => `<button class="payment-chip ${PAYMENT_STATE.mode === id ? 'active' : ''}" data-payment-mode="${id}">${label}</button>`).join('')}</div>
    <div class="payment-sort-row"><span>Ordenar</span>${sorts.map(([id, label]) => `<button class="payment-sort ${PAYMENT_STATE.sort === id ? 'active' : ''}" data-payment-sort="${id}">${label}</button>`).join('')}</div>
    <div class="payment-search-wrap"><input data-payment-query value="${esc(PAYMENT_STATE.query)}" placeholder="🔍 Buscar por nome ou produto..."></div>
  `;
}

function dueLabel(payment) {
  if (payment.status === 'pago') return 'Quitado';
  if (payment.isOverdue) return `${Math.abs(payment.daysUntilDue)}d em atraso`;
  if (payment.daysUntilDue === 0) return 'Vence hoje';
  return `Vence em ${payment.daysUntilDue} dias — ${payment.dueDateLabel}`;
}

function renderInstallments(payment) {
  const total = Math.max(1, Number(payment.installmentsTotal || 1));
  const current = Math.max(1, Number(payment.installmentNumber || 1));
  return Array.from({ length: total }).map((_, index) => {
    const number = index + 1;
    const paid = payment.status === 'pago' || number < current;
    return `
      <button class="payment-installment ${paid ? 'paid' : 'pending'}" data-payment-status="${esc(payment.id)}" data-next-status="${paid ? 'pendente' : 'pago'}">
        <span>${number}ª</span>
        <strong>${formatBRL(payment.amount)}</strong>
        <small>${paid ? 'quitada' : 'pendente'}</small>
      </button>
    `;
  }).join('');
}

function renderPaymentCard(payment) {
  const progress = payment.total ? Math.min(100, Math.round((payment.paidAmount / payment.total) * 100)) : (payment.status === 'pago' ? 100 : 0);
  return `
    <article class="payment-card ${payment.isOverdue ? 'overdue' : ''} ${payment.status === 'pago' ? 'paid' : ''}">
      <header class="payment-card-head">
        <div class="payment-avatar">${esc(payment.initials)}</div>
        <div>
          <h3>${esc(payment.clientName)}</h3>
          <p>${esc(payment.productName)}</p>
        </div>
        <span>${payment.status === 'pago' ? 'Quitada' : `${payment.installmentsTotal || 1} parc. pendente`}</span>
      </header>
      <div class="payment-due-line">📅 ${esc(dueLabel(payment))}</div>
      <div class="payment-progress"><div style="width:${progress}%"></div></div>
      <div class="payment-info-grid">
        <article><span>Total da venda</span><strong>${formatBRL(payment.total || payment.amount)}</strong></article>
        <article><span>Recebido</span><strong>${formatBRL(payment.paidAmount)}</strong></article>
        <article><span>Falta receber</span><strong>${formatBRL(payment.pendingAmount)}</strong></article>
        <article><span>Pagamento</span><strong>${payment.installmentsTotal || 1}x parcelas</strong></article>
        <article><span>Data da compra</span><strong>${esc(payment.purchaseDate)}</strong></article>
        <article><span>Próx. vencimento</span><strong>${esc(payment.dueDateLabel)}</strong></article>
        <article><span>Telefone</span><strong>${esc(payment.phone || 'sem telefone')}</strong></article>
      </div>
      <p class="payment-help">Toque na parcela para marcar como recebida</p>
      <div class="payment-installment-grid">${renderInstallments(payment)}</div>
      <div class="payment-actions-row">
        <button class="ghost-button">📅 Editar datas</button>
        <a class="payment-charge-button" href="${esc(buildWhatsAppChargeLink(payment))}" target="_blank" rel="noopener">💬 Cobrar</a>
      </div>
      <div class="payment-method-row"><button>PIX</button><button>Dinheiro</button><button>Cartão</button><button>Boleto</button></div>
      <textarea class="payment-note" placeholder="📝 Observações... (ex: paga por PIX, combinado dia 10...)">${esc(payment.notes || '')}</textarea>
    </article>
  `;
}

function renderPaymentsTab(root) {
  const data = getPaymentData();
  const payments = filterPaymentInsights(data.payments, PAYMENT_STATE);

  const page = document.createElement('section');
  page.className = 'clean-section payments-page';
  page.innerHTML = `
    <div class="clean-section-title"><span>Pagamentos</span><h2>Parcelas e cobranças</h2></div>
    ${renderPaymentMetrics(data.stats)}
    ${renderPaymentFilters()}
    <div class="payment-count-line">${payments.length} cliente${payments.length === 1 ? '' : 's'}</div>
    <div class="payment-list">${payments.length ? payments.map(renderPaymentCard).join('') : '<div class="payments-empty">Nenhum pagamento encontrado.</div>'}</div>
    <div class="payment-bottom-bar"><article><strong>${data.stats.pendingCount}</strong><span>pendentes</span></article><article><strong>${formatBRL(data.stats.totalReceived)}</strong><span>recebido</span></article><article><strong>${formatBRL(data.stats.totalToReceive)}</strong><span>a receber</span></article></div>
  `;

  const main = root.querySelector('.clean-page');
  if (!main) return;
  const currentContent = [...main.children].filter((child) => !child.classList.contains('clean-hero') && !child.classList.contains('clean-tab-nav') && !child.classList.contains('clean-notice'));
  currentContent.forEach((child) => child.remove());
  main.appendChild(page);
}

function syncPaymentActiveTab(root) {
  root.querySelectorAll('[data-clean-tab]').forEach((button) => {
    button.classList.toggle('active', button.getAttribute('data-clean-tab') === 'pagamentos');
  });
}

function bindPayments(root) {
  root.querySelector('[data-clean-tab="pagamentos"]')?.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();
    window.localStorage.setItem('belaGestaoLab.cleanTab', 'pagamentos');
    renderClientsApp(root);
    enhancePayments(root);
  });

  root.querySelectorAll('[data-payment-mode]').forEach((button) => button.addEventListener('click', () => {
    PAYMENT_STATE.mode = button.getAttribute('data-payment-mode') || 'todos';
    renderPaymentsTab(root);
    syncPaymentActiveTab(root);
    bindPayments(root);
  }));

  root.querySelectorAll('[data-payment-sort]').forEach((button) => button.addEventListener('click', () => {
    PAYMENT_STATE.sort = button.getAttribute('data-payment-sort') || 'vencimento';
    renderPaymentsTab(root);
    syncPaymentActiveTab(root);
    bindPayments(root);
  }));

  const queryInput = root.querySelector('[data-payment-query]');
  queryInput?.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      PAYMENT_STATE.query = queryInput.value || '';
      renderPaymentsTab(root);
      syncPaymentActiveTab(root);
      bindPayments(root);
    }
  });
  queryInput?.addEventListener('change', () => {
    PAYMENT_STATE.query = queryInput.value || '';
    renderPaymentsTab(root);
    syncPaymentActiveTab(root);
    bindPayments(root);
  });

  root.querySelectorAll('[data-payment-status]').forEach((button) => button.addEventListener('click', () => {
    updateLabPaymentStatus(button.getAttribute('data-payment-status'), button.getAttribute('data-next-status'));
    renderPaymentsTab(root);
    syncPaymentActiveTab(root);
    bindPayments(root);
  }));
}

function enhancePayments(root) {
  const activeTab = window.localStorage.getItem('belaGestaoLab.cleanTab');
  if (activeTab === 'pagamentos') {
    renderPaymentsTab(root);
    syncPaymentActiveTab(root);
  }
  bindPayments(root);
}

export function renderCleanApp(root) {
  renderClientsApp(root);
  if (!root) return;
  root.setAttribute('data-bela-version', APP_CONFIG.version);
  enhancePayments(root);
}
