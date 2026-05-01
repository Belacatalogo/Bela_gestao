export function renderDiagnosticsPanel(report) {
  const warnings = report.warnings || [];
  const events = report.events || [];
  const storageRows = report.storage?.rows || [];
  const imageRows = report.images?.rows || [];

  return `
    <section class="panel-card diagnostics-panel">
      <div class="panel-title-row">
        <div>
          <h2>Diagnóstico LAB</h2>
          <p>Visão técnica para encontrar erros de dados, storage, imagem, vendas e navegador.</p>
        </div>
        <span class="safe-pill">Debug</span>
      </div>

      <div class="diagnostic-actions">
        <button class="secondary-button" data-copy-diagnostics>Copiar diagnóstico</button>
        <button class="secondary-button" data-clear-diagnostics>Limpar eventos</button>
      </div>

      <div class="mini-grid four-stats">
        <div class="mini-stat">
          <strong>${report.counts.products}</strong>
          <span>produtos</span>
        </div>
        <div class="mini-stat">
          <strong>${report.counts.sales}</strong>
          <span>vendas</span>
        </div>
        <div class="mini-stat">
          <strong>${report.counts.catalogWarnings}</strong>
          <span>alertas catálogo</span>
        </div>
        <div class="mini-stat">
          <strong>${warnings.length}</strong>
          <span>alertas gerais</span>
        </div>
      </div>

      <details class="diagnostic-details" open>
        <summary>Status principal</summary>
        <div class="diagnostic-grid">
          <div><strong>Versão:</strong> ${report.app.version}</div>
          <div><strong>Branch:</strong> ${report.app.branch}</div>
          <div><strong>Modo:</strong> ${report.environment.label}</div>
          <div><strong>Escrita real:</strong> ${report.environment.canWriteRealData ? 'permitida' : 'bloqueada'}</div>
          <div><strong>Online:</strong> ${report.browser.online ? 'sim' : 'não'}</div>
          <div><strong>Viewport:</strong> ${report.browser.viewport}</div>
          <div><strong>Storage LAB:</strong> ${report.storage.totalSizeKb || 0} KB</div>
          <div><strong>Gerado em:</strong> ${report.generatedAt}</div>
        </div>
      </details>

      <details class="diagnostic-details" ${warnings.length ? 'open' : ''}>
        <summary>Alertas detectados</summary>
        ${warnings.length ? `
          <div class="diagnostic-list">
            ${warnings.map((warning) => `<div class="diagnostic-warning">${warning}</div>`).join('')}
          </div>
        ` : '<div class="diagnostic-ok">Nenhum alerta crítico detectado agora.</div>'}
      </details>

      <details class="diagnostic-details">
        <summary>Storage LAB</summary>
        ${storageRows.length ? `
          <div class="diagnostic-table">
            ${storageRows.map((row) => `
              <div class="diagnostic-row ${row.isHeavy ? 'danger-row' : ''}">
                <span>${row.key}</span>
                <strong>${row.sizeKb} KB</strong>
              </div>
            `).join('')}
          </div>
        ` : '<div class="diagnostic-ok">Nenhuma chave LAB encontrada no localStorage.</div>'}
      </details>

      <details class="diagnostic-details">
        <summary>Imagens dos produtos</summary>
        <div class="diagnostic-grid">
          <div><strong>Fotos LAB:</strong> ${report.images.labDataUrlCount}</div>
          <div><strong>Placeholders:</strong> ${report.images.placeholderCount}</div>
          <div><strong>Pesadas:</strong> ${report.images.heavyCount}</div>
        </div>
        <div class="diagnostic-table">
          ${imageRows.map((row) => `
            <div class="diagnostic-row ${row.isHeavy ? 'danger-row' : ''}">
              <span>${row.name} · ${row.kind}</span>
              <strong>${row.sizeKb} KB</strong>
            </div>
          `).join('')}
        </div>
      </details>

      <details class="diagnostic-details">
        <summary>Eventos e erros capturados</summary>
        ${events.length ? `
          <div class="diagnostic-list">
            ${events.slice(0, 20).map((event) => `
              <div class="diagnostic-event ${event.level === 'error' ? 'danger-row' : ''}">
                <strong>${event.level.toUpperCase()} · ${event.source}</strong>
                <span>${event.message}</span>
                <small>${event.createdAt}</small>
              </div>
            `).join('')}
          </div>
        ` : '<div class="diagnostic-ok">Nenhum evento registrado ainda.</div>'}
      </details>

      <details class="diagnostic-details">
        <summary>Navegador</summary>
        <div class="diagnostic-user-agent">${report.browser.userAgent}</div>
      </details>
    </section>
  `;
}
