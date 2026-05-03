import { logDiagnosticEvent } from './services/diagnosticsService.js';
import {
  exportFullLabBackup,
  inspectFullLabBackupText,
  restoreFullLabBackupText,
} from './services/fullBackupRestoreService.js';

const PANEL_ID = 'full-backup-restore-panel';

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function renderPanel() {
  return `
    <section id="${PANEL_ID}" class="panel-card full-backup-restore-panel">
      <div class="panel-title-row">
        <div>
          <h2>Backup e restore completo</h2>
          <p>Exporta e restaura todos os dados consolidados do novo Gestão no LAB.</p>
        </div>
        <span class="safe-pill">14D</span>
      </div>
      <div class="storage-note">
        Backup local do LAB: produtos, clientes, vendas, parcelas, metadados e contratos. Não escreve Firebase.
      </div>
      <div class="lab-actions">
        <button class="primary-button full-row" type="button" data-export-full-backup>Exportar backup completo</button>
      </div>
      <label class="compact-field full-row">
        <span>JSON para inspeção/restauração</span>
        <textarea data-full-backup-json rows="8" placeholder='Cole aqui um backup completo do novo Gestão'></textarea>
      </label>
      <div class="lab-actions two-columns">
        <button class="secondary-button" type="button" data-inspect-full-backup>Inspecionar backup</button>
        <button class="danger-button" type="button" data-restore-full-backup>Restaurar no LAB</button>
      </div>
      <div data-full-backup-result>
        <div class="diagnostic-ok">Pronto para exportar ou validar backup completo.</div>
      </div>
    </section>
  `;
}

function findInsertionPoint() {
  return document.querySelector('#wife-access-readiness-panel')
    || document.querySelector('#real-data-consolidator-panel')
    || document.querySelector('#master-source-contracts-panel')
    || document.querySelector('.dashboard-panel');
}

function renderCounts(counts = {}) {
  return `
    <div class="diagnostic-table">
      <div class="diagnostic-row"><span>Produtos LAB</span><strong>${escapeHtml(counts.labProducts || 0)}</strong></div>
      <div class="diagnostic-row"><span>Produtos consolidados</span><strong>${escapeHtml(counts.consolidatedProducts || 0)}</strong></div>
      <div class="diagnostic-row"><span>Clientes consolidados</span><strong>${escapeHtml(counts.consolidatedCustomers || 0)}</strong></div>
      <div class="diagnostic-row"><span>Vendas consolidadas</span><strong>${escapeHtml(counts.consolidatedSales || 0)}</strong></div>
      <div class="diagnostic-row"><span>Parcelas/pagamentos</span><strong>${escapeHtml(counts.consolidatedPayments || 0)}</strong></div>
      <div class="diagnostic-row"><span>Escrita Firebase</span><strong>não</strong></div>
    </div>
  `;
}

function renderResult(container, result) {
  if (!container) return;
  const okClass = result.ok ? 'diagnostic-ok' : 'diagnostic-warning';
  container.innerHTML = `
    <div class="${okClass}">${escapeHtml(result.message)}</div>
    ${result.filename ? `<div class="diagnostic-table"><div class="diagnostic-row"><span>Arquivo</span><strong>${escapeHtml(result.filename)}</strong></div><div class="diagnostic-row"><span>Schema</span><strong>${escapeHtml(result.schema || '')} v${escapeHtml(result.schemaVersion || '')}</strong></div><div class="diagnostic-row"><span>Exportado em</span><strong>${escapeHtml(result.exportedAt || '')}</strong></div></div>` : ''}
    ${renderCounts(result.counts)}
    ${result.errors?.length ? `<details class="diagnostic-details" open><summary>Erros</summary><div class="diagnostic-table">${result.errors.map((error) => `<div class="diagnostic-row danger-row"><span>${escapeHtml(error)}</span><strong>erro</strong></div>`).join('')}</div></details>` : ''}
    ${result.restored ? '<div class="storage-note">Restauração feita apenas no LAB/localStorage. Recarregue a página se quiser validar todos os painéis com os dados restaurados.</div>' : ''}
  `;
}

function bindPanel() {
  const panel = document.getElementById(PANEL_ID);
  if (!panel) return;
  const textarea = panel.querySelector('[data-full-backup-json]');
  const resultBox = panel.querySelector('[data-full-backup-result]');

  panel.querySelector('[data-export-full-backup]')?.addEventListener('click', () => {
    const result = exportFullLabBackup();
    renderResult(resultBox, result);
    logDiagnosticEvent('info', 'full.backup.export', result.message, { counts: result.counts, filename: result.filename });
  });

  panel.querySelector('[data-inspect-full-backup]')?.addEventListener('click', () => {
    const result = inspectFullLabBackupText(textarea?.value || '');
    renderResult(resultBox, result);
    logDiagnosticEvent(result.ok ? 'info' : 'error', 'full.backup.inspect', result.message, { counts: result.counts || {}, errors: result.errors || [] });
  });

  panel.querySelector('[data-restore-full-backup]')?.addEventListener('click', () => {
    const result = restoreFullLabBackupText(textarea?.value || '');
    renderResult(resultBox, result);
    logDiagnosticEvent(result.ok ? 'info' : 'error', 'full.backup.restore', result.message, { counts: result.counts || {}, errors: result.errors || [] });
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
