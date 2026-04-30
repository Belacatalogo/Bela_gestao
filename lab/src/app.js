import { APP_CONFIG, CRITICAL_FEATURES } from './config/appConfig.js';

function featureList() {
  return CRITICAL_FEATURES.map((feature) => `<li>${feature}</li>`).join('');
}

export function renderApp(root) {
  if (!root) return;

  root.innerHTML = `
    <main class="lab-page">
      <section class="hero-card" aria-labelledby="lab-title">
        <div class="eyebrow">Reconstrução modular</div>
        <h1 id="lab-title">Bela Gestão <span>LAB</span></h1>
        <p class="hero-text">
          Esta é a área segura de reconstrução. O sistema atual da raiz não foi substituído.
        </p>
        <div class="status-grid" aria-label="Status da versão">
          <div class="status-card">
            <strong>${APP_CONFIG.branch}</strong>
            <small>branch de trabalho</small>
          </div>
          <div class="status-card">
            <strong>${APP_CONFIG.version}</strong>
            <small>versão lab</small>
          </div>
          <div class="status-card">
            <strong>${APP_CONFIG.productionBranch}</strong>
            <small>produção protegida</small>
          </div>
        </div>
      </section>

      <section class="panel-card">
        <h2>Funções críticas preservadas</h2>
        <p>
          Nenhum módulo abaixo será removido sem auditoria e teste por bloco.
        </p>
        <ul class="feature-list">
          ${featureList()}
        </ul>
      </section>

      <section class="panel-card warning-card">
        <h2>Estado do BLOCO 1</h2>
        <p>
          Base modular inicial criada em <code>/lab</code>. Ainda não conecta Firebase,
          Catálogo, IA, produtos, vendas ou pagamentos. Essa tela existe apenas para validar
          que a branch lab carrega com segurança antes da reconstrução real.
        </p>
      </section>
    </main>
  `;
}
