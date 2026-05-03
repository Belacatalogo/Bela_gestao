import { logDiagnosticEvent } from './services/diagnosticsService.js';
import {
  disableWifeTestAccess,
  enableWifeTestAccess,
  getWifeControlledAccessStatus,
} from './services/wifeControlledAccessService.js';

const PANEL_ID = 'wife-controlled-access-panel';

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function renderPanel() {
  return `
    <section id="${PANEL_ID}" class="panel-card wife-controlled-access-panel">
      <div class="panel-title-row">
        <div>
          <h2>Acesso controlado da esposa</h2>
          <p>Libera apenas teste LAB, mantendo produção, Firebase e catálogo antigo bloqueados.</p>
        </div>
        <span class="safe-pill">14F</span>
      </div>
      <div class="storage-note">
        Este painel não cria conta de produção. Ele apenas marca este navegador LAB como pronto para teste controlado.
      </div>
      <label class="compact-field full-row">
        <span>Nome exibido</span>
        <input data-wife-access-name value="Yasmin" placeholder="Nome da usuária" />
      </label>
      <label class="compact-field full-row">
        <span>Observação opcional</span>
        <input data-wife-access-note placeholder="Ex: teste no celular da Yasmin" />
      </label>
      <div class="lab-actions two-columns">
        <button class="primary-button" type="button" data-enable-wife-access>Liberar teste LAB</button>
        <button class="danger-button" type="button" data-disable-wife-access>Bloquear teste LAB</button>
      </div>
      <div class="lab-actions">
        <button class="secondary-button full-row" type="button" data-check-wife-access>Status do acesso</button>
      </div>
      <div data-wife-controlled-access-result>
        <div class="diagnostic-ok">Pronto para verificar acesso controlado.</div>
      </div>
    </section>
  `;
}

function findInsertionPoint() {
  return document.querySelector('#full-backup-restore-panel')
    || document.querySelector('#wife-access-readiness-panel')
    || document.querySelector('#real-data-consolidator-panel')
    || document.querySelector('.dashboard-panel');
}

function renderChecks(checks = []) {
  return checks.map((check) => `
    <div class="diagnostic-row ${check.ok ? '' : 'danger-row'}">
      <span>${escapeHtml(check.label)}<br><small>${escapeHtml(check.detail)}</small></span>
      <strong>${check.ok ? 'ok' : 'pendente'}</strong>
    </div>
  `).join('');
}

function renderResult(container, result) {
  if (!container) return;
  const access = result.access || null;
  const readiness = result.readiness || {};
  const enabled = Boolean(result.enabled || access?.enabled);
  container.innerHTML = `
    <div class="${result.ok ? 'diagnostic-ok' : 'diagnostic-warning'}">${escapeHtml(result.message)}</div>
    <div class="diagnostic-table">
      <div class="diagnostic-row"><span>Acesso teste LAB</span><strong>${enabled ? 'liberado' : 'bloqueado'}</strong></div>
      <div class="diagnostic-row"><span>Usuária</span><strong>${escapeHtml(access?.userName || 'não definido')}</strong></div>
      <div class="diagnostic-row"><span>Modo</span><strong>${escapeHtml(access?.mode || 'lab_bloqueado')}</strong></div>
      <div class="diagnostic-row"><span>Checklist OK</span><strong>${escapeHtml(readiness.okCount || 0)}/${escapeHtml(readiness.totalChecks || 0)}</strong></div>
      <div class="diagnostic-row"><span>Pronto para teste</span><strong>${readiness.readyForWifeTest ? 'sim' : 'não'}</strong></div>
      <div class="diagnostic-row"><span>Produtos</span><strong>${escapeHtml(result.counts?.products || 0)}</strong></div>
      <div class="diagnostic-row"><span>Clientes</span><strong>${escapeHtml(result.counts?.customers || 0)}</strong></div>
      <div class="diagnostic-row"><span>Vendas</span><strong>${escapeHtml(result.counts?.sales || 0)}</strong></div>
      <div class="diagnostic-row"><span>Parcelas</span><strong>${escapeHtml(result.counts?.payments || 0)}</strong></div>
      <div class="diagnostic-row"><span>Acesso produção</span><strong>não liberado</strong></div>
      <div class="diagnostic-row"><span>Escrita Firebase</span><strong>não</strong></div>
      <div class="diagnostic-row"><span>Catálogo antigo</span><strong>intocado</strong></div>
    </div>
    <details class="diagnostic-details" open>
      <summary>Checklist de acesso controlado</summary>
      <div class="diagnostic-table">${renderChecks(readiness.checks || [])}</div>
    </details>
    <div class="storage-note">Próximo bloco recomendado: BLOCO 14E — Identidade visual definitiva do Gestão.</div>
  `;
}

function bindPanel() {
  const panel = document.getElementById(PANEL_ID);
  if (!panel) return;
  const nameInput = panel.querySelector('[data-wife-access-name]');
  const noteInput = panel.querySelector('[data-wife-access-note]');
  const resultBox = panel.querySelector('[data-wife-controlled-access-result]');

  panel.querySelector('[data-check-wife-access]')?.addEventListener('click', () => {
    const result = getWifeControlledAccessStatus();
    renderResult(resultBox, result);
    logDiagnosticEvent('info', 'wife.controlled.access.status', result.message, { counts: result.counts, readiness: result.readiness });
  });

  panel.querySelector('[data-enable-wife-access]')?.addEventListener('click', () => {
    const result = enableWifeTestAccess({ name: nameInput?.value || 'Yasmin', note: noteInput?.value || '' });
    renderResult(resultBox, result);
    logDiagnosticEvent(result.ok ? 'info' : 'error', 'wife.controlled.access.enable', result.message, { readiness: result.readiness, access: result.access || null });
  });

  panel.querySelector('[data-disable-wife-access]')?.addEventListener('click', () => {
    const result = disableWifeTestAccess();
    renderResult(resultBox, result);
    logDiagnosticEvent('info', 'wife.controlled.access.disable', result.message, { access: result.access || null });
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
