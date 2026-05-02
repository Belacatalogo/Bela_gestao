import { logDiagnosticEvent } from './services/diagnosticsService.js';
import { getFirebaseReadonlyProbeReadiness, runFirebaseProductsPricesPreview, runFirebaseReadonlyProbe, runFirebaseRealKeysMapProbe } from './services/firebaseReadonlyProbeService.js';

const PANEL_ID = 'firebase-readonly-probe-panel';

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function renderProbePanel() {
  const readiness = getFirebaseReadonlyProbeReadiness();
  return `
    <section id="${PANEL_ID}" class="panel-card firebase-probe-panel">
      <div class="panel-title-row">
        <div>
          <h2>Firebase READ-ONLY Probe</h2>
          <p>Sondagem segura do Realtime Database. Faz somente leitura e não importa dados para o LAB.</p>
        </div>
        <span class="safe-pill">Probe</span>
      </div>

      <div class="mini-grid four-stats">
        <div class="mini-stat"><strong>${readiness.ready ? 'sim' : 'não'}</strong><span>pronto</span></div>
        <div class="mini-stat"><strong>${readiness.hasConfig ? 'sim' : 'não'}</strong><span>config</span></div>
        <div class="mini-stat"><strong>${readiness.hasDatabaseUrl ? 'sim' : 'não'}</strong><span>databaseURL</span></div>
        <div class="mini-stat"><strong>${readiness.writeBlocked ? 'sim' : 'não'}</strong><span>escrita bloqueada</span></div>
      </div>

      <div class="storage-note">
        ${escapeHtml(readiness.note)}<br>
        <strong>Login:</strong> não solicitado neste bloco.<br>
        <strong>Escrita:</strong> bloqueada.<br>
        <strong>Importação:</strong> bloqueada neste bloco.
      </div>

      <div class="product-filters">
        <label class="compact-field full-row">
          <span>Caminho de leitura segura</span>
          <select data-firebase-probe-path>
            ${readiness.safeProbePaths.map((item) => `<option value="${escapeHtml(item.path)}">${escapeHtml(item.label)} — ${escapeHtml(item.path)}</option>`).join('')}
          </select>
        </label>
        <button class="primary-button full-row" type="button" data-run-firebase-probe ${readiness.ready ? '' : 'disabled'}>Rodar probe READ-ONLY</button>
        <button class="secondary-button full-row" type="button" data-map-firebase-real-keys ${readiness.ready ? '' : 'disabled'}>Mapear chaves reais</button>
        <button class="secondary-button full-row" type="button" data-preview-products-prices ${readiness.ready ? '' : 'disabled'}>Preview produtos + preços</button>
      </div>

      <div data-firebase-probe-result>
        ${readiness.ready ? '<div class="diagnostic-ok">Pronto para testar leitura segura. Nenhuma escrita será feita.</div>' : `<div class="diagnostic-warning">Ainda não pronto: ${escapeHtml(readiness.note)}</div>`}
      </div>

      <details class="diagnostic-details" open>
        <summary>Chaves reais esperadas</summary>
        <div class="diagnostic-table">
          ${readiness.realKeyMapPaths.map((item) => `<div class="diagnostic-row"><span>${escapeHtml(item.label)}<br><small>${escapeHtml(item.expectedUse)}</small></span><strong>${escapeHtml(item.path)}</strong></div>`).join('')}
        </div>
      </details>

      <details class="diagnostic-details">
        <summary>Caminhos disponíveis para probe</summary>
        <div class="diagnostic-table">
          ${readiness.safeProbePaths.map((item) => `<div class="diagnostic-row"><span>${escapeHtml(item.label)}</span><strong>${escapeHtml(item.path)}</strong></div>`).join('')}
        </div>
      </details>
    </section>
  `;
}

function findInsertionPoint() {
  return document.querySelector('.firebase-config-panel') || document.querySelector('.firebase-readonly-panel') || document.querySelector('.dashboard-panel');
}

function ensurePanel() {
  if (document.getElementById(PANEL_ID)) return;
  const anchor = findInsertionPoint();
  if (!anchor) return;
  anchor.insertAdjacentHTML('afterend', renderProbePanel());
  bindProbePanel();
}

