import { logDiagnosticEvent } from './services/diagnosticsService.js';
import { importConfirmedProductsSafelyToLab } from './services/confirmedProductsSafeImportService.js';

const PANEL_ID = 'confirmed-products-safe-import-panel';

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function renderPanel() {
  return `
    <section id="${PANEL_ID}" class="panel-card confirmed-products-safe-import-panel">
      <div class="panel-title-row">
        <div>
          <h2>Importação segura confirmada</h2>
          <p>Junta produtos confiáveis do LAB/Firebase com produtos reais extraídos do catálogo público.</p>
        </div>
        <span class="safe-pill">Seguro</span>
      </div>
      <div class="storage-note">
        Não apaga nada. Não escreve no Firebase. Produtos ficam marcados como confirmado, provável ou duvidoso.
      </div>
      <div class="lab-actions">
        <button class="primary-button full-row" type="button" data-import-confirmed-products>Importar confirmados para LAB</button>
      </div>
      <div data-confirmed-products-result>
        <div class="diagnostic-ok">Pronto para importação segura local.</div>
      </div>
    </section>
  `;
}

function findInsertionPoint() {
  return document.querySelector('#gestao-backup-source-map-panel')
    || document.querySelector('#index-products-export-panel')
    || document.querySelector('#firebase-readonly-probe-panel')
    || document.querySelector('.dashboard-panel');
}

function renderProductList(items) {
  return items.length ? items.map((item) => `${item.firebaseId || item.id}:${item.name}`).join(', ') : 'nenhum';
}

function renderResult(container, result) {
  if (!container) return;
  if (!result.ok) {
    container.innerHTML = `<div class="diagnostic-warning">${escapeHtml(result.message || 'Falha na importação segura.')}</div>`;
    return;
  }
  const counts = result.counts;
  container.innerHTML = `
    <div class="diagnostic-ok">${escapeHtml(result.message)}</div>
    <div class="diagnostic-table">
      <div class="diagnostic-row"><span>Produtos LAB antes</span><strong>${escapeHtml(counts.labBefore)}</strong></div>
      <div class="diagnostic-row"><span>Catálogo extraído</span><strong>${escapeHtml(counts.catalogExtracted)}</strong></div>
      <div class="diagnostic-row"><span>Total no LAB agora</span><strong>${escapeHtml(counts.totalImported)}</strong></div>
      <div class="diagnostic-row"><span>Confirmados</span><strong>${escapeHtml(counts.summary.confirmado || 0)}</strong></div>
      <div class="diagnostic-row"><span>Prováveis</span><strong>${escapeHtml(counts.summary.provavel || 0)}</strong></div>
      <div class="diagnostic-row"><span>Duvidosos</span><strong>${escapeHtml(counts.summary.duvidoso || 0)}</strong></div>
      <div class="diagnostic-row"><span>Com imagem</span><strong>${escapeHtml(counts.summary.withImage || 0)}</strong></div>
      <div class="diagnostic-row"><span>Com preço</span><strong>${escapeHtml(counts.summary.withPrice || 0)}</strong></div>
      <div class="diagnostic-row"><span>Rejeitados</span><strong>${escapeHtml(counts.rejected || 0)}</strong></div>
      <div class="diagnostic-row"><span>Fonte catálogo</span><strong>${escapeHtml(counts.sourceUsed || 'não informado')}</strong></div>
      <div class="diagnostic-row"><span>Escrita Firebase</span><strong>não</strong></div>
    </div>
    <details class="diagnostic-details" open>
      <summary>Amostras por status</summary>
      <div class="diagnostic-table">
        <div class="diagnostic-row"><span>Confirmados</span><strong>${escapeHtml(renderProductList(result.samples.confirmed))}</strong></div>
        <div class="diagnostic-row"><span>Prováveis</span><strong>${escapeHtml(renderProductList(result.samples.probable))}</strong></div>
        <div class="diagnostic-row"><span>Duvidosos</span><strong>${escapeHtml(renderProductList(result.samples.doubtful))}</strong></div>
        <div class="diagnostic-row"><span>Rejeitados</span><strong>${escapeHtml((result.samples.rejected || []).map((item) => `${item.source}:${item.name || item.id}`).join(', ') || 'nenhum')}</strong></div>
      </div>
    </details>
    <div class="storage-note">Próximo passo: comparador Gestão/LAB x Catálogo e plano de desativação segura. Nenhum produto foi apagado.</div>
  `;
}

function bindPanel() {
  const panel = document.getElementById(PANEL_ID);
  if (!panel) return;
  const button = panel.querySelector('[data-import-confirmed-products]');
  const resultBox = panel.querySelector('[data-confirmed-products-result]');

  button?.addEventListener('click', async () => {
    button.disabled = true;
    resultBox.innerHTML = '<div class="diagnostic-warning">Importando produtos confirmados para LAB...</div>';
    try {
      const result = await importConfirmedProductsSafelyToLab();
      renderResult(resultBox, result);
      logDiagnosticEvent(result.ok ? 'info' : 'error', 'confirmed.products.safe.import', result.message, {
        ok: result.ok,
        counts: result.counts || {},
        samples: result.samples || {},
      });
    } catch (error) {
      renderResult(resultBox, { ok: false, message: String(error?.message || error), error });
      logDiagnosticEvent('error', 'confirmed.products.safe.import', 'Erro inesperado na importação segura.', { error: String(error?.message || error) });
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
