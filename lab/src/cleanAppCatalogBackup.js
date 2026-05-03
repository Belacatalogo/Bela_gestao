import { renderCleanApp as renderSettingsApp } from './cleanAppSettings.js';
import { APP_CONFIG } from './config/appConfig.js';
import { buildCatalogBackupExportScript, clearCatalogBackupAnalysis, getCatalogBackupAnalysis, readCatalogBackupFile, saveCatalogBackupAnalysis } from './services/catalogBackupLabService.js';

function esc(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function renderCatalogBackupSummary(record) {
  if (!record?.analysis) {
    return `
      <div class="catalog-backup-empty" data-catalog-backup-status>
        Nenhum backup do catálogo foi anexado ainda.
      </div>
    `;
  }

  const analysis = record.analysis;
  return `
    <div class="catalog-backup-summary" data-catalog-backup-status>
      <p>Backup analisado: <strong>${esc(record.sourceName || 'catalogo.json')}</strong></p>
      <div class="catalog-backup-grid">
        <article><strong>${analysis.total || 0}</strong><span>Produtos</span></article>
        <article><strong>${analysis.withImage || 0}</strong><span>Com foto</span></article>
        <article><strong>${analysis.withPrice || 0}</strong><span>Com preço</span></article>
        <article><strong>${analysis.categories?.length || 0}</strong><span>Categorias</span></article>
      </div>
      <details class="catalog-backup-details">
        <summary>Ver categorias e amostra</summary>
        <p>Categorias: ${esc((analysis.categories || []).join(', ') || 'não identificadas')}</p>
        ${(analysis.products || []).slice(0, 8).map((product) => `
          <div class="catalog-backup-product-row">
            ${product.imageUrl ? `<img src="${esc(product.imageUrl)}" alt="${esc(product.name)}">` : '<span></span>'}
            <div><strong>${esc(product.name || 'Produto sem nome')}</strong><small>${esc(product.brand || product.category || '')}</small></div>
          </div>
        `).join('')}
      </details>
      <div class="catalog-backup-note">Esse backup está salvo apenas no LAB/localStorage. Nada foi enviado ao Firebase e nada foi alterado no catálogo real.</div>
    </div>
  `;
}

function renderCatalogBackupPanel() {
  const record = getCatalogBackupAnalysis();
  const script = buildCatalogBackupExportScript();

  return `
    <section class="legacy-settings-section catalog-backup-section" data-catalog-backup-panel>
      <h3>Backup do catálogo real</h3>
      <div class="legacy-settings-card catalog-backup-card">
        <h4>🧾 Anexar backup completo do catálogo</h4>
        <p>Use isso para trazer os produtos reais do catálogo para o Gestão LAB sem risco. O arquivo é analisado separado dos dados LAB e não altera o catálogo real.</p>
        <label class="catalog-backup-file-button">
          <span>Selecionar JSON do catálogo</span>
          <input type="file" accept="application/json,.json" data-catalog-backup-file hidden>
        </label>
        ${renderCatalogBackupSummary(record)}
        <div class="catalog-backup-actions">
          <button class="secondary-button" type="button" data-clear-catalog-backup>Limpar backup anexado</button>
        </div>
      </div>

      <div class="legacy-settings-card catalog-backup-card">
        <h4>Script emergencial de exportação</h4>
        <p>Enquanto não adicionamos um botão visual no catálogo real, este script pode exportar os produtos diretamente pelo navegador. Use apenas se precisar gerar o JSON manualmente.</p>
        <textarea class="catalog-export-script" readonly data-catalog-export-script>${esc(script)}</textarea>
        <div class="catalog-backup-actions">
          <button class="primary-button" type="button" data-copy-catalog-script>Copiar script</button>
        </div>
        <div class="catalog-backup-note" data-catalog-script-status>
          Próximo passo seguro: criar uma branch no repositório Bela-catalogo com um botão visual “Exportar backup”.
        </div>
      </div>
    </section>
  `;
}

function findSettingsPage(root) {
  return root.querySelector('.legacy-settings-page');
}

function enhanceCatalogBackup(root) {
  const settingsPage = findSettingsPage(root);
  if (!settingsPage || settingsPage.querySelector('[data-catalog-backup-panel]')) return;

  const reference = settingsPage.querySelector('.real-login-section') || settingsPage.querySelector('.legacy-settings-section');
  if (reference) {
    reference.insertAdjacentHTML('afterend', renderCatalogBackupPanel());
  } else {
    settingsPage.insertAdjacentHTML('beforeend', renderCatalogBackupPanel());
  }

  bindCatalogBackup(root);
}

function bindCatalogBackup(root) {
  root.querySelector('[data-catalog-backup-file]')?.addEventListener('change', async (event) => {
    const file = event.target.files?.[0];
    const status = root.querySelector('[data-catalog-backup-status]');
    if (status) status.textContent = 'Lendo backup do catálogo...';

    const result = await readCatalogBackupFile(file);
    if (!result.ok) {
      if (status) {
        status.className = 'catalog-backup-empty error';
        status.textContent = result.error || 'Não foi possível ler o backup.';
      }
      return;
    }

    saveCatalogBackupAnalysis(result.analysis, file.name);
    const panel = root.querySelector('[data-catalog-backup-panel]');
    if (panel) panel.outerHTML = renderCatalogBackupPanel();
    bindCatalogBackup(root);
  });

  root.querySelector('[data-clear-catalog-backup]')?.addEventListener('click', () => {
    clearCatalogBackupAnalysis();
    const panel = root.querySelector('[data-catalog-backup-panel]');
    if (panel) panel.outerHTML = renderCatalogBackupPanel();
    bindCatalogBackup(root);
  });

  root.querySelector('[data-copy-catalog-script]')?.addEventListener('click', async () => {
    const script = root.querySelector('[data-catalog-export-script]')?.value || buildCatalogBackupExportScript();
    const status = root.querySelector('[data-catalog-script-status]');
    try {
      await navigator.clipboard.writeText(script);
      if (status) status.textContent = 'Script copiado. Cole no console do navegador do catálogo para gerar o JSON.';
    } catch {
      if (status) status.textContent = 'Não consegui copiar automaticamente. Selecione o texto do script e copie manualmente.';
    }
  });
}

export function renderCleanApp(root) {
  renderSettingsApp(root);
  if (!root) return;
  root.setAttribute('data-bela-version', APP_CONFIG.version);
  const activeTab = window.localStorage.getItem('belaGestaoLab.cleanTab');
  if (activeTab === 'ajustes') enhanceCatalogBackup(root);

  root.querySelector('[data-clean-tab="ajustes"]')?.addEventListener('click', () => {
    setTimeout(() => enhanceCatalogBackup(root), 0);
  });
}
