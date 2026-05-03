import { logDiagnosticEvent } from './services/diagnosticsService.js';
import { resolveFirebaseOrphansToLab } from './services/firebaseOrphanResolutionService.js';
import { getFirebaseReadonlyProbeReadiness } from './services/firebaseReadonlyProbeService.js';

const PANEL_ID = 'firebase-orphan-resolution-panel';

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
    <section id="${PANEL_ID}" class="panel-card firebase-orphan-resolution-panel">
      <div class="panel-title-row">
        <div>
          <h2>Resolução de Órfãos</h2>
          <p>Investiga IDs do carrossel e preços órfãos, tentando recuperar produtos apenas no LAB.</p>
        </div>
        <span class="safe-pill">Órfãos</span>
      </div>
      <div class="storage-note">
        Usa backups como fonte de confirmação. Só cria produto se houver dados suficientes. Firebase real continua intocado.
      </div>
      <div class="lab-actions">
        <button class="primary-button full-row" type="button" data-resolve-firebase-orphans ${readiness.ready ? '' : 'disabled'}>Resolver órfãos no LAB</button>
      </div>
      <div data-orphan-resolution-result>
        ${readiness.ready ? '<div class="diagnostic-ok">Pronto para investigar órfãos sem escrita Firebase.</div>' : `<div class="diagnostic-warning">Ainda não pronto: ${escapeHtml(readiness.note)}</div>`}
      </div>
    </section>
  `;
}

function findInsertionPoint() {
  return document.querySelector('#firebase-unified-smart-import-panel') || document.querySelector('#firebase-readonly-probe-panel') || document.querySelector('.dashboard-panel');
}

function renderResult(container, result) {
  if (!container) return;
  if (!result.ok) {
    const error = result.error ? `${result.error.code || result.error.name}: ${result.error.message}` : result.message;
    container.innerHTML = `<div class="diagnostic-warning">${escapeHtml(error)}</div><div class="storage-note">Nenhuma escrita foi feita no Firebase.</div>`;
    return;
  }

  container.innerHTML = `
    <div class="diagnostic-ok">${escapeHtml(result.message)}</div>
    <div class="diagnostic-table">
      <div class="diagnostic-row"><span>Produtos LAB antes</span><strong>${escapeHtml(result.counts.labBefore)}</strong></div>
      <div class="diagnostic-row"><span>Órfãos recuperados</span><strong>${escapeHtml(result.counts.recovered)}</strong></div>
      <div class="diagnostic-row"><span>Produtos LAB depois</span><strong>${escapeHtml(result.counts.labAfter)}</strong></div>
      <div class="diagnostic-row"><span>Carrossel ausente antes</span><strong>${escapeHtml(result.counts.carouselMissingBefore)}</strong></div>
      <div class="diagnostic-row"><span>Carrossel sem resolver</span><strong>${escapeHtml(result.counts.carouselUnresolvedAfter)}</strong></div>
      <div class="diagnostic-row"><span>Preços órfãos antes</span><strong>${escapeHtml(result.counts.orphanPricesBefore)}</strong></div>
      <div class="diagnostic-row"><span>Preços órfãos sem resolver</span><strong>${escapeHtml(result.counts.orphanPricesUnresolvedAfter)}</strong></div>
      <div class="diagnostic-row"><span>Candidatos no backup</span><strong>${escapeHtml(result.counts.backupCandidates)}</strong></div>
      <div class="diagnostic-row"><span>Escrita Firebase</span><strong>não</strong></div>
    </div>
    <details class="diagnostic-details" open>
      <summary>Amostras</summary>
      <div class="diagnostic-table">
        <div class="diagnostic-row"><span>Recuperados</span><strong>${escapeHtml(result.samples.recovered.map((item) => `${item.firebaseId}:${item.name}`).join(', ') || 'nenhum')}</strong></div>
        <div class="diagnostic-row"><span>Carrossel ainda sem produto</span><strong>${escapeHtml(result.samples.unresolvedCarousel.join(', ') || 'nenhum')}</strong></div>
        <div class="diagnostic-row"><span>Preços órfãos ainda sem produto</span><strong>${escapeHtml(result.samples.unresolvedPrices.join(', ') || 'nenhum')}</strong></div>
      </div>
    </details>
    <div class="storage-note"><strong>Conclusão:</strong> ${escapeHtml(result.conclusion)}<br>Role até Produtos LAB para conferir o resultado local.</div>
  `;
}

function bindPanel() {
  const panel = document.getElementById(PANEL_ID);
  if (!panel) return;
  const button = panel.querySelector('[data-resolve-firebase-orphans]');
  const resultBox = panel.querySelector('[data-orphan-resolution-result]');

  button?.addEventListener('click', async () => {
    button.disabled = true;
    resultBox.innerHTML = '<div class="diagnostic-warning">Resolvendo órfãos em modo LAB...</div>';
    try {
      const result = await resolveFirebaseOrphansToLab();
      renderResult(resultBox, result);
      logDiagnosticEvent(result.ok ? 'info' : 'error', 'firebase.orphan.resolution', result.message, {
        ok: result.ok,
        counts: result.counts || {},
        samples: result.samples || {},
        error: result.error || null,
      });
    } catch (error) {
      renderResult(resultBox, { ok: false, message: String(error?.message || error), error });
      logDiagnosticEvent('error', 'firebase.orphan.resolution', 'Erro inesperado na resolução de órfãos.', { error: String(error?.message || error) });
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
