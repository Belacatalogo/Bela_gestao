import { APP_CONFIG } from '../config/appConfig.js';
import { getAiFunctionsMapReport } from '../services/aiFunctionsMapService.js';
import { getCatalogUploadMapReport } from '../services/catalogUploadMapService.js';
import { getDataGatewayStatus } from '../services/dataGateway.js';
import { getFirebaseReadinessReport } from '../services/firebaseReadinessService.js';
import { getRealDataContractReport } from '../services/realDataContractService.js';
import { getSourceCompatibilityReport } from '../services/sourceCompatibilityService.js';
import { formatBRL } from '../utils/money.js';

export function renderDashboardPanel({ products, salesStats, paymentStats, catalogReport }) {
  const visibleProducts = products.filter((product) => product.visibleInCatalog).length;
  const noRealPhoto = products.filter((product) => String(product.imageUrl || '').startsWith('data:image/svg+xml')).length;
  const alerts = buildAlerts({ products, paymentStats, catalogReport, noRealPhoto });
  const realContractReport = getRealDataContractReport({ appVersion: APP_CONFIG.version, environment: getDataGatewayStatus() });
  const firebaseReport = getFirebaseReadinessReport();
  const compatibilityReport = getSourceCompatibilityReport();
  const catalogUploadReport = getCatalogUploadMapReport();
  const aiReport = getAiFunctionsMapReport();

  return `
    <section class="panel-card dashboard-panel">
      <div class="panel-title-row"><div><h2>Dashboard LAB</h2><p>Resumo rápido de produtos, vendas, pagamentos e alertas do catálogo fictício.</p></div><span class="safe-pill">Resumo</span></div>
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
      <div class="dashboard-alerts">${alerts.length ? alerts.map((alert) => `<div class="diagnostic-warning">${alert}</div>`).join('') : '<div class="diagnostic-ok">Nenhum alerta crítico no Dashboard LAB.</div>'}</div>
    </section>
    ${renderRealDataContractPanel(realContractReport)}
    ${renderFirebaseReadinessPanel(firebaseReport)}
    ${renderSourceCompatibilityPanel(compatibilityReport)}
    ${renderCatalogUploadMapPanel(catalogUploadReport)}
    ${renderAiFunctionsMapPanel(aiReport)}
  `;
}

function renderRealDataContractPanel(report) {
  const status = report.compatibility || {};
  return `
    <section class="panel-card real-contract-panel">
      <div class="panel-title-row"><div><h2>Contrato Real: JSON + Firebase</h2><p>Mapeamento seguro das fontes reais antes de login, Firebase real e catálogo real.</p></div><span class="safe-pill">Somente leitura</span></div>
      <div class="mini-grid four-stats"><div class="mini-stat"><strong>${status.manualJsonAlreadyAudited ? 'sim' : 'não'}</strong><span>JSON auditado</span></div><div class="mini-stat"><strong>${status.manualJsonCanImportToLab ? 'sim' : 'não'}</strong><span>JSON no LAB</span></div><div class="mini-stat"><strong>${status.firebaseReadConnected ? 'sim' : 'não'}</strong><span>Firebase leitura</span></div><div class="mini-stat"><strong>${report.realWritesBlocked ? 'sim' : 'não'}</strong><span>escrita bloqueada</span></div></div>
      <div class="storage-note">A conta Google da sua esposa fica para a versão final. Neste bloco, nada conecta ou escreve no Firebase real.</div>
      <details class="diagnostic-details" open><summary>Fontes reais mapeadas</summary><div class="diagnostic-table">${report.sources.map((source) => `<div class="diagnostic-row"><span>${source.label}</span><strong>${source.writeAllowedInLab ? 'escrita' : 'bloqueado'}</strong></div>`).join('')}</div></details>
      <details class="diagnostic-details"><summary>Backup final deve incluir tudo</summary><div class="diagnostic-list">${report.completeBackupRequirements.map((item) => `<div class="diagnostic-row"><span>${item}</span><strong>obrigatório</strong></div>`).join('')}</div></details>
      <details class="diagnostic-details"><summary>Regras de segurança</summary><div class="diagnostic-list">${report.rules.map((rule) => `<div class="diagnostic-warning">${rule}</div>`).join('')}</div></details>
    </section>`;
}