function renderChildren(summary) {
  const children = summary?.children || [];
  if (!children.length) return '';
  return `
    <details class="diagnostic-details" open>
      <summary>Amostra estrutural</summary>
      <div class="diagnostic-table">
        ${children.slice(0, 12).map((child) => `<div class="diagnostic-row"><span>${escapeHtml(child.key)}<br><small>tipo: ${escapeHtml(child.type)} · itens: ${escapeHtml(child.count)}</small></span><strong>${escapeHtml((child.keys || []).slice(0, 6).join(', ') || child.preview || 'sem subchaves')}</strong></div>`).join('')}
      </div>
    </details>
  `;
}

function renderResult(container, result) {
  if (!container) return;

  if (result.ok) {
    const keys = result.summary.keys?.length ? result.summary.keys.join(', ') : 'nenhuma chave listada';
    container.innerHTML = `
      <div class="diagnostic-ok">${escapeHtml(result.message)}</div>
      <div class="diagnostic-table">
        <div class="diagnostic-row"><span>Caminho</span><strong>${escapeHtml(result.path)}</strong></div>
        <div class="diagnostic-row"><span>Existe</span><strong>${result.summary.exists ? 'sim' : 'não'}</strong></div>
        <div class="diagnostic-row"><span>Tipo</span><strong>${escapeHtml(result.summary.type)}</strong></div>
        <div class="diagnostic-row"><span>Quantidade aproximada</span><strong>${escapeHtml(result.summary.count)}</strong></div>
        <div class="diagnostic-row"><span>Classificação</span><strong>${escapeHtml(result.classification || 'não classificado')}</strong></div>
        <div class="diagnostic-row"><span>Chaves encontradas</span><strong>${escapeHtml(keys)}</strong></div>
      </div>
      ${renderChildren(result.summary)}
    `;
    return;
  }

  const error = result.error ? `${result.error.code || result.error.name}: ${result.error.message}` : result.message;
  container.innerHTML = `
    <div class="diagnostic-warning">${escapeHtml(error)}</div>
    <div class="storage-note">Falha esperada se as regras do Firebase bloquearem leitura pública. Nenhuma escrita foi feita.</div>
  `;
}

function renderMapResult(container, result) {
  if (!container) return;
  if (!result.ok) {
    renderResult(container, result);
    return;
  }

  container.innerHTML = `
    <div class="diagnostic-ok">${escapeHtml(result.message)}</div>
    <div class="diagnostic-table">
      ${result.rows.map((row) => {
        if (!row.ok) {
          const error = row.error ? `${row.error.code || row.error.name}: ${row.error.message}` : row.message;
          return `<div class="diagnostic-row"><span>${escapeHtml(row.label)}<br><small>${escapeHtml(row.path)}</small></span><strong>${escapeHtml(error)}</strong></div>`;
        }
        const keys = row.summary?.keys?.length ? row.summary.keys.join(', ') : 'sem chaves';
        return `<div class="diagnostic-row"><span>${escapeHtml(row.label)}<br><small>${escapeHtml(row.expectedUse)}</small></span><strong>${escapeHtml(row.classification)} · ${escapeHtml(row.summary?.type)} · ${escapeHtml(row.summary?.count)} item(ns) · ${escapeHtml(keys)}</strong></div>`;
      }).join('')}
    </div>
    <div class="storage-note">Mapa criado apenas com resumo estrutural. Dados reais não foram importados para o LAB.</div>
  `;
}

