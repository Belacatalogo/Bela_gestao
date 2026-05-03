import { renderCleanApp as renderHistoryApp } from './cleanAppHistory.js';
import { APP_CONFIG } from './config/appConfig.js';
import { getFunctionPlacementGroups, getFunctionPlacementSummary } from './services/functionPlacementService.js';

function esc(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function placementStatusLabel(status) {
  return ({
    'no-lugar': 'No lugar',
    'no-lugar-lab': 'No lugar LAB',
    parcial: 'Parcial',
    pendente: 'Pendente',
    bloqueado: 'Bloqueado',
    lab: 'Ferramenta LAB',
  }[status] || status);
}

function createPlacementReviewCard() {
  const summary = getFunctionPlacementSummary();
  const groups = getFunctionPlacementGroups();
  const card = document.createElement('div');
  card.className = 'clean-card placement-review-card';
  card.innerHTML = `
    <h3>Conferência das funções nos lugares corretos</h3>
    <p>Mapa de organização da interface final. As funções de uso diário ficam nas abas principais; ferramentas de migração ficam em Ajustes/LAB.</p>
    <div class="clean-metric-grid compact">
      <article class="clean-metric"><strong>${summary.total}</strong><span>Funções</span></article>
      <article class="clean-metric"><strong>${(summary['no-lugar'] || 0) + (summary['no-lugar-lab'] || 0)}</strong><span>No lugar</span></article>
      <article class="clean-metric"><strong>${(summary.pendente || 0) + (summary.parcial || 0)}</strong><span>Ajustar</span></article>
    </div>
    <div class="placement-group-list">
      ${groups.map((group) => `
        <details class="placement-group-card" ${group.dailyUse ? 'open' : ''}>
          <summary>
            <span>${esc(group.section)}</span>
            <strong>${group.dailyUse ? 'Uso diário' : 'LAB/Admin'}</strong>
          </summary>
          <p>${esc(group.description)}</p>
          <div class="placement-item-list">
            ${group.items.map((item) => `
              <div class="placement-item">
                <div>
                  <strong>${esc(item.name)}</strong>
                  <small>${esc(item.target)}</small>
                </div>
                <span class="placement-status ${esc(item.status)}">${placementStatusLabel(item.status)}</span>
              </div>
            `).join('')}
          </div>
        </details>
      `).join('')}
    </div>
  `;
  return card;
}

function organizeSettingsLabTools(root) {
  const settingsSection = [...root.querySelectorAll('.clean-section')]
    .find((section) => section.textContent.includes('Backup, segurança e histórico'));

  if (!settingsSection) return;

  const sectionTitle = settingsSection.querySelector('.clean-section-title');
  if (sectionTitle) {
    sectionTitle.innerHTML = '<span>Ajustes</span><h2>Funções e ferramentas</h2>';
  }

  const cards = [...settingsSection.querySelectorAll(':scope > .clean-card')];
  const backupCard = cards.find((card) => card.textContent.includes('Backup LAB'));
  const auditCard = cards.find((card) => card.textContent.includes('Auditoria de histórico'));
  const migrationCard = cards.find((card) => card.textContent.includes('Migração offline do sistema antigo'));
  const mapCard = cards.find((card) => card.textContent.includes('Mapa real de funções antigas'));
  const featureCard = cards.find((card) => card.textContent.includes('Funções finais que precisam continuar'));

  const placementCard = createPlacementReviewCard();
  if (sectionTitle?.nextSibling) {
    settingsSection.insertBefore(placementCard, sectionTitle.nextSibling);
  } else {
    settingsSection.appendChild(placementCard);
  }

  const labDetails = document.createElement('details');
  labDetails.className = 'clean-card lab-tools-details';
  labDetails.innerHTML = `
    <summary><span>Ferramentas LAB / Migração</span><strong>Recolhido</strong></summary>
    <p>Área técnica para backup, auditoria e migração. No produto final da sua esposa, isso deve ficar protegido ou oculto.</p>
  `;

  [backupCard, auditCard, migrationCard, mapCard].forEach((card) => {
    if (card) labDetails.appendChild(card);
  });

  if (featureCard) {
    settingsSection.insertBefore(labDetails, featureCard);
  } else {
    settingsSection.appendChild(labDetails);
  }
}

function addPlacementBadges(root) {
  const tabHints = {
    produtos: 'Produto, foto, IA e catálogo',
    vendas: 'Cliente, valor e histórico',
    pagamentos: 'Parcelas, cobrança e WhatsApp',
    catalogo: 'Preview e publicação',
    ajustes: 'Organização e LAB',
  };

  root.querySelectorAll('[data-clean-tab]').forEach((button) => {
    const id = button.getAttribute('data-clean-tab');
    const hint = tabHints[id];
    if (!hint || button.querySelector('small')) return;
    const small = document.createElement('small');
    small.textContent = hint;
    button.appendChild(small);
  });
}

export function renderCleanApp(root) {
  renderHistoryApp(root);
  if (!root) return;
  root.setAttribute('data-bela-version', APP_CONFIG.version);
  organizeSettingsLabTools(root);
  addPlacementBadges(root);
}
