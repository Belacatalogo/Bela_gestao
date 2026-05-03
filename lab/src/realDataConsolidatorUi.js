import { logDiagnosticEvent } from './services/diagnosticsService.js';
import { consolidateRealData } from './services/realDataConsolidatorService.js';

const PANEL_ID = 'real-data-consolidator-panel';

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function renderPanel() {
  return `
    <section id="${PANEL_ID}" class="panel-card real-data-consolidator-panel">
      <div class="panel-title-row">
        <div>
          <h2>Consolidador de dados reais</h2>
          <p>Converte produtos, clientes, vendas e parcelas para o contrato mestre do novo Gestão.</p>
        </div>
        <span class="safe-pill">14B</span>
      </div>
      <div class="storage-note">
        Cole o backup manual para incluir clientes, vendas e parcelas. Se deixar vazio, consolida só produtos atuais do LAB.
      </div>
      <label class="compact-field full-row">
        <span>Backup JSON opcional</span>
        <textarea data-real-backup-json rows="8" placeholder='Cole aqui o backup do Gestão para consolidar vendas/clientes/parcelas'></textarea>
      </label>
      <div class="lab-actions">
        <button class="primary-button full-row" type="button" data-consolidate-real-data>Consolidar dados reais no LAB</button>
      </div>
      <div data-real-consolidator-result>
        <div class="diagnostic-ok">Pronto para consolidar dados sem escrever no Firebase.</div>
      </div>
    </section>
  `;
}

function findInsertionPoint() {
  return document.querySelector('#master-source-contracts-panel')
    || document.querySelector('#confirmed-products-safe-import-panel')
    || document.querySelector('#gestao-backup-source-map-panel')
    || document.querySelector('.dashboard-panel');
}

function renderList(items, formatter) {
  return items?.length ? items.map(formatter).join(', ') : 'nenhum';
}

function renderResult(container, result) {
  if (!container) return;
  if (!result.ok) {
    container.innerHTML = `<div class="diagnostic-warning">${escapeHtml(result.message)} ${escapeHtml(result.error || '')}</div>`;
    return;
  }
  const summary = result.summary;
  container.innerHTML = `
    <div class="diagnostic-ok">${escapeHtml(result.message)}</div>
    <div class="diagnostic-table">
      <div class="diagnostic-row"><span>Produtos consolidados</span><strong>${escapeHtml(summary.products)}</strong></div>
      <div class="diagnostic-row"><span>Clientes consolidados</span><strong>${escapeHtml(summary.customers)}</strong></div>
      <div class="diagnostic-row"><span>Vendas consolidadas</span><strong>${escapeHtml(summary.sales)}</strong></div>
      <div class="diagnostic-row"><span>Parcelas/pagamentos</span><strong>${escapeHtml(summary.payments)}</strong></div>
      <div class="diagnostic-row"><span>Produtos com imagem</span><strong>${escapeHtml(summary.productsWithImage)}</strong></div>
      <div class="diagnostic-row"><span>Produtos com preço</span><strong>${escapeHtml(summary.productsWithPrice)}</strong></div>
      <div class="diagnostic-row"><span>Prontos para catálogo</span><strong>${escapeHtml(summary.productsReadyForCatalog)}</strong></div>
      <div class="diagnostic-row"><span>Precisam revisão</span><strong>${escapeHtml(summary.productsNeedReview)}</strong></div>
      <div class="diagnostic-row"><span>Vendas abertas</span><strong>${escapeHtml(summary.openSales)}</strong></div>
      <div class="diagnostic-row"><span>Vendas quitadas</span><strong>${escapeHtml(summary.paidSales)}</strong></div>
      <div class="diagnostic-row"><span>Parcelas pagas</span><strong>${escapeHtml(summary.paidInstallments)}</strong></div>
      <div class="diagnostic-row"><span>Parcelas abertas</span><strong>${escapeHtml(summary.openInstallments)}</strong></div>
      <div class="diagnostic-row"><span>Storage LAB</span><strong>${escapeHtml(result.storageKey)}</strong></div>
      <div class="diagnostic-row"><span>Escrita Firebase</span><strong>não</strong></div>
    </div>
    <details class="diagnostic-details" open>
      <summary>Amostras consolidadas</summary>
      <div class="diagnostic-table">
        <div class="diagnostic-row"><span>Produtos</span><strong>${escapeHtml(renderList(result.samples.products, (p) => `${p.name} (${p.status})`))}</strong></div>
        <div class="diagnostic-row"><span>Clientes</span><strong>${escapeHtml(renderList(result.samples.customers, (c) => `${c.name} ${c.phone || ''}`))}</strong></div>
        <div class="diagnostic-row"><span>Vendas</span><strong>${escapeHtml(renderList(result.samples.sales, (s) => `${s.customer || 'cliente'}:${s.legacyProductId}:${s.status}`))}</strong></div>
        <div class="diagnostic-row"><span>Pagamentos</span><strong>${escapeHtml(renderList(result.samples.payments, (p) => `${p.saleId}:${p.paid ? 'pago' : 'aberto'}:${p.value}`))}</strong></div>
      </div>
    </details>
    <div class="storage-note">
      Dados consolidados ficaram apenas no localStorage LAB. Próximo bloco: backup/restore completo ou acesso da esposa, sem mexer no catálogo antigo.
    </div>
  `;
}

function bindPanel() {
  const panel = document.getElementById(PANEL_ID);
  if (!panel) return;
  const textarea = panel.querySelector('[data-real-backup-json]');
  const button = panel.querySelector('[data-consolidate-real-data]');
  const resultBox = panel.querySelector('[data-real-consolidator-result]');

  button?.addEventListener('click', () => {
    resultBox.innerHTML = '<div class="diagnostic-warning">Consolidando dados reais...</div>';
    const result = consolidateRealData(textarea?.value || '');
    renderResult(resultBox, result);
    logDiagnosticEvent(result.ok ? 'info' : 'error', 'real.data.consolidator', result.message, {
      ok: result.ok,
      summary: result.summary || {},
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
