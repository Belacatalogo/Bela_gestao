import { renderCleanApp as renderPlacementApp } from './cleanAppPlacement.js';
import { APP_CONFIG } from './config/appConfig.js';
import { buildClientInsights, filterClientInsights } from './services/clientInsightsService.js';
import { syncPaymentsFromSales } from './services/labPaymentsService.js';
import { getLabSales } from './services/labSalesService.js';
import { formatBRL } from './utils/money.js';

const CLIENT_STATE = {
  query: '',
  mode: 'todas',
  sort: 'az',
  selectedClientId: '',
};

function esc(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function getClientData() {
  const sales = getLabSales();
  const payments = syncPaymentsFromSales(sales);
  return buildClientInsights({ sales, payments });
}

function clientBadge(client) {
  if (client.pendingCount > 0) return `<span class="client-badge pending">${client.pendingCount} pendente${client.pendingCount > 1 ? 's' : ''}</span>`;
  if (client.paidCount > 0) return `<span class="client-badge paid">${client.paidCount} quitado${client.paidCount > 1 ? 's' : ''}</span>`;
  return '<span class="client-badge neutral">sem compras</span>';
}

function renderClientMetrics(stats) {
  return `
    <div class="clients-dashboard">
      <article><strong>${stats.totalClients}</strong><span>Clientes</span></article>
      <article><strong>${stats.pendingClients}</strong><span>Pendentes</span></article>
      <article><strong>${stats.vipClients}</strong><span>VIP</span></article>
      <article><strong>${stats.missingClients}</strong><span>Sumidas</span></article>
      <article><strong>${stats.birthdayClients}</strong><span>Aniv.</span></article>
    </div>
  `;
}

function renderTopClients(topClients) {
  const medals = ['🥇', '🥈', '🥉', '4º', '5º'];
  return `
    <section class="clients-top-card">
      <header><span>✦ Top 5 compradoras</span></header>
      ${topClients.length ? topClients.map((client, index) => `
        <button class="top-client-row" data-client-profile="${esc(client.id)}">
          <span class="top-medal">${medals[index]}</span>
          <strong>${esc(client.name)}</strong>
          <small>${formatBRL(client.totalSpent)} · ${client.purchases}x</small>
        </button>
      `).join('') : '<div class="clients-empty-mini">Nenhuma compradora ainda</div>'}
    </section>
  `;
}

function renderClientFilters() {
  const modes = [
    ['todas', 'Todas'],
    ['pendente', 'Pendente'],
    ['quitadas', 'Quitadas'],
    ['vip', 'VIP'],
    ['fiel', 'Fiel'],
  ];
  const sorts = [
    ['az', 'A-Z'],
    ['mais-gasto', 'Mais gasto'],
    ['mais-compras', 'Mais compras'],
    ['recentes', 'Recentes'],
    ['avaliacao', 'Avaliação'],
  ];

  return `
    <div class="client-chip-row primary">
      ${modes.map(([id, label]) => `<button class="client-chip ${CLIENT_STATE.mode === id ? 'active' : ''}" data-client-mode="${id}">${label}</button>`).join('')}
    </div>
    <div class="client-sort-row"><span>Ordenar</span>${sorts.map(([id, label]) => `<button class="client-sort ${CLIENT_STATE.sort === id ? 'active' : ''}" data-client-sort="${id}">${label}</button>`).join('')}</div>
    <div class="client-search-wrap"><input data-client-query value="${esc(CLIENT_STATE.query)}" placeholder="🔍 Buscar compradora..."></div>
  `;
}

function renderClientCard(client) {
  return `
    <article class="client-card" data-client-profile="${esc(client.id)}">
      <div class="client-avatar">${esc(client.initials)}</div>
      <div class="client-info">
        <h3>${esc(client.name)}</h3>
        ${client.phone ? `<p>☏ ${esc(client.phone)}</p>` : ''}
        <p>✦ ${esc(client.favoriteProduct?.name || 'Sem produto favorito')}</p>
        <p>${formatBRL(client.totalSpent)} · ${client.purchases} compra${client.purchases === 1 ? '' : 's'}</p>
        <div class="client-badge-row">${clientBadge(client)}${client.vip ? '<span class="client-badge vip">VIP</span>' : ''}${client.loyal ? '<span class="client-badge loyal">Fiel</span>' : ''}</div>
      </div>
    </article>
  `;
}

function renderClientProfile(client) {
  if (!client) return '';
  const history = client.sales.slice(0, 6);
  return `
    <div class="client-profile-overlay" data-close-client-profile>
      <section class="client-profile-sheet" role="dialog" aria-modal="true" aria-label="Perfil da cliente" onclick="event.stopPropagation()">
        <div class="client-profile-handle"></div>
        <header class="client-profile-header">
          <div class="client-avatar large">${esc(client.initials)}</div>
          <div><h2>${esc(client.name)}</h2>${client.phone ? `<p>${esc(client.phone)}</p>` : ''}</div>
        </header>
        <div class="client-profile-metrics">
          <article><strong>${client.purchases}</strong><span>Compras</span></article>
          <article><strong>${formatBRL(client.totalSpent)}</strong><span>Total gasto</span></article>
          <article><strong>${formatBRL(client.ticketAverage)}</strong><span>Ticket médio</span></article>
          <article><strong>${formatBRL(client.pendingAmount)}</strong><span>Pendente</span></article>
        </div>
        <section class="client-profile-section">
          <h4>✦ Perfil & insights</h4>
          <div class="client-rating">☆☆☆☆☆</div>
          ${client.favoriteProduct ? `<div class="client-insight-card"><strong>${esc(client.favoriteProduct.name)}</strong><span>Produto mais comprado · ${client.favoriteProduct.count}x</span></div>` : ''}
        </section>
        <section class="client-profile-section">
          <h4>Histórico</h4>
          ${history.length ? history.map((sale) => `
            <article class="client-history-row">
              <div><strong>${esc(sale.productName)}</strong><span>${esc(sale.productBrand || sale.productSnapshot?.brand || '')}</span></div>
              <small>${formatBRL(sale.total)} · ${sale.status === 'pago' ? 'Quitado' : 'Pendente'}</small>
            </article>
          `).join('') : '<p>Nenhum histórico.</p>'}
        </section>
        <div class="client-profile-actions"><button class="secondary-button">Editar perfil</button><button class="ghost-button" data-close-client-profile>Fechar</button></div>
      </section>
    </div>
  `;
}

function renderClientsTab(root) {
  const data = getClientData();
  const clients = filterClientInsights(data.clients, CLIENT_STATE);
  const selectedClient = data.clients.find((client) => client.id === CLIENT_STATE.selectedClientId);

  const page = document.createElement('section');
  page.className = 'clean-section clients-page';
  page.innerHTML = `
    <div class="clean-section-title"><span>Clientes</span><h2>Compradoras</h2></div>
    ${renderClientMetrics(data.stats)}
    ${renderTopClients(data.topClients)}
    ${renderClientFilters()}
    <div class="client-count-line">${clients.length} compradora${clients.length === 1 ? '' : 's'}</div>
    <div class="client-list">${clients.length ? clients.map(renderClientCard).join('') : '<div class="clients-empty">Nenhuma cliente encontrada.</div>'}</div>
    ${renderClientProfile(selectedClient)}
  `;

  const main = root.querySelector('.clean-page');
  if (!main) return;
  const currentContent = [...main.children].filter((child) => !child.classList.contains('clean-hero') && !child.classList.contains('clean-tab-nav') && !child.classList.contains('clean-notice'));
  currentContent.forEach((child) => child.remove());
  main.appendChild(page);
}

function ensureClientsTab(root) {
  const nav = root.querySelector('.clean-tab-nav');
  if (!nav || nav.querySelector('[data-clean-tab="clientes"]')) return;
  const firstButton = nav.querySelector('[data-clean-tab]');
  const clientButton = document.createElement('button');
  clientButton.className = 'clean-tab-btn';
  clientButton.setAttribute('data-clean-tab', 'clientes');
  clientButton.innerHTML = 'Clientes<small>Compradoras e histórico</small>';
  nav.insertBefore(clientButton, firstButton);
}

function syncClientActiveTab(root) {
  root.querySelectorAll('[data-clean-tab]').forEach((button) => {
    button.classList.toggle('active', button.getAttribute('data-clean-tab') === 'clientes');
  });
}

function bindClients(root) {
  root.querySelector('[data-clean-tab="clientes"]')?.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();
    window.localStorage.setItem('belaGestaoLab.cleanTab', 'clientes');
    renderPlacementApp(root);
    enhanceClients(root);
  });

  root.querySelectorAll('[data-client-mode]').forEach((button) => button.addEventListener('click', () => {
    CLIENT_STATE.mode = button.getAttribute('data-client-mode') || 'todas';
    renderClientsTab(root);
    syncClientActiveTab(root);
    bindClients(root);
  }));

  root.querySelectorAll('[data-client-sort]').forEach((button) => button.addEventListener('click', () => {
    CLIENT_STATE.sort = button.getAttribute('data-client-sort') || 'az';
    renderClientsTab(root);
    syncClientActiveTab(root);
    bindClients(root);
  }));

  const queryInput = root.querySelector('[data-client-query]');
  queryInput?.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      CLIENT_STATE.query = queryInput.value || '';
      renderClientsTab(root);
      syncClientActiveTab(root);
      bindClients(root);
    }
  });
  queryInput?.addEventListener('change', () => {
    CLIENT_STATE.query = queryInput.value || '';
    renderClientsTab(root);
    syncClientActiveTab(root);
    bindClients(root);
  });

  root.querySelectorAll('[data-client-profile]').forEach((element) => element.addEventListener('click', () => {
    CLIENT_STATE.selectedClientId = element.getAttribute('data-client-profile') || '';
    renderClientsTab(root);
    syncClientActiveTab(root);
    bindClients(root);
  }));

  root.querySelectorAll('[data-close-client-profile]').forEach((element) => element.addEventListener('click', () => {
    CLIENT_STATE.selectedClientId = '';
    renderClientsTab(root);
    syncClientActiveTab(root);
    bindClients(root);
  }));
}

function enhanceClients(root) {
  ensureClientsTab(root);
  const activeTab = window.localStorage.getItem('belaGestaoLab.cleanTab');
  if (activeTab === 'clientes') {
    renderClientsTab(root);
    syncClientActiveTab(root);
  }
  bindClients(root);
}

export function renderCleanApp(root) {
  renderPlacementApp(root);
  if (!root) return;
  root.setAttribute('data-bela-version', APP_CONFIG.version);
  enhanceClients(root);
}
