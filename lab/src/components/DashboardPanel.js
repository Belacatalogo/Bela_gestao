import { APP_CONFIG } from '../config/appConfig.js';
import { getDataGatewayStatus } from '../services/dataGateway.js';
import { getRealDataContractReport } from '../services/realDataContractService.js';
import { formatBRL } from '../utils/money.js';

export function renderDashboardPanel({ products, salesStats, paymentStats, catalogReport }) {
  const visibleProducts = products.filter((product) => product.visibleInCatalog).length;
  const noRealPhoto = products.filter((product) => String(product.imageUrl || '').startsWith('data:image/svg+xml')).length;
  const alerts = buildAlerts({ products, paymentStats, catalogReport, noRealPhoto });
  const realContractReport = getRealDataContractReport({
    appVersion: APP_CONFIG.version,
    environment: getDataGatewayStatus(),
  });

  return `
    <section class="panel-card dashboard-panel">
      <div class="panel-title-row">
        <div>
          <h2>Dashboard LAB</h2>
          <p>Resumo rápido de produtos, vendas, pagamentos e alertas do catálogo fictício.</p>
        </div>
        <span class="safe-pill">Resumo</span>
      </div>

      <div class="mini-grid four-stats">
        <div class="mini-stat"><strong>${formatBRL(salesStats.totalSold)}</strong><span>vendido</span></div>
        <div class="mini-stat"><strong>${formatBRL(salesStats.totalProfit)}</strong><span>lucro</span></div>
        <div class="mini-stat"><strong>${formatBRL(paymentStats.paidAmount)}</strong><span>recebido</span></div>
        <div class="mini-stat"><strong>${formatBRL(paymentStats.pendingAmount)}</strong><span>pendente</span></div>
      </div>

      <div class="mini-grid four-stats">
        <div class="mini-stat"><strong>${products.length}</strong><span>produtos</span></div>
        <div class="mini-stat"><strong>${visibleProducts}</strong><span>publicados</span></div>
        <div class="mini-stat"><strong>${noRealPhoto}</strong><span>sem foto</span></div>
        <div class="mini-stat"><strong>${paymentStats.pendingCount}</strong><span>parcelas abertas</span></div>
      </div>

      <div class="dashboard-alerts">
        ${alerts.length ? alerts.map((alert) => `<div class="diagnostic-warning">${alert}</div>`).join('') : '<div class="diagnostic-ok">Nenhum alerta crítico no Dashboard LAB.</div>'}
      </div>
    </section>

    ${renderRealDataContractPanel(realContractReport)}
  `;
}

function renderRealDataContractPanel(report) {
  const status = report.compatibility || {};
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

function buildAlerts({ products, paymentStats, catalogReport, noRealPhoto }) {
  const alerts = [];

  if (!products.length) alerts.push('Nenhum produto LAB cadastrado.');
  if (paymentStats.pendingAmount > 0) alerts.push(`Há ${paymentStats.pendingCount} parcela(s) pendente(s), totalizando ${formatBRL(paymentStats.pendingAmount)}.`);
  if (noRealPhoto > 0) alerts.push(`${noRealPhoto} produto(s) ainda estão sem foto real.`);
  if (catalogReport.warningProducts > 0) alerts.push(`${catalogReport.warningProducts} produto(s) têm alerta no contrato do catálogo.`);

  return alerts;
}
