import { logDiagnosticEvent } from './services/diagnosticsService.js';
import { analyzeGestaoBackupText } from './services/gestaoBackupSourceMapService.js';

const PANEL_ID = 'gestao-backup-source-map-panel';

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function renderPanel() {
  return `
    <section id="${PANEL_ID}" class="panel-card gestao-backup-source-map-panel">
      <div class="panel-title-row">
        <div>
          <h2>Backup real do Gestão</h2>
          <p>Analisa JSON manual para descobrir preços, vendas, parcelas e IDs que faltam no LAB.</p>
        </div>
        <span class="safe-pill">Backup</span>
      </div>
      <div class="storage-note">
        Cole o JSON exportado do Gestão. Esta análise é local, não escreve Firebase e não altera catálogo real.
      </div>
      <label class="compact-field full-row">
        <span>JSON de backup</span>
        <textarea data-gestao-backup-json rows="8" placeholder='Cole aqui o conteúdo do arquivo bela-backup-....json'></textarea>
      </label>
      <div class="lab-actions">
        <button class="primary-button full-row" type="button" data-analyze-gestao-backup>Analisar backup do Gestão</button>
      </div>
      <div data-gestao-backup-result>
        <div class="diagnostic-ok">Pronto para analisar o backup manual.</div>
      </div>
    </section>
  `;
}

function findInsertionPoint() {
  return document.querySelector('#index-products-export-panel')
    || document.querySelector('#catalog-source-discovery-panel')
    || document.querySelector('#firebase-readonly-probe-panel')
    || document.querySelector('.dashboard-panel');
}

function renderResult(container, result) {
  if (!container) return;
  if (!result.ok) {
    container.innerHTML = `<div class="diagnostic-warning">${escapeHtml(result.message)} ${escapeHtml(result.error || '')}</div>`;
    return;
  }

  container.innerHTML = `
    <div class="diagnostic-ok">${escapeHtml(result.message)}</div>
    <div class="diagnostic-table">
      <div class="diagnostic-row"><span>Versão do backup</span><strong>${escapeHtml(result.version ?? 'não informado')}</strong></div>
      <div class="diagnostic-row"><span>Exportado em</span><strong>${escapeHtml(result.exportedAt || 'não informado')}</strong></div>
      <div class="diagnostic-row"><span>Preços</span><strong>${escapeHtml(result.counts.prices)}</strong></div>
      <div class="diagnostic-row"><span>IDs vendidos/sold</span><strong>${escapeHtml(result.counts.sold)}</strong></div>
      <div class="diagnostic-row"><span>Produtos com vendas</span><strong>${escapeHtml(result.counts.salesProductIds)}</strong></div>
      <div class="diagnostic-row"><span>Registros de venda</span><strong>${escapeHtml(result.counts.saleRows)}</strong></div>
      <div class="diagnostic-row"><span>Parcelas detectadas</span><strong>${escapeHtml(result.counts.installmentRows)}</strong></div>
      <div class="diagnostic-row"><span>pagMeta</span><strong>${escapeHtml(result.counts.pagMeta)}</strong></div>
      <div class="diagnostic-row"><span>IDs únicos no backup</span><strong>${escapeHtml(result.counts.uniqueBackupProductIds)}</strong></div>
      <div class="diagnostic-row"><span>Produtos LAB</span><strong>${escapeHtml(result.counts.labProducts)}</strong></div>
      <div class="diagnostic-row"><span>Sobreposição com LAB</span><strong>${escapeHtml(result.counts.overlapWithLab)}</strong></div>
      <div class="diagnostic-row"><span>Só no backup</span><strong>${escapeHtml(result.counts.onlyBackup)}</strong></div>
      <div class="diagnostic-row"><span>Só no LAB</span><strong>${escapeHtml(result.counts.onlyLab)}</strong></div>
      <div class="diagnostic-row"><span>Candidatos de catálogo no backup</span><strong>${escapeHtml(result.counts.productCatalogCandidates)}</strong></div>
      <div class="diagnostic-row"><span>Escrita Firebase</span><strong>não</strong></div>
    </div>
    <details class="diagnostic-details" open>
      <summary>Amostras de IDs</summary>
      <div class="diagnostic-table">
        <div class="diagnostic-row"><span>IDs de preço</span><strong>${escapeHtml(result.samples.priceIds.join(', ') || 'nenhum')}</strong></div>
        <div class="diagnostic-row"><span>IDs de venda</span><strong>${escapeHtml(result.samples.salesIds.join(', ') || 'nenhum')}</strong></div>
        <div class="diagnostic-row"><span>Só no backup</span><strong>${escapeHtml(result.samples.onlyBackup.join(', ') || 'nenhum')}</strong></div>
        <div class="diagnostic-row"><span>Só no LAB</span><strong>${escapeHtml(result.samples.onlyLab.join(', ') || 'nenhum')}</strong></div>
      </div>
    </details>
    <details class="diagnostic-details" open>
      <summary>Candidatos de catálogo dentro do backup</summary>
      <div class="diagnostic-table">
        ${result.samples.productCatalogCandidates.length
          ? result.samples.productCatalogCandidates.map((item) => `<div class="diagnostic-row"><span>${escapeHtml(item.path)}<br><small>${escapeHtml(item.type)}</small></span><strong>${escapeHtml(item.count)} item(ns) · ${escapeHtml((item.keys || []).join(', '))}</strong></div>`).join('')
          : '<div class="diagnostic-row"><span>Catálogo completo</span><strong>não encontrado neste backup</strong></div>'}
      </div>
    </details>
    <div class="storage-note">
      <strong>Conclusão do backup:</strong> ${escapeHtml(result.conclusions.sourceConclusion)}<br><br>
      <strong>Sobre sincronização:</strong> ${escapeHtml(result.conclusions.syncFunctionConclusion)}
    </div>
  `;
}

function bindPanel() {
  const panel = document.getElementById(PANEL_ID);
  if (!panel) return;
  const textarea = panel.querySelector('[data-gestao-backup-json]');
  const button = panel.querySelector('[data-analyze-gestao-backup]');
  const resultBox = panel.querySelector('[data-gestao-backup-result]');

  button?.addEventListener('click', () => {
    const rawText = textarea?.value || '';
    if (!rawText.trim()) {
      resultBox.innerHTML = '<div class="diagnostic-warning">Cole o JSON do backup antes de analisar.</div>';
      return;
    }
    resultBox.innerHTML = '<div class="diagnostic-warning">Analisando backup localmente...</div>';
    const result = analyzeGestaoBackupText(rawText);
    renderResult(resultBox, result);
    logDiagnosticEvent(result.ok ? 'info' : 'error', 'gestao.backup.source.map', result.message, {
      ok: result.ok,
      counts: result.counts || {},
      error: result.error || null,
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
