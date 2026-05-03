import { logDiagnosticEvent } from './services/diagnosticsService.js';
import { buildMasterSourceSummary } from './services/masterSourceSummaryService.js';

const PANEL_ID = 'master-source-contracts-panel';

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function renderPanel() {
  return `
    <section id="${PANEL_ID}" class="panel-card master-source-contracts-panel">
      <div class="panel-title-row">
        <div>
          <h2>Gestão como fonte mestre</h2>
          <p>Define os contratos únicos para produto, cliente, venda, parcela e sincronização do catálogo novo.</p>
        </div>
        <span class="safe-pill">14A</span>
      </div>
      <div class="storage-note">
        Este bloco é estrutural. Não faz redesign ainda, não escreve Firebase e não altera o catálogo antigo.
      </div>
      <div class="lab-actions">
        <button class="primary-button full-row" type="button" data-build-master-source-summary>Gerar resumo dos contratos mestre</button>
      </div>
      <div data-master-source-result>
        <div class="diagnostic-ok">Pronto para validar a base mestre do Gestão.</div>
      </div>
    </section>
  `;
}

function findInsertionPoint() {
  return document.querySelector('#confirmed-products-safe-import-panel')
    || document.querySelector('#gestao-backup-source-map-panel')
    || document.querySelector('#index-products-export-panel')
    || document.querySelector('.dashboard-panel');
}

function renderStatusMap(map) {
  const entries = Object.entries(map || {});
  return entries.length ? entries.map(([key, value]) => `${key}: ${value}`).join(' · ') : 'nenhum';
}

function renderProducts(products) {
  return products?.length
    ? products.map((product) => `${product.name} (${product.catalogSyncStatus})`).join(', ')
    : 'nenhum';
}

function renderResult(container, result) {
  if (!container) return;
  if (!result.ok) {
    container.innerHTML = `<div class="diagnostic-warning">${escapeHtml(result.message || 'Falha ao montar contratos.')}</div>`;
    return;
  }

  container.innerHTML = `
    <div class="diagnostic-ok">${escapeHtml(result.message)}</div>
    <div class="diagnostic-table">
      <div class="diagnostic-row"><span>Produtos no contrato mestre</span><strong>${escapeHtml(result.counts.products)}</strong></div>
      <div class="diagnostic-row"><span>Com imagem</span><strong>${escapeHtml(result.counts.withImage)}</strong></div>
      <div class="diagnostic-row"><span>Com preço</span><strong>${escapeHtml(result.counts.withPrice)}</strong></div>
      <div class="diagnostic-row"><span>Prontos para catálogo</span><strong>${escapeHtml(result.counts.readyForCatalog)}</strong></div>
      <div class="diagnostic-row"><span>Precisam revisão</span><strong>${escapeHtml(result.counts.needsReview)}</strong></div>
      <div class="diagnostic-row"><span>Sem foto</span><strong>${escapeHtml(result.counts.missingImage)}</strong></div>
      <div class="diagnostic-row"><span>Ocultos</span><strong>${escapeHtml(result.counts.hidden)}</strong></div>
      <div class="diagnostic-row"><span>Escrita Firebase</span><strong>não</strong></div>
    </div>
    <details class="diagnostic-details" open>
      <summary>Status e origem</summary>
      <div class="diagnostic-table">
        <div class="diagnostic-row"><span>Recuperação</span><strong>${escapeHtml(renderStatusMap(result.byRecovery))}</strong></div>
        <div class="diagnostic-row"><span>Sync catálogo</span><strong>${escapeHtml(renderStatusMap(result.bySync))}</strong></div>
        <div class="diagnostic-row"><span>Origens</span><strong>${escapeHtml(renderStatusMap(result.byOrigin))}</strong></div>
      </div>
    </details>
    <details class="diagnostic-details" open>
      <summary>Amostras</summary>
      <div class="diagnostic-table">
        <div class="diagnostic-row"><span>Prontos</span><strong>${escapeHtml(renderProducts(result.samples.readyForCatalog))}</strong></div>
        <div class="diagnostic-row"><span>Revisão</span><strong>${escapeHtml(renderProducts(result.samples.needsReview))}</strong></div>
        <div class="diagnostic-row"><span>Sem foto</span><strong>${escapeHtml(renderProducts(result.samples.missingImage))}</strong></div>
      </div>
    </details>
    <details class="diagnostic-details">
      <summary>Regras de sincronização</summary>
      <div class="diagnostic-table">
        ${Object.entries(result.explanations).map(([key, value]) => `<div class="diagnostic-row"><span>${escapeHtml(key)}</span><strong>${escapeHtml(value)}</strong></div>`).join('')}
      </div>
    </details>
    <div class="storage-note">Identidade visual definitiva ficou registrada para o BLOCO 14E. Agora a base mestre está pronta para o consolidador real.</div>
  `;
}

function bindPanel() {
  const panel = document.getElementById(PANEL_ID);
  if (!panel) return;
  const button = panel.querySelector('[data-build-master-source-summary]');
  const resultBox = panel.querySelector('[data-master-source-result]');

  button?.addEventListener('click', () => {
    resultBox.innerHTML = '<div class="diagnostic-warning">Montando contratos mestre...</div>';
    const result = buildMasterSourceSummary();
    renderResult(resultBox, result);
    logDiagnosticEvent(result.ok ? 'info' : 'error', 'master.source.contracts', result.message, {
      ok: result.ok,
      counts: result.counts || {},
      byRecovery: result.byRecovery || {},
      bySync: result.bySync || {},
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