function renderFirebaseReadinessPanel(report) {
  return `
    <section class="panel-card firebase-readiness-panel">
      <div class="panel-title-row"><div><h2>Firebase Readiness LAB</h2><p>Preparação para leitura real futura, sem login e sem credenciais neste bloco.</p></div><span class="safe-pill">Bloqueado</span></div>
      <div class="mini-grid four-stats"><div class="mini-stat"><strong>${report.firebaseConnected ? 'sim' : 'não'}</strong><span>Firebase</span></div><div class="mini-stat"><strong>${report.authConnected ? 'sim' : 'não'}</strong><span>Google Auth</span></div><div class="mini-stat"><strong>${report.firestoreConnected ? 'sim' : 'não'}</strong><span>Firestore</span></div><div class="mini-stat"><strong>${report.realWritesBlocked ? 'sim' : 'não'}</strong><span>escrita bloqueada</span></div></div>
      <div class="storage-note">Nenhuma chave Firebase foi adicionada ao repositório. A leitura real será feita em bloco futuro, primeiro em modo somente leitura.</div>
      <details class="diagnostic-details" open><summary>Campos de configuração necessários</summary><div class="diagnostic-list">${report.requiredConfigFields.map((field) => `<div class="diagnostic-row"><span>${field}</span><strong>necessário</strong></div>`).join('')}</div></details>
      <details class="diagnostic-details"><summary>Áreas de dados que o Firebase precisa cobrir</summary><div class="diagnostic-list">${report.requiredDataAreas.map((area) => `<div class="diagnostic-row"><span>${area}</span><strong>mapear</strong></div>`).join('')}</div></details>
      <details class="diagnostic-details"><summary>Ações reais bloqueadas no LAB</summary><div class="diagnostic-list">${report.blockedActions.map((action) => `<div class="diagnostic-warning">${action}</div>`).join('')}</div></details>
    </section>`;
}

function renderSourceCompatibilityPanel(report) {
  return `
    <section class="panel-card source-compat-panel">
      <div class="panel-title-row"><div><h2>Comparador JSON x Firebase</h2><p>Matriz do que o backup manual já cobre e do que ainda precisa vir do Firebase/catálogo real.</p></div><span class="safe-pill">Matriz</span></div>
      <div class="mini-grid four-stats"><div class="mini-stat"><strong>${report.counts.areas}</strong><span>áreas</span></div><div class="mini-stat"><strong>${report.counts.jsonCovered}</strong><span>JSON cobre</span></div><div class="mini-stat"><strong>${report.counts.jsonPartial}</strong><span>parcial</span></div><div class="mini-stat"><strong>${report.counts.jsonNotCovered}</strong><span>faltando</span></div></div>
      <details class="diagnostic-details" open><summary>Matriz de compatibilidade</summary><div class="diagnostic-table">${report.rows.map((row) => `<div class="diagnostic-row"><span>${row.area}<br><small>${row.note}</small></span><strong>JSON: ${labelStatus(row.jsonManual)} · LAB: ${row.labStatus}</strong></div>`).join('')}</div></details>
      <details class="diagnostic-details"><summary>Bloqueios antes do Firebase real</summary><div class="diagnostic-list">${report.blockersBeforeRealFirebase.map((item) => `<div class="diagnostic-warning">${item}</div>`).join('')}</div></details>
    </section>`;
}

