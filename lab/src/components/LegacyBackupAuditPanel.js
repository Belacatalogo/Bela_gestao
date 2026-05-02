export function renderLegacyBackupAuditPanel({ report }) {
  return `
    <section class="panel-card legacy-audit-panel">
      <div class="panel-title-row">
        <div>
          <h2>Auditoria de Backup Real</h2>
          <p>Lê um backup antigo e mostra compatibilidade. Não importa automaticamente e não salva dados reais no repositório.</p>
        </div>
        <span class="safe-pill">Auditoria</span>
      </div>

      <label class="secondary-button file-action full-row">
        Analisar backup real .json
        <input data-legacy-backup-audit type="file" accept="application/json,.json">
      </label>

      <div class="storage-note">
        Regra final registrada: o backup definitivo do Bela Gestão deverá armazenar literalmente tudo que existir no sistema.
      </div>

      ${report ? renderAuditReport(report) : '<div class="empty-preview">Nenhum backup real analisado nesta sessão.</div>'}
    </section>
  `;
}

function renderAuditReport(report) {
  if (!report.ok) {
    return `<div class="diagnostic-warning">${report.error || 'Não foi possível ler o backup.'}</div>`;
  }

  return `
    <div class="mini-grid four-stats">
      <div class="mini-stat"><strong>${report.counts.prices}</strong><span>preços</span></div>
      <div class="mini-stat"><strong>${report.counts.sales}</strong><span>vendas</span></div>
      <div class="mini-stat"><strong>${report.counts.installmentsTotal}</strong><span>parcelas</span></div>
      <div class="mini-stat"><strong>${report.counts.installmentsPending}</strong><span>pendentes</span></div>
    </div>

    <details class="diagnostic-details" open>
      <summary>Compatibilidade</summary>
      <div class="diagnostic-grid">
        <div><strong>Versão:</strong> ${report.version}</div>
        <div><strong>Exportado em:</strong> ${report.exportedAt || 'não informado'}</div>
        <div><strong>Mapear preços:</strong> ${report.compatibility.canMapPrices ? 'sim' : 'não'}</div>
        <div><strong>Mapear vendas:</strong> ${report.compatibility.canMapSales ? 'sim' : 'não'}</div>
        <div><strong>Mapear pagamentos:</strong> ${report.compatibility.canMapPayments ? 'sim' : 'não'}</div>
        <div><strong>Precisa catálogo de produtos:</strong> ${report.compatibility.needsProductCatalogSource ? 'sim' : 'não'}</div>
      </div>
    </details>

    <details class="diagnostic-details">
      <summary>Campos encontrados nas vendas</summary>
      <div class="storage-note">${report.saleFields.fields.join(', ') || 'nenhum'}</div>
    </details>

    <details class="diagnostic-details">
      <summary>Campos encontrados em pagamentos</summary>
      <div class="storage-note">${report.pagMetaFields.fields.join(', ') || 'nenhum'}</div>
    </details>

    <details class="diagnostic-details">
      <summary>Dados sensíveis detectados</summary>
      <div class="diagnostic-grid">
        <div><strong>Nomes:</strong> ${report.sensitive.names}</div>
        <div><strong>Telefones:</strong> ${report.sensitive.phones}</div>
        <div><strong>CPFs:</strong> ${report.sensitive.cpfs}</div>
      </div>
    </details>

    ${report.warnings.length ? `
      <details class="diagnostic-details" open>
        <summary>Alertas</summary>
        <div class="diagnostic-list">
          ${report.warnings.map((warning) => `<div class="diagnostic-warning">${warning}</div>`).join('')}
        </div>
      </details>
    ` : '<div class="diagnostic-ok">Backup real compatível para próximo bloco de importação controlada.</div>'}
  `;
}
