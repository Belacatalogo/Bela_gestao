export function renderRealDataContractPanel({ report }) {
  const status = report?.compatibility || {};

  return `
    <section class="panel-card real-contract-panel">
      <div class="panel-title-row">
        <div>
          <h2>Contrato Real: JSON + Firebase</h2>
          <p>Mapeamento seguro das fontes reais antes de login, Firebase real e catálogo real.</p>
        </div>
        <span class="safe-pill">Somente leitura</span>
      </div>

      <div class="mini-grid four-stats">
        <div class="mini-stat"><strong>${status.manualJsonAlreadyAudited ? 'sim' : 'não'}</strong><span>JSON auditado</span></div>
        <div class="mini-stat"><strong>${status.manualJsonCanImportToLab ? 'sim' : 'não'}</strong><span>JSON no LAB</span></div>
        <div class="mini-stat"><strong>${status.firebaseReadConnected ? 'sim' : 'não'}</strong><span>Firebase leitura</span></div>
        <div class="mini-stat"><strong>${report.realWritesBlocked ? 'sim' : 'não'}</strong><span>escrita bloqueada</span></div>
      </div>

      <div class="storage-note">
        A conta Google da sua esposa fica para a versão final. Neste bloco, nada conecta ou escreve no Firebase real.
      </div>

      <details class="diagnostic-details" open>
        <summary>Fontes reais mapeadas</summary>
        <div class="diagnostic-table">
          ${report.sources.map((source) => `
            <div class="diagnostic-row">
              <span>${source.label}</span>
              <strong>${source.writeAllowedInLab ? 'escrita' : 'bloqueado'}</strong>
            </div>
          `).join('')}
        </div>
      </details>

      <details class="diagnostic-details">
        <summary>Backup final deve incluir tudo</summary>
        <div class="diagnostic-list">
          ${report.completeBackupRequirements.map((item) => `<div class="diagnostic-row"><span>${item}</span><strong>obrigatório</strong></div>`).join('')}
        </div>
      </details>

      <details class="diagnostic-details">
        <summary>Regras de segurança</summary>
        <div class="diagnostic-list">
          ${report.rules.map((rule) => `<div class="diagnostic-warning">${rule}</div>`).join('')}
        </div>
      </details>
    </section>
  `;
}
