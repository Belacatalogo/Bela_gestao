import { renderCleanApp as renderBackupCompareApp } from './cleanAppBackupCompare.js';
import { APP_CONFIG } from './config/appConfig.js';
import { exportRtdbSnapshotJson } from './services/rtdbSnapshotExportService.js';

let rtdbExportObserver = null;
let rtdbExportInstalled = false;

function esc(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function renderResult(result) {
  if (!result) return '';
  if (!result.ok) {
    return `<div class="real-preview-card error"><h4>Exportação RTDB</h4><p>${esc(result.message || 'Não foi possível exportar o RTDB.')}</p></div>`;
  }

  const summary = result.summary || {};
  return `
    <div class="real-preview-card">
      <h4>Snapshot RTDB exportado</h4>
      <p>${esc(result.message)}</p>
      <div class="real-preview-grid">
        <article><strong>${summary.products || 0}</strong><span>Produtos</span></article>
        <article><strong>${summary.sales || 0}</strong><span>Vendas</span></article>
        <article><strong>${summary.clients || summary.derivedClients || 0}</strong><span>Clientes</span></article>
        <article><strong>${summary.payments || 0}</strong><span>Pagamentos</span></article>
      </div>
      <div class="real-login-note">
        Arquivo: <strong>${esc(result.filename)}</strong><br>
        Fonte: <code>rtdb:/</code><br>
        Escrita Firebase: <strong>não</strong><br>
        Importação LAB: <strong>não</strong>
      </div>
      ${summary.clientSamples?.length ? `
        <details class="real-path-details">
          <summary>Amostra de clientes detectadas</summary>
          ${summary.clientSamples.map((name) => `<div class="real-path-row ok"><strong>${esc(name)}</strong><small>detectada dentro de vendas/pagamentos</small></div>`).join('')}
        </details>
      ` : ''}
    </div>
  `;
}

function renderPanel() {
  return `
    <section class="legacy-settings-section rtdb-export-section" data-rtdb-export-panel>
      <h3>Backup local dos dados reais</h3>
      <div class="legacy-settings-card google-login-card signed">
        <h4>⬇ Exportar RTDB encontrado</h4>
        <p>Baixa uma cópia JSON local da fonte real encontrada em <code>rtdb:/</code>. Não importa nada para a LAB e não escreve nada no Firebase.</p>
        <div class="legacy-settings-actions google-actions">
          <button class="primary-button" type="button" data-export-rtdb-snapshot>Exportar RTDB como JSON</button>
        </div>
        <div class="real-login-note" data-rtdb-export-note>
          Use este botão depois que a descoberta confirmar os dados reais. O arquivo fica salvo no aparelho pelo navegador.
        </div>
        <div data-rtdb-export-result></div>
      </div>
    </section>
  `;
}

function findInsertionAnchor(root) {
  return root.querySelector('.real-login-section') || root.querySelector('[data-auto-backup-discovery-card]')?.closest('.legacy-settings-section');
}

function bindPanel(root) {
  const button = root.querySelector('[data-export-rtdb-snapshot]');
  const note = root.querySelector('[data-rtdb-export-note]');
  const resultBox = root.querySelector('[data-rtdb-export-result]');
  if (!button || button.dataset.bound === 'true') return;
  button.dataset.bound = 'true';
  button.addEventListener('click', async () => {
    button.disabled = true;
    if (note) note.textContent = 'Exportando snapshot RTDB em modo somente leitura...';
    if (resultBox) resultBox.innerHTML = '';
    const result = await exportRtdbSnapshotJson();
    if (resultBox) resultBox.innerHTML = renderResult(result);
    if (note) note.textContent = result.ok
      ? 'Exportação concluída. Confira o arquivo baixado pelo navegador.'
      : 'Exportação não concluída. Veja o erro abaixo.';
    button.disabled = false;
  });
}

function enhanceRtdbExport(root) {
  if (!root) return false;
  const settingsPage = root.querySelector('.legacy-settings-page');
  if (!settingsPage) return false;
  if (!settingsPage.querySelector('[data-rtdb-export-panel]')) {
    const anchor = findInsertionAnchor(root);
    if (anchor) anchor.insertAdjacentHTML('afterend', renderPanel());
  }
  bindPanel(root);
  return true;
}

function scheduleEnhance(root) {
  window.setTimeout(() => enhanceRtdbExport(root), 0);
  window.setTimeout(() => enhanceRtdbExport(root), 150);
  window.setTimeout(() => enhanceRtdbExport(root), 500);
}

function installRtdbExportAutoMount(root) {
  if (!root || rtdbExportInstalled) return;
  rtdbExportInstalled = true;

  root.addEventListener('click', (event) => {
    if (event.target?.closest?.('[data-clean-tab="ajustes"]')) scheduleEnhance(root);
  }, true);

  if ('MutationObserver' in window) {
    rtdbExportObserver?.disconnect?.();
    rtdbExportObserver = new MutationObserver(() => {
      if (root.querySelector('.legacy-settings-page') && !root.querySelector('[data-rtdb-export-panel]')) scheduleEnhance(root);
    });
    rtdbExportObserver.observe(root, { childList: true, subtree: true });
  }
}

export function renderCleanApp(root) {
  renderBackupCompareApp(root);
  if (!root) return;
  root.setAttribute('data-bela-version', APP_CONFIG.version);
  installRtdbExportAutoMount(root);
  scheduleEnhance(root);
}
