import { logDiagnosticEvent } from './services/diagnosticsService.js';
import { buildWifeAccessReadiness } from './services/wifeAccessReadinessService.js';

const PANEL_ID = 'wife-access-readiness-panel';

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function renderPanel() {
  return `
    <section id="${PANEL_ID}" class="panel-card wife-access-readiness-panel">
      <div class="panel-title-row">
        <div>
          <h2>Prontidão de acesso da esposa</h2>
          <p>Checklist para decidir quando o Gestão novo pode ser testado por ela com segurança.</p>
        </div>
        <span class="safe-pill">14C</span>
      </div>
      <div class="storage-note">
        Este bloco não cria login real ainda. Ele separa LAB de produção e mostra o que falta antes do uso real.
      </div>
      <div class="lab-actions">
        <button class="primary-button full-row" type="button" data-build-wife-access-readiness>Verificar prontidão de acesso</button>
      </div>
      <div data-wife-access-result>
        <div class="diagnostic-ok">Pronto para verificar acesso seguro.</div>
      </div>
    </section>
  `;
}

function findInsertionPoint() {
  return document.querySelector('#real-data-consolidator-panel')
    || document.querySelector('#master-source-contracts-panel')
    || document.querySelector('#confirmed-products-safe-import-panel')
    || document.querySelector('.dashboard-panel');
}

function renderChecklist(items) {
  return items.map((item) => `
    <div class="diagnostic-row ${item.ok ? '' : 'danger-row'}">
      <span>${escapeHtml(item.label)}<br><small>${escapeHtml(item.detail)}</small></span>
      <strong>${item.ok ? 'ok' : 'pendente'}</strong>
    </div>
  `).join('');
}

function renderResult(container, result) {
  if (!container) return;
  const statusLabel = result.readiness.status === 'bloqueado'
    ? 'Bloqueado para uso real'
    : result.readiness.status === 'quase_pronto'
      ? 'Quase pronto para teste'
      : 'Pronto para teste controlado';

  container.innerHTML = `
    <div class="${result.readiness.status === 'bloqueado' ? 'diagnostic-warning' : 'diagnostic-ok'}">
      ${escapeHtml(result.message)}
    </div>
    <div class="diagnostic-table">
      <div class="diagnostic-row"><span>Status</span><strong>${escapeHtml(statusLabel)}</strong></div>
      <div class="diagnostic-row"><span>Score</span><strong>${escapeHtml(result.readiness.score)}%</strong></div>
      <div class="diagnostic-row"><span>Críticos OK</span><strong>${escapeHtml(result.readiness.criticalOk)}/${escapeHtml(result.readiness.criticalTotal)}</strong></div>
      <div class="diagnostic-row"><span>Importantes OK</span><strong>${escapeHtml(result.readiness.importantOk)}/${escapeHtml(result.readiness.importantTotal)}</strong></div>
      <div class="diagnostic-row"><span>Produtos LAB</span><strong>${escapeHtml(result.counts.labProducts)}</strong></div>
      <div class="diagnostic-row"><span>Produtos consolidados</span><strong>${escapeHtml(result.counts.consolidatedProducts)}</strong></div>
      <div class="diagnostic-row"><span>Clientes consolidados</span><strong>${escapeHtml(result.counts.consolidatedCustomers)}</strong></div>
      <div class="diagnostic-row"><span>Vendas consolidadas</span><strong>${escapeHtml(result.counts.consolidatedSales)}</strong></div>
      <div class="diagnostic-row"><span>Parcelas consolidadas</span><strong>${escapeHtml(result.counts.consolidatedPayments)}</strong></div>
      <div class="diagnostic-row"><span>Acesso produção</span><strong>não liberado</strong></div>
      <div class="diagnostic-row"><span>Escrita Firebase</span><strong>não</strong></div>
    </div>
    <details class="diagnostic-details" open>
      <summary>Checklist de liberação</summary>
      <div class="diagnostic-table">${renderChecklist(result.checklist)}</div>
    </details>
    <details class="diagnostic-details" open>
      <summary>Próximos blocos</summary>
      <div class="diagnostic-table">
        ${result.nextBlocks.map((item) => `<div class="diagnostic-row"><span>${escapeHtml(item)}</span><strong>pendente</strong></div>`).join('')}
      </div>
    </details>
  `;
}

function bindPanel() {
  const panel = document.getElementById(PANEL_ID);
  if (!panel) return;
  const button = panel.querySelector('[data-build-wife-access-readiness]');
  const resultBox = panel.querySelector('[data-wife-access-result]');

  button?.addEventListener('click', () => {
    resultBox.innerHTML = '<div class="diagnostic-warning">Verificando prontidão de acesso...</div>';
    const result = buildWifeAccessReadiness();
    renderResult(resultBox, result);
    logDiagnosticEvent('info', 'wife.access.readiness', result.message, {
      readiness: result.readiness,
      counts: result.counts,
    });
  });
}

function ensurePanel() {
  if (document.getElementById(PANEL_ID)) return;
  const anchor = findInsertionPoint();
  if (!anchor) return;
  anchor.insertAdjacentHTML('afterend', renderPanel());
  bindPanel();
}

window.addEventListener('DOMContentLoaded', () => {
  ensurePanel();
  const observer = new MutationObserver(() => ensurePanel());
  observer.observe(document.body, { childList: true, subtree: true });
});
