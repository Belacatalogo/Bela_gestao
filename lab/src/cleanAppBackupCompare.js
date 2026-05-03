import { renderCleanApp as renderCatalogBackupApp } from './cleanAppCatalogBackup.js';
import { APP_CONFIG } from './config/appConfig.js';
import { getCatalogBackupAnalysis } from './services/catalogBackupLabService.js';
import { clearGestaoBackupAnalysis, clearLastComparison, compareCatalogAndGestaoBackups, getGestaoBackupAnalysis, getLastComparison, readGestaoBackupFile, saveGestaoBackupAnalysis } from './services/gestaoBackupCompareService.js';

function esc(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function renderGestaoBackupSummary(record) {
  if (!record?.analysis) {
    return `<div class="backup-compare-empty" data-gestao-backup-status>Nenhum backup real do Gestão anexado ainda.</div>`;
  }

  const analysis = record.analysis;
  return `
    <div class="backup-compare-summary" data-gestao-backup-status>
      <p>Backup Gestão: <strong>${esc(record.sourceName || 'gestao-backup.json')}</strong></p>
      <div class="backup-compare-grid">
        <article><strong>${analysis.totalProducts || 0}</strong><span>Produtos</span></article>
        <article><strong>${analysis.withPrice || 0}</strong><span>Com preço</span></article>
        <article><strong>${analysis.salesCount || 0}</strong><span>Vendas</span></article>
        <article><strong>${analysis.clientsCount || 0}</strong><span>Clientes</span></article>
      </div>
      ${analysis.detectedPaths ? `
        <details class="backup-compare-details">
          <summary>Diagnóstico do backup Gestão</summary>
          <p>Produtos: ${esc(analysis.detectedPaths.products)}</p>
          <p>Vendas: ${esc(analysis.detectedPaths.sales)}</p>
          <p>Clientes: ${esc(analysis.detectedPaths.clients)}</p>
          <p>Pagamentos: ${esc(analysis.detectedPaths.payments)}</p>
        </details>
      ` : ''}
    </div>
  `;
}

function renderComparisonMiniStatus() {
  const catalog = getCatalogBackupAnalysis();
  const gestao = getGestaoBackupAnalysis();
  return `
    <div class="backup-source-status">
      <div class="${catalog?.analysis ? 'ok' : 'warn'}">Catálogo: ${catalog?.analysis ? `${catalog.analysis.total} produto(s)` : 'não anexado'}</div>
      <div class="${gestao?.analysis ? 'ok' : 'warn'}">Gestão: ${gestao?.analysis ? `${gestao.analysis.totalProducts} produto(s)` : 'não anexado'}</div>
    </div>
  `;
}

function productRow(item, type = 'merged') {
  const product = item.merged || item.catalog || item.gestao || item;
  return `
    <div class="backup-product-row ${type}">
      ${product.imageUrl ? `<img src="${esc(product.imageUrl)}" alt="${esc(product.name)}">` : '<span></span>'}
      <div>
        <strong>${esc(product.name || 'Produto sem nome')}</strong>
        <small>${esc(product.brand || product.category || '')}${product.price !== '' && product.price !== undefined && product.price !== null ? ` · ${esc(product.price)}` : ''}</small>
      </div>
    </div>
  `;
}

function renderComparisonResult(result) {
  if (!result) return '<div class="backup-compare-empty">Nenhuma comparação executada ainda.</div>';
  if (!result.ok) return `<div class="backup-compare-empty error">${esc(result.message || 'Não foi possível comparar.')}</div>`;

  return `
    <div class="backup-comparison-result">
      <div class="backup-compare-grid main">
        <article><strong>${result.summary.exact}</strong><span>Iguais</span></article>
        <article><strong>${result.summary.readyToUnify}</strong><span>Prontos</span></article>
        <article><strong>${result.summary.possibleDuplicates}</strong><span>Possíveis</span></article>
        <article><strong>${result.summary.onlyCatalog}</strong><span>Só catálogo</span></article>
        <article><strong>${result.summary.onlyGestao}</strong><span>Só gestão</span></article>
        <article><strong>${result.summary.priceDiffs}</strong><span>Preço dif.</span></article>
      </div>
      <div class="backup-compare-note">Comparação feita em modo LAB. Nada foi importado, escrito ou alterado.</div>
      <details class="backup-compare-details" open>
        <summary>Prontos para unir: foto do catálogo + preço do Gestão (${result.catalogPhotoGestaoPrice.length})</summary>
        ${result.catalogPhotoGestaoPrice.slice(0, 12).map((item) => productRow(item, 'ready')).join('') || '<p>Nenhum pronto para unir ainda.</p>'}
      </details>
      <details class="backup-compare-details">
        <summary>Possíveis duplicados (${result.possibleDuplicates.length})</summary>
        ${result.possibleDuplicates.slice(0, 12).map((item) => `
          <div class="backup-duplicate-row">
            ${productRow({ merged: item.catalog }, 'catalog')}
            ${productRow({ merged: item.gestao }, 'gestao')}
            <small>Similaridade: ${Math.round((item.score || 0) * 100)}%</small>
          </div>
        `).join('') || '<p>Nenhum possível duplicado.</p>'}
      </details>
      <details class="backup-compare-details">
        <summary>Só no catálogo (${result.onlyCatalog.length})</summary>
        ${result.onlyCatalog.slice(0, 12).map((product) => productRow(product, 'catalog')).join('') || '<p>Nenhum produto exclusivo do catálogo.</p>'}
      </details>
      <details class="backup-compare-details">
        <summary>Só no Gestão (${result.onlyGestao.length})</summary>
        ${result.onlyGestao.slice(0, 12).map((product) => productRow(product, 'gestao')).join('') || '<p>Nenhum produto exclusivo do Gestão.</p>'}
      </details>
    </div>
  `;
}

function renderBackupComparePanel() {
  const gestaoRecord = getGestaoBackupAnalysis();
  const comparison = getLastComparison();
  return `
    <section class="legacy-settings-section backup-compare-section" data-backup-compare-panel>
      <h3>Comparação segura</h3>
      <div class="legacy-settings-card backup-compare-card">
        <h4>📦 Backup real do Gestão</h4>
        <p>Anexe aqui o JSON real do Gestão da sua esposa. Ele será analisado separado do LAB e usado apenas para comparar com o backup do catálogo.</p>
        <label class="backup-compare-file-button">
          <span>Selecionar JSON do Gestão real</span>
          <input type="file" accept="application/json,.json" data-gestao-backup-file hidden>
        </label>
        ${renderGestaoBackupSummary(gestaoRecord)}
        <div class="backup-compare-actions">
          <button class="secondary-button" type="button" data-clear-gestao-backup>Limpar backup Gestão</button>
        </div>
      </div>

      <div class="legacy-settings-card backup-compare-card">
        <h4>🔎 Catálogo x Gestão</h4>
        <p>Compara o backup visual do catálogo com o backup real do Gestão. O resultado é só uma análise, sem importar nada.</p>
        ${renderComparisonMiniStatus()}
        <button class="primary-button full" type="button" data-run-backup-compare>Comparar backups agora</button>
        <button class="secondary-button full" type="button" data-clear-backup-compare>Limpar comparação</button>
        <div data-backup-comparison-result>${renderComparisonResult(comparison)}</div>
      </div>
    </section>
  `;
}

function findSettingsPage(root) {
  return root.querySelector('.legacy-settings-page');
}

function enhanceBackupCompare(root) {
  const settingsPage = findSettingsPage(root);
  if (!settingsPage) return false;
  if (settingsPage.querySelector('[data-backup-compare-panel]')) {
    bindBackupCompare(root);
    return true;
  }

  const catalogPanel = settingsPage.querySelector('[data-catalog-backup-panel]');
  const backupTools = settingsPage.querySelector('.legacy-lab-tools');

  if (catalogPanel) {
    catalogPanel.insertAdjacentHTML('afterend', renderBackupComparePanel());
  } else if (backupTools) {
    backupTools.insertAdjacentHTML('beforebegin', renderBackupComparePanel());
  } else {
    settingsPage.insertAdjacentHTML('beforeend', renderBackupComparePanel());
  }

  bindBackupCompare(root);
  return true;
}

function scheduleEnhanceBackupCompare(root) {
  enhanceBackupCompare(root);
  window.setTimeout(() => enhanceBackupCompare(root), 80);
  window.setTimeout(() => enhanceBackupCompare(root), 250);
  window.setTimeout(() => enhanceBackupCompare(root), 650);
}

function replacePanel(root) {
  const panel = root.querySelector('[data-backup-compare-panel]');
  if (panel) panel.outerHTML = renderBackupComparePanel();
  bindBackupCompare(root);
}

function bindBackupCompare(root) {
  root.querySelector('[data-gestao-backup-file]')?.addEventListener('change', async (event) => {
    const file = event.target.files?.[0];
    const status = root.querySelector('[data-gestao-backup-status]');
    if (status) status.textContent = 'Lendo backup real do Gestão...';
    const result = await readGestaoBackupFile(file);
    if (!result.ok) {
      if (status) {
        status.className = 'backup-compare-empty error';
        status.innerHTML = `${esc(result.error || 'Não foi possível ler o backup do Gestão.')}${result.analysis?.sourceKeys?.length ? `<br><br>Chaves: ${esc(result.analysis.sourceKeys.join(', '))}` : ''}`;
      }
      return;
    }
    saveGestaoBackupAnalysis(result.analysis, file.name);
    clearLastComparison();
    replacePanel(root);
  });

  root.querySelector('[data-clear-gestao-backup]')?.addEventListener('click', () => {
    clearGestaoBackupAnalysis();
    replacePanel(root);
  });

  root.querySelector('[data-run-backup-compare]')?.addEventListener('click', () => {
    const result = compareCatalogAndGestaoBackups();
    const target = root.querySelector('[data-backup-comparison-result]');
    if (target) target.innerHTML = renderComparisonResult(result);
  });

  root.querySelector('[data-clear-backup-compare]')?.addEventListener('click', () => {
    clearLastComparison();
    const target = root.querySelector('[data-backup-comparison-result]');
    if (target) target.innerHTML = renderComparisonResult(null);
  });
}

export function renderCleanApp(root) {
  renderCatalogBackupApp(root);
  if (!root) return;
  root.setAttribute('data-bela-version', APP_CONFIG.version);
  const activeTab = window.localStorage.getItem('belaGestaoLab.cleanTab');
  if (activeTab === 'ajustes') scheduleEnhanceBackupCompare(root);

  root.addEventListener('click', (event) => {
    if (event.target?.closest?.('[data-clean-tab="ajustes"]')) {
      window.setTimeout(() => scheduleEnhanceBackupCompare(root), 0);
    }
  });
}