function renderProductsPricesPreview(container, result) {
  if (!container) return;
  if (!result.ok) {
    const error = result.error ? `${result.error.code || result.error.name}: ${result.error.message}` : result.message;
    container.innerHTML = `<div class="diagnostic-warning">${escapeHtml(error)}</div><div class="storage-note">Nenhuma escrita foi feita e nada foi importado para o LAB.</div>`;
    return;
  }

  container.innerHTML = `
    <div class="diagnostic-ok">${escapeHtml(result.message)}</div>
    <div class="diagnostic-table">
      <div class="diagnostic-row"><span>Produtos reais</span><strong>${escapeHtml(result.productCount)}</strong></div>
      <div class="diagnostic-row"><span>Preços reais</span><strong>${escapeHtml(result.priceCount)}</strong></div>
      <div class="diagnostic-row"><span>Produtos com preço pelo mesmo ID</span><strong>${escapeHtml(result.matchedCount)}</strong></div>
      <div class="diagnostic-row"><span>Produtos sem preço</span><strong>${escapeHtml(result.productsWithoutPrice.join(', ') || 'nenhum nos primeiros detectados')}</strong></div>
      <div class="diagnostic-row"><span>Preços sem produto</span><strong>${escapeHtml(result.pricesWithoutProduct.join(', ') || 'nenhum nos primeiros detectados')}</strong></div>
    </div>
    <details class="diagnostic-details" open>
      <summary>Campos encontrados nos produtos</summary>
      <div class="diagnostic-table"><div class="diagnostic-row"><span>Campos</span><strong>${escapeHtml(result.productFields.join(', ') || 'nenhum')}</strong></div></div>
    </details>
    <details class="diagnostic-details" open>
      <summary>Amostra de produtos reais</summary>
      <div class="diagnostic-table">
        ${result.sampleProducts.map((product) => `<div class="diagnostic-row"><span>ID ${escapeHtml(product.id)}<br><small>${escapeHtml(product.name || 'sem nome detectado')} · imagem: ${product.hasImage ? 'sim' : 'não'} · preço: ${product.price ?? 'não detectado'}</small></span><strong>${escapeHtml(product.productFields.join(', ') || 'sem campos')}</strong></div>`).join('')}
      </div>
    </details>
    <div class="storage-note">Preview concluído sem importação. Próximo bloco pode criar importação controlada para o LAB.</div>
  `;
}

function bindProbePanel() {
  const panel = document.getElementById(PANEL_ID);
  if (!panel) return;
  const button = panel.querySelector('[data-run-firebase-probe]');
  const mapButton = panel.querySelector('[data-map-firebase-real-keys]');
  const previewButton = panel.querySelector('[data-preview-products-prices]');
  const select = panel.querySelector('[data-firebase-probe-path]');
  const resultBox = panel.querySelector('[data-firebase-probe-result]');

  button?.addEventListener('click', async () => {
    const path = select?.value || '/';
    button.disabled = true;
    resultBox.innerHTML = '<div class="diagnostic-warning">Rodando probe READ-ONLY...</div>';
    try {
      const result = await runFirebaseReadonlyProbe(path);
      renderResult(resultBox, result);
      logDiagnosticEvent(result.ok ? 'info' : 'error', 'firebase.readonly.probe', result.message, { path, ok: result.ok, error: result.error || null });
    } catch (error) {
      renderResult(resultBox, { ok: false, message: String(error?.message || error), error });
      logDiagnosticEvent('error', 'firebase.readonly.probe', 'Erro inesperado no probe READ-ONLY.', { error: String(error?.message || error) });
    } finally {
      button.disabled = false;
    }
  });

  mapButton?.addEventListener('click', async () => {
    mapButton.disabled = true;
    resultBox.innerHTML = '<div class="diagnostic-warning">Mapeando chaves reais em READ-ONLY...</div>';
    try {
      const result = await runFirebaseRealKeysMapProbe();
      renderMapResult(resultBox, result);
      logDiagnosticEvent(result.ok ? 'info' : 'error', 'firebase.real.keys.map', result.message, { ok: result.ok, rows: result.rows || [] });
    } catch (error) {
      renderResult(resultBox, { ok: false, message: String(error?.message || error), error });
      logDiagnosticEvent('error', 'firebase.real.keys.map', 'Erro inesperado ao mapear chaves reais.', { error: String(error?.message || error) });
    } finally {
      mapButton.disabled = false;
    }
  });

  previewButton?.addEventListener('click', async () => {
    previewButton.disabled = true;
    resultBox.innerHTML = '<div class="diagnostic-warning">Lendo preview READ-ONLY de produtos e preços...</div>';
    try {
      const result = await runFirebaseProductsPricesPreview();
      renderProductsPricesPreview(resultBox, result);
      logDiagnosticEvent(result.ok ? 'info' : 'error', 'firebase.products.prices.preview', result.message, { ok: result.ok, productCount: result.productCount, priceCount: result.priceCount, matchedCount: result.matchedCount, error: result.error || null });
    } catch (error) {
      renderResult(resultBox, { ok: false, message: String(error?.message || error), error });
      logDiagnosticEvent('error', 'firebase.products.prices.preview', 'Erro inesperado no preview de produtos/preços.', { error: String(error?.message || error) });
    } finally {
      previewButton.disabled = false;
    }
  });
}

window.addEventListener('DOMContentLoaded', () => {
  ensurePanel();
  const observer = new MutationObserver(() => ensurePanel());
  observer.observe(document.body, { childList: true, subtree: true });
});
