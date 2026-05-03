import { renderCleanApp as renderPaymentsApp } from './cleanAppPayments.js';
import { APP_CONFIG } from './config/appConfig.js';
import { buildPaymentInsights, buildWhatsAppChargeLink } from './services/paymentInsightsService.js';
import { buildReportInsights, shiftReportMonth } from './services/reportInsightsService.js';
import { syncPaymentsFromSales } from './services/labPaymentsService.js';
import { getLabSales } from './services/labSalesService.js';
import { formatBRL } from './utils/money.js';

const REPORT_STATE = {
  selectedDate: new Date(),
};

function esc(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function getReportData() {
  const sales = getLabSales();
  const payments = syncPaymentsFromSales(sales);
  const paymentInsights = buildPaymentInsights({ sales, payments });
  const report = buildReportInsights({ sales, payments: paymentInsights.payments, selectedDate: REPORT_STATE.selectedDate });
  return { sales, payments: paymentInsights.payments, report };
}

function renderMonthHeader(report) {
  return `
    <div class="report-month-header">
      <button data-report-month="prev">‹</button>
      <h2>${esc(report.month.label)}</h2>
      <button data-report-month="next">›</button>
    </div>
  `;
}

function renderReportMetrics(stats) {
  return `
    <div class="report-metrics-grid">
      <article><strong>${stats.salesCount}</strong><span>Vendas no mês</span></article>
      <article><strong>${formatBRL(stats.totalReceived)}</strong><span>Recebido</span></article>
      <article><strong>${formatBRL(stats.totalToReceive)}</strong><span>A receber</span></article>
      <article><strong>${formatBRL(stats.totalProfit)}</strong><span>Seu lucro</span></article>
    </div>
  `;
}

function renderSalesByCategory(categories) {
  return `
    <section class="report-section-block">
      <h3>Vendas por categoria</h3>
      ${categories.length ? categories.map((item) => `
        <div class="report-category-row">
          <span>${esc(item.category)}</span>
          <strong>${formatBRL(item.total)}</strong>
          <small>${item.count} venda${item.count === 1 ? '' : 's'}</small>
        </div>
      `).join('') : '<div class="report-empty">Nenhuma venda com data registrada neste mês</div>'}
    </section>
  `;
}

function renderReceivedPayments(payments) {
  return `
    <section class="report-section-block">
      <h3>Parcelas recebidas este mês</h3>
      ${payments.length ? payments.map((payment) => `
        <article class="report-payment-row">
          <div><strong>${esc(payment.clientName || payment.saleClientName)}</strong><span>${esc(payment.productName || payment.saleProductName)} · ${payment.installmentNumber || 1}ª parcela</span></div>
          <small>${formatBRL(payment.amount)}</small>
        </article>
      `).join('') : '<div class="report-empty small">Nenhuma parcela recebida neste mês</div>'}
    </section>
  `;
}

function renderUrgentCharges(charges) {
  return `
    <section class="report-section-block">
      <h3>⚠ Cobranças — por urgência</h3>
      ${charges.length ? charges.map((payment) => `
        <article class="report-charge-card ${payment.overdue ? 'overdue' : ''}">
          <div class="report-charge-avatar">${esc(payment.initials || 'CL')}</div>
          <div>
            <h4>${esc(payment.clientName || payment.saleClientName)}</h4>
            <p>Pendente: ${formatBRL(payment.amount)}</p>
          </div>
          <div class="report-charge-actions">
            <span>${payment.overdue ? `${Math.abs(payment.daysUntilDue)}d atraso` : `Vence em ${payment.daysUntilDue}d`}</span>
            <a href="${esc(buildWhatsAppChargeLink(payment))}" target="_blank" rel="noopener">💬 Cobrar</a>
          </div>
        </article>
      `).join('') : '<div class="report-empty small">Nenhuma cobrança urgente agora</div>'}
    </section>
  `;
}

function renderReportTab(root) {
  const { report } = getReportData();
  const page = document.createElement('section');
  page.className = 'clean-section report-page';
  page.innerHTML = `
    ${renderMonthHeader(report)}
    ${renderReportMetrics(report.stats)}
    ${renderSalesByCategory(report.salesByCategory)}
    ${renderReceivedPayments(report.receivedPayments)}
    ${renderUrgentCharges(report.urgentCharges)}
  `;

  const main = root.querySelector('.clean-page');
  if (!main) return;
  const currentContent = [...main.children].filter((child) => !child.classList.contains('clean-hero') && !child.classList.contains('clean-tab-nav') && !child.classList.contains('clean-notice'));
  currentContent.forEach((child) => child.remove());
  main.appendChild(page);
}

function ensureReportTab(root) {
  const nav = root.querySelector('.clean-tab-nav');
  if (!nav || nav.querySelector('[data-clean-tab="relatorio"]')) return;
  const productsButton = nav.querySelector('[data-clean-tab="produtos"]');
  const reportButton = document.createElement('button');
  reportButton.className = 'clean-tab-btn';
  reportButton.setAttribute('data-clean-tab', 'relatorio');
  reportButton.innerHTML = 'Relatório<small>Mês e cobranças</small>';
  nav.insertBefore(reportButton, productsButton || nav.firstChild);
}

function syncReportActiveTab(root) {
  root.querySelectorAll('[data-clean-tab]').forEach((button) => {
    button.classList.toggle('active', button.getAttribute('data-clean-tab') === 'relatorio');
  });
}

function bindReport(root) {
  root.querySelector('[data-clean-tab="relatorio"]')?.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();
    window.localStorage.setItem('belaGestaoLab.cleanTab', 'relatorio');
    renderPaymentsApp(root);
    enhanceReport(root);
  });

  root.querySelectorAll('[data-report-month]').forEach((button) => button.addEventListener('click', () => {
    const direction = button.getAttribute('data-report-month') === 'next' ? 1 : -1;
    REPORT_STATE.selectedDate = shiftReportMonth(REPORT_STATE.selectedDate, direction);
    renderReportTab(root);
    syncReportActiveTab(root);
    bindReport(root);
  }));
}

function enhanceReport(root) {
  ensureReportTab(root);
  const activeTab = window.localStorage.getItem('belaGestaoLab.cleanTab');
  if (activeTab === 'relatorio') {
    renderReportTab(root);
    syncReportActiveTab(root);
  }
  bindReport(root);
}

export function renderCleanApp(root) {
  renderPaymentsApp(root);
  if (!root) return;
  root.setAttribute('data-bela-version', APP_CONFIG.version);
  enhanceReport(root);
}
