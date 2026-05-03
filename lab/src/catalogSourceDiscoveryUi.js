import { logDiagnosticEvent } from './services/diagnosticsService.js';
import { discoverCatalogRealSource } from './services/catalogSourceDiscoveryService.js';

const PANEL_ID = 'catalog-source-discovery-panel';

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function renderPanel() {
  return `
    <section id="${PANEL_ID}" class="panel-card catalog-source-discovery-panel">
      <div class="panel-title-row">
        <div>
          <h2>Descobrir fonte real do catálogo</h2>
          <p>Procura onde estão os +100 produtos: HTML, scripts, localStorage, JSON ou hints Firebase.</p>
        </div>
        <span class="safe-pill">Source</span>
      </div>
      <div class="storage-note">
        Esta análise só lê arquivos e textos. Não altera o catálogo principal, não escreve Firebase e não mexe na main.
      </div>
      <div class="lab-actions">
        <button class="primary-button full-row" type="button" data-discover-catalog-source>Descobrir fonte dos +100 produtos</button>
      </div>
      <div data-catalog-source-result>
        <div class="diagnostic-ok">Pronto para analisar fontes possíveis do catálogo.</div>
      </div>
    </section>
  `;
}

function findInsertionPoint() {
  return document.querySelector('#firebase-orphan-resolution-panel')
    || document.querySelector('#firebase-unified-smart-import-panel')
    || document.querySelector('#firebase-readonly-probe-panel')
    || document.querySelector('.dashboard-panel');
}

function renderResult(container, result) {
  if (!container) return;
  if (!result.ok) {
    container.innerHTML = `<div class="diagnostic-warning">Não foi possível analisar nenhuma fonte. Veja detalhes no Diagnóstico LAB.</div>`;
    return;
  }

  const best = result.best;
  const likelySources = result.likelySources || [];
  const hints = result.hints || {};

  container.innerHTML = `
    <div class="diagnostic-ok">${escapeHtml(result.message)}</div>
    <div class="diagnostic-table">
      <div class="diagnostic-row"><span>Melhor candidato</span><strong>${escapeHtml(best?.label || 'nenhum')}</strong></div>
      <div class="diagnostic-row"><span>Score</span><strong>${escapeHtml(best?.score ?? 0)}</strong></div>
      <div class="diagnostic-row"><span>Objetos produto fortes</span><strong>${escapeHtml(best?.productEstimate?.strongProductLikeObjects ?? 0)}</strong></div>
      <div class="diagnostic-row"><span>Objetos produto possíveis</span><strong>${escapeHtml(best?.productEstimate?.productLikeObjects ?? 0)}</strong></div>
      <div class="diagnostic-row"><span>Scripts analisados</span><strong>${escapeHtml(result.analyzed.filter((item) => String(item.label || '').startsWith('script')).length)}</strong></div>
      <div class="diagnostic-row"><span>Escrita Firebase</span><strong>não</strong></div>
    </div>

    <details class="diagnostic-details" open>
      <summary>Fontes prováveis</summary>
      <div class="diagnostic-table">
        ${likelySources.length ? likelySources.map((item) => `<div class="diagnostic-row"><span>${escapeHtml(item.label)}<br><small>${escapeHtml(item.url)}</small></span><strong>score ${escapeHtml(item.score)} · produtos fortes ${escapeHtml(item.productEstimate?.strongProductLikeObjects || 0)}</strong></div>`).join('') : '<div class="diagnostic-row"><span>Fontes prováveis</span><strong>nenhuma fonte forte detectada</strong></div>'}
      </div>
    </details>

    <details class="diagnostic-details" open>
      <summary>Hints encontrados</summary>
      <div class="diagnostic-table">
        <div class="diagnostic-row"><span>localStorage</span><strong>${escapeHtml((hints.localStorageKeys || []).slice(0, 30).join(', ') || 'nenhum')}</strong></div>
        <div class="diagnostic-row"><span>Firebase paths</span><strong>${escapeHtml((hints.firebasePathHints || []).slice(0, 30).join(', ') || 'nenhum')}</strong></div>
        <div class="diagnostic-row"><span>Arrays candidatos</span><strong>${escapeHtml((hints.arrayHints || []).slice(0, 30).join(', ') || 'nenhum')}</strong></div>
        <div class="diagnostic-row"><span>Objetos candidatos</span><strong>${escapeHtml((hints.objectHints || []).slice(0, 30).join(', ') || 'nenhum')}</strong></div>
      </div>
    </details>

    <details class="diagnostic-details">
      <summary>Todos os arquivos analisados</summary>
      <div class="diagnostic-table">
        ${result.analyzed.map((item) => item.ok
          ? `<div class="diagnostic-row"><span>${escapeHtml(item.label)}<br><small>${escapeHtml(item.url)}</small></span><strong>score ${escapeHtml(item.score)} · bytes ${escapeHtml(item.bytes)} · produto forte ${escapeHtml(item.productEstimate?.strongProductLikeObjects || 0)}</strong></div>`
          : `<div class="diagnostic-row danger-row"><span>${escapeHtml(item.label)}<br><small>${escapeHtml(item.url)}</small></span><strong>${escapeHtml(item.error)}</strong></div>`
        ).join('')}
      </div>
    </details>

    <div class="storage-note"><strong>Conclusão:</strong> ${escapeHtml(result.conclusion)}</div>
  `;
}

function bindPanel() {
  const panel = document.getElementById(PANEL_ID);
  if (!panel) return;
  const button = panel.querySelector('[data-discover-catalog-source]');
  const resultBox = panel.querySelector('[data-catalog-source-result]');

  button?.addEventListener('click', async () => {
    button.disabled = true;
    resultBox.innerHTML = '<div class="diagnostic-warning">Analisando possíveis fontes do catálogo...</div>';
    try {
      const result = await discoverCatalogRealSource();
      renderResult(resultBox, result);
      logDiagnosticEvent(result.ok ? 'info' : 'error', 'catalog.source.discovery', result.message, {
        ok: result.ok,
        best: result.best || null,
        hints: result.hints || {},
      });
    } catch (error) {
      renderResult(resultBox, { ok: false, message: String(error?.message || error), error });
      logDiagnosticEvent('error', 'catalog.source.discovery', 'Erro inesperado na descoberta da fonte do catálogo.', { error: String(error?.message || error) });
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