function renderCatalogUploadMapPanel(report) {
  return `
    <section class="panel-card catalog-upload-map-panel">
      <div class="panel-title-row"><div><h2>Mapa Catálogo Real + Upload/URL</h2><p>Mapeia fotos, URLs, categorias e abas reais antes de qualquer integração.</p></div><span class="safe-pill">Mapeamento</span></div>
      <div class="mini-grid four-stats"><div class="mini-stat"><strong>${report.realCatalogConnected ? 'sim' : 'não'}</strong><span>catálogo real</span></div><div class="mini-stat"><strong>${report.realUploadConnected ? 'sim' : 'não'}</strong><span>upload real</span></div><div class="mini-stat"><strong>${report.fields.length}</strong><span>campos</span></div><div class="mini-stat"><strong>${report.realWritesBlocked ? 'sim' : 'não'}</strong><span>escrita bloqueada</span></div></div>
      <div class="storage-note">Este bloco só mapeia. Não envia foto, não troca URL e não publica produto real.</div>
      <details class="diagnostic-details" open><summary>Campos reais do catálogo</summary><div class="diagnostic-table">${report.fields.map((field) => `<div class="diagnostic-row"><span>${field.label}<br><small>${field.source}</small></span><strong>${field.labStatus}</strong></div>`).join('')}</div></details>
      <details class="diagnostic-details"><summary>Fluxo esperado de upload/URL automática</summary><div class="diagnostic-list">${report.uploadUrlSteps.map((step) => `<div class="diagnostic-row"><span>${step}</span><strong>planejado</strong></div>`).join('')}</div></details>
      <details class="diagnostic-details"><summary>Ações reais bloqueadas</summary><div class="diagnostic-list">${report.blockedRealActions.map((action) => `<div class="diagnostic-warning">${action}</div>`).join('')}</div></details>
      <details class="diagnostic-details"><summary>Próximos requisitos</summary><div class="diagnostic-list">${report.nextRequirements.map((item) => `<div class="diagnostic-row"><span>${item}</span><strong>pendente</strong></div>`).join('')}</div></details>
    </section>`;
}

function renderAiFunctionsMapPanel(report) {
  return `
    <section class="panel-card ai-functions-map-panel">
      <div class="panel-title-row"><div><h2>Mapa das Funções de IA</h2><p>Inventário seguro das funções de IA antes de conectar qualquer API real.</p></div><span class="safe-pill">Sem chave</span></div>
      <div class="mini-grid four-stats"><div class="mini-stat"><strong>${report.functions.length}</strong><span>funções</span></div><div class="mini-stat"><strong>${report.aiApiConnected ? 'sim' : 'não'}</strong><span>API real</span></div><div class="mini-stat"><strong>${report.keysStoredInRepo ? 'sim' : 'não'}</strong><span>chave repo</span></div><div class="mini-stat"><strong>${report.backupMustIncludeAiConfig ? 'sim' : 'não'}</strong><span>backup IA</span></div></div>
      <div class="storage-note">Este bloco só mapeia. Não chama IA externa e não salva chave sensível.</div>
      <details class="diagnostic-details" open><summary>Funções de IA mapeadas</summary><div class="diagnostic-table">${report.functions.map((fn) => `<div class="diagnostic-row"><span>${fn.label}<br><small>${fn.purpose}</small></span><strong>${fn.status}</strong></div>`).join('')}</div></details>
      <details class="diagnostic-details"><summary>O backup final deve guardar da IA</summary><div class="diagnostic-list">${report.backupRequirements.map((item) => `<div class="diagnostic-row"><span>${item}</span><strong>permitido</strong></div>`).join('')}</div></details>
      <details class="diagnostic-details"><summary>Nunca salvar publicamente</summary><div class="diagnostic-list">${report.neverStorePublicly.map((item) => `<div class="diagnostic-warning">${item}</div>`).join('')}</div></details>
      <details class="diagnostic-details"><summary>Regras de segurança da IA</summary><div class="diagnostic-list">${report.safetyRules.map((item) => `<div class="diagnostic-warning">${item}</div>`).join('')}</div></details>
    </section>`;
}

function labelStatus(status) {
  const labels = { coberto: 'coberto', parcial: 'parcial', 'nao-coberto': 'não cobre', desconhecido: 'desconhecido', manual: 'manual' };
  return labels[status] || status;
}

function buildAlerts({ products, paymentStats, catalogReport, noRealPhoto }) {
  const alerts = [];
  if (!products.length) alerts.push('Nenhum produto LAB cadastrado.');
  if (paymentStats.pendingAmount > 0) alerts.push(`Há ${paymentStats.pendingCount} parcela(s) pendente(s), totalizando ${formatBRL(paymentStats.pendingAmount)}.`);
  if (noRealPhoto > 0) alerts.push(`${noRealPhoto} produto(s) ainda estão sem foto real.`);
  if (catalogReport.warningProducts > 0) alerts.push(`${catalogReport.warningProducts} produto(s) têm alerta no contrato do catálogo.`);
  return alerts;
}
