export function renderPwaStatusPanel({ pwaStatus }) {
  const status = pwaStatus || {
    hasServiceWorker: false,
    hasCache: false,
    controlled: false,
    registered: false,
    scope: '',
    activeScript: '',
    waiting: false,
    installing: false,
    labCaches: [],
  };

  return `
    <section class="panel-card pwa-panel">
      <div class="panel-title-row">
        <div>
          <h2>PWA e Cache LAB</h2>
          <p>Controle de atualização para evitar versão presa no iPhone.</p>
        </div>
        <span class="safe-pill">PWA</span>
      </div>

      <div class="mini-grid four-stats">
        <div class="mini-stat"><strong>${status.registered ? 'sim' : 'não'}</strong><span>registrado</span></div>
        <div class="mini-stat"><strong>${status.controlled ? 'sim' : 'não'}</strong><span>controlando</span></div>
        <div class="mini-stat"><strong>${status.labCaches.length}</strong><span>caches LAB</span></div>
        <div class="mini-stat"><strong>${status.waiting ? 'sim' : 'não'}</strong><span>update</span></div>
      </div>

      <div class="lab-actions three-actions">
        <button class="secondary-button" data-pwa-check-update>Verificar atualização</button>
        <button class="secondary-button" data-pwa-clear-cache>Limpar cache LAB</button>
        <button class="secondary-button" data-pwa-reload>Recarregar app</button>
      </div>

      <details class="diagnostic-details">
        <summary>Detalhes PWA</summary>
        <div class="diagnostic-grid">
          <div><strong>Service Worker:</strong> ${status.hasServiceWorker ? 'disponível' : 'indisponível'}</div>
          <div><strong>Cache API:</strong> ${status.hasCache ? 'disponível' : 'indisponível'}</div>
          <div><strong>Escopo:</strong> ${status.scope || 'não registrado'}</div>
          <div><strong>Script ativo:</strong> ${status.activeScript || 'nenhum'}</div>
          <div><strong>Instalando:</strong> ${status.installing ? 'sim' : 'não'}</div>
          <div><strong>Aguardando:</strong> ${status.waiting ? 'sim' : 'não'}</div>
        </div>
      </details>

      ${status.labCaches.length ? `
        <details class="diagnostic-details">
          <summary>Caches LAB encontrados</summary>
          <div class="diagnostic-table">
            ${status.labCaches.map((cacheKey) => `<div class="diagnostic-row"><span>${cacheKey}</span><strong>LAB</strong></div>`).join('')}
          </div>
        </details>
      ` : '<div class="diagnostic-ok">Nenhum cache LAB antigo listado agora.</div>'}
    </section>
  `;
}
