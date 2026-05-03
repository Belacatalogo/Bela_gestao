import { logDiagnosticEvent } from './services/diagnosticsService.js';
import { importFirebaseUnifiedSmartToLab } from './services/firebaseUnifiedSmartImportService.js';
import { getFirebaseReadonlyProbeReadiness } from './services/firebaseReadonlyProbeService.js';

const PANEL_ID = 'firebase-unified-smart-import-panel';

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function renderPanel() {
  const readiness = getFirebaseReadonlyProbeReadiness();
  return `
    <section id="${PANEL_ID}" class="panel-card firebase-unified-import-panel">
      <div class="panel-title-row">
        <div>
          <h2>Importação Inteligente Unificada</h2>
          <p>Une produtos_custom com possíveis produtos extras dos backups. Salva somente no LAB/localStorage.</p>
        </div>
        <span class="safe-pill">LAB</span>
      </div>

      <div class="mini-grid four-stats">
        <div class="mini-stat"><strong>${readiness.ready ? 'sim' : 'não'}</strong><span>pronto</span></div>
        <div class="mini-stat"><strong>${readiness.hasConfig ? 'sim' : 'não'}</strong><span>config</span></div>
        <div class="mini-stat"><strong>${readiness.hasDatabaseUrl ? 'sim' : 'não'}</strong><span>databaseURL</span></div>
        <div class="mini-stat"><strong>não</strong><span>escrita firebase</span></div>
      </div>

      <div class="storage-note">
        Prioridade: produtos_custom → backup/ultimo → backup/diario → carrossel apenas como alerta.<br>
        Preço: product.price primeiro; /precos como fallback; sem preço fica marcado no diagnóstico.
      </div>

      <div class="lab-actions">
        <button class="primary-button full-row" type="button" data-run-unified-smart-import ${readiness.ready ? '' : 'disabled'}>Importar unificado para LAB</button>
      </div>

      <div data-unified-smart-import-result>
        ${readiness.ready ? '<div class="diagnostic-ok">Pronto para importação unificada local. Nenhuma escrita será feita no Firebase.</div>' : `<div class="diagnostic-warning">Ainda não pronto: ${escapeHtml(readiness.note)}</div>`}
      </div>
    </section>
  `;
}

function findInsertionPoint() {
  return document.querySelector('#firebase-readonly-probe-panel') || document.querySelector('.firebase-config-panel') || document.querySelector('.dashboard-panel');
}

function renderResult(container, result) {
  if (!container) return;

  if (!result.ok) {
    const error = result.error ? `${result.error.code || result.error.name}: ${result.error.message}` : result.message;
    container.innerHTML = `<div class="diagnostic-warning">${escapeHtml(error)}</div><div class="storage-note">Nenhuma escrita foi feita no Firebase e o catálogo real não foi alterado.</div>`;
    return;
  }

  container.innerHTML = `
    <div class="diagnostic-ok">${escapeHtml(result.message)}</div>
    <div class="diagnostic-table">
      <div class="diagnostic-row"><span>Base produtos_custom</span><strong>${escapeHtml(result.counts.baseProdutosCustom)}</strong></div>
      <div class="diagnostic-row"><span>Adicionados do backup</span><strong>${escapeHtml(result.counts.addedFromBackup)}</strong></div>
      <div class="diagnostic-row"><span>Total importado no LAB</span><strong>${escapeHtml(result.counts.totalImported)}</strong></div>
      <div class="diagnostic-row"><span>Com preço</span><strong>${escapeHtml(result.counts.withPrice)}</strong></div>
      <div class="diagnostic-row"><span>Sem preço</span><strong>${escapeHtml(result.counts.missingPrice)}</strong></div>
      <div class="diagnostic-row"><span>Com imagem/foto</span><strong>${escapeHtml(result.counts.withImage)}</strong></div>
      <div class="diagnostic-row"><span>Carrossel ainda ausente</span><strong>${escapeHtml(result.counts.carouselStillMissing)}</strong></div>
      <div class="diagnostic-row"><span>Preços órfãos restantes</span><strong>${escapeHtml(result.counts.orphanPrices)}</strong></div>
      <div class="diagnostic-row"><span>Escrita Firebase</span><strong>não</strong></div>
    </div>
    <details class="diagnostic-details" open>
      <summary>Amostras da importação</summary>
      <div class="diagnostic-table">
        <div class="diagnostic-row"><span>Extras do backup</span><strong>${escapeHtml(result.samples.addedFromBackup.join(', ') || 'nenhum')}</strong></div>
        <div class="diagnostic-row"><span>Carrossel ainda sem produto</span><strong>${escapeHtml(result.samples.carouselStillMissing.join(', ') || 'nenhum')}</strong></div>
        <div class="diagnostic-row"><span>Preços órfãos</span><strong>${escapeHtml(result.samples.orphanPrices.join(', ') || 'nenhum')}</strong></div>
      </div>
    </details>
    <details class="diagnostic-details" open>
      <summary>Produtos importados</summary>
      <div class="diagnostic-table">
        ${result.samples.imported.map((product) => `<div class="diagnostic-row"><span>${escapeHtml(product.name)}<br><small>ID: ${escapeHtml(product.firebaseId)} · ${escapeHtml(product.importSource)} · preço: ${escapeHtml(product.price)} · ${escapeHtml(product.priceSource)}</small></span><strong>${escapeHtml(product.category)}</strong></div>`).join('')}
      </div>
    </details>
    <div class="storage-note"><strong>Conclusão:</strong> ${escapeHtml(result.conclusion)}<br>Role até Produtos LAB para ver o resultado. O Firebase real não foi alterado.</div>
  `;
}

function bindPanel() {
  const panel = document.getElementById(PANEL_ID);
  if (!panel) return;
  const button = panel.querySelector('[data-run-unified-smart-import]');
  const resultBox = panel.querySelector('[data-unified-smart-import-result]');

  button?.addEventListener('click', async () => {
    button.disabled = true;
    resultBox.innerHTML = '<div class="diagnostic-warning">Executando importação inteligente unificada...</div>';
    try {
      const result = await importFirebaseUnifiedSmartToLab();
      renderResult(resultBox, result);
      logDiagnosticEvent(result.ok ? 'info' : 'error', 'firebase.unified.smart.import', result.message, {
        ok: result.ok,
        counts: result.counts || {},
        samples: result.samples || {},
        error: result.error || null,
      });
    } catch (error) {
      renderResult(resultBox, { ok: false, message: String(error?.message || error), error });
      logDiagnosticEvent('error', 'firebase.unified.smart.import', 'Erro inesperado na importação inteligente unificada.', { error: String(error?.message || error) });
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
