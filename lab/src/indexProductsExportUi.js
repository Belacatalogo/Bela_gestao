import { logDiagnosticEvent } from './services/diagnosticsService.js';
import { exportIndexEmbeddedProductsJson } from './services/indexProductsExportService.js';

const PANEL_ID = 'index-products-export-panel';

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function renderPanel() {
  return `
    <section id="${PANEL_ID}" class="panel-card index-products-export-panel">
      <div class="panel-title-row">
        <div>
          <h2>Exportar produtos do index.html</h2>
          <p>Extrai candidatos de produtos embutidos no HTML/JS principal e baixa JSON local.</p>
        </div>
        <span class="safe-pill">JSON</span>
      </div>
      <div class="storage-note">
        Exportação diagnóstica. Não altera catálogo real, não escreve Firebase e não importa automaticamente para o LAB.
      </div>
      <div class="lab-actions">
        <button class="primary-button full-row" type="button" data-export-index-products>Exportar produtos do index em JSON</button>
      </div>
      <div data-index-products-export-result>
        <div class="diagnostic-ok">Pronto para exportar produtos embutidos do index.html.</div>
      </div>
    </section>
  `;
}

function findInsertionPoint() {
  return document.querySelector('#catalog-source-discovery-panel')
    || document.querySelector('#firebase-orphan-resolution-panel')
    || document.querySelector('#firebase-readonly-probe-panel')
    || document.querySelector('.dashboard-panel');
}

function renderResult(container, result) {
  if (!container) return;
  if (!result.ok) {
    container.innerHTML = `<div class="diagnostic-warning">${escapeHtml(result.message)}</div>`;
    return;
  }

  container.innerHTML = `
    <div class="diagnostic-ok">${escapeHtml(result.message)}</div>
    <div class="diagnostic-table">
      <div class="diagnostic-row"><span>Arquivo baixado</span><strong>${escapeHtml(result.filename)}</strong></div>
      <div class="diagnostic-row"><span>Fonte usada</span><strong>${escapeHtml(result.best.label)}</strong></div>
      <div class="diagnostic-row"><span>Produtos extraídos</span><strong>${escapeHtml(result.best.productCount)}</strong></div>
      <div class="diagnostic-row"><span>Objetos candidatos lidos</span><strong>${escapeHtml(result.best.chunks)}</strong></div>
      <div class="diagnostic-row"><span>Produtos LAB atuais</span><strong>${escapeHtml(result.comparison.labCount)}</strong></div>
      <div class="diagnostic-row"><span>Sobreposição com LAB</span><strong>${escapeHtml(result.comparison.overlap)}</strong></div>
      <div class="diagnostic-row"><span>Só no index</span><strong>${escapeHtml(result.comparison.indexOnlyCount)}</strong></div>
      <div class="diagnostic-row"><span>Só no LAB</span><strong>${escapeHtml(result.comparison.labOnlyCount)}</strong></div>
      <div class="diagnostic-row"><span>Escrita Firebase</span><strong>não</strong></div>
    </div>
    <details class="diagnostic-details" open>
      <summary>Amostra extraída</summary>
      <div class="diagnostic-table">
        ${result.best.sample.map((product) => `<div class="diagnostic-row"><span>${escapeHtml(product.name)}<br><small>ID: ${escapeHtml(product.id)} · preço: ${escapeHtml(product.price)} · score: ${escapeHtml(product.extraction.score)}</small></span><strong>${escapeHtml(product.category || product.brand || 'sem categoria')}</strong></div>`).join('')}
      </div>
    </details>
    <details class="diagnostic-details">
      <summary>Tentativas de fonte</summary>
      <div class="diagnostic-table">
        ${result.attempts.map((attempt) => `<div class="diagnostic-row"><span>${escapeHtml(attempt.label)}<br><small>${escapeHtml(attempt.url)}</small></span><strong>${attempt.ok ? `${escapeHtml(attempt.productCount)} produto(s)` : escapeHtml(attempt.error)}</strong></div>`).join('')}
      </div>
    </details>
    <div class="storage-note">Guarde o JSON. O próximo bloco pode importar index + Firebase para o LAB de forma unificada.</div>
  `;
}

function bindPanel() {
  const panel = document.getElementById(PANEL_ID);
  if (!panel) return;
  const button = panel.querySelector('[data-export-index-products]');
  const resultBox = panel.querySelector('[data-index-products-export-result]');

  button?.addEventListener('click', async () => {
    button.disabled = true;
    resultBox.innerHTML = '<div class="diagnostic-warning">Extraindo produtos embutidos do index.html...</div>';
    try {
      const result = await exportIndexEmbeddedProductsJson();
      renderResult(resultBox, result);
      logDiagnosticEvent(result.ok ? 'info' : 'error', 'index.products.export', result.message, {
        ok: result.ok,
        filename: result.filename || '',
        productCount: result.best?.productCount || 0,
        comparison: result.comparison || {},
      });
    } catch (error) {
      renderResult(resultBox, { ok: false, message: String(error?.message || error), error });
      logDiagnosticEvent('error', 'index.products.export', 'Erro inesperado ao exportar produtos do index.', { error: String(error?.message || error) });
    } finally {
      button.disabled = false;
    }
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
