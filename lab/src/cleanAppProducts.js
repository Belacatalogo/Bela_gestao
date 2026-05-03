import { renderCleanApp as renderReportApp } from './cleanAppReport.js';
import { APP_CONFIG } from './config/appConfig.js';

function fillField(root, name, value) {
  const field = root.querySelector(`[name="${name}"]`);
  if (field && !field.value) field.value = value;
}

function setHidden(root, name, value) {
  const field = root.querySelector(`[name="${name}"]`);
  if (field) field.value = value;
}

function bindProductAi(root) {
  root.querySelector('[data-ai-fill-product]')?.addEventListener('click', () => {
    fillField(root, 'name', 'Produto sugerido pela IA LAB');
    fillField(root, 'brand', 'O Boticário');
    fillField(root, 'description', 'Descrição elegante gerada em modo LAB. A IA real será conectada depois com segurança.');
    fillField(root, 'price', '99.90');
    setHidden(root, 'category', 'feminino');
    setHidden(root, 'catalogTabs', 'todos, coleção');
    const hint = root.querySelector('[data-ai-product-hint]');
    if (hint) hint.textContent = 'Sugestão LAB aplicada: revise os campos antes de salvar. A IA real ainda está bloqueada.';
  });

  root.querySelector('[data-ai-photo-hint]')?.addEventListener('click', () => {
    const hint = root.querySelector('[data-ai-product-hint]');
    if (hint) hint.textContent = 'Análise de foto reservada para a integração real da IA. No LAB, use Preencher com IA LAB para testar o fluxo.';
  });
}

function bindProductChips(root) {
  root.querySelectorAll('[data-chip-group]').forEach((group) => {
    const input = group.querySelector('input[type="hidden"]');
    const multi = group.getAttribute('data-chip-multi') === 'true';
    group.querySelectorAll('[data-chip-value]').forEach((button) => button.addEventListener('click', () => {
      const value = button.getAttribute('data-chip-value') || '';
      if (!input) return;

      if (!multi) {
        group.querySelectorAll('[data-chip-value]').forEach((item) => item.classList.remove('active'));
        button.classList.add('active');
        input.value = value;
        return;
      }

      button.classList.toggle('active');
      const selected = [...group.querySelectorAll('[data-chip-value].active')]
        .map((item) => item.getAttribute('data-chip-value'))
        .filter(Boolean);
      input.value = selected.join(', ');
    }));
  });
}

function enhanceProductLabels(root) {
  const productsButton = root.querySelector('[data-clean-tab="produtos"]');
  if (productsButton && !productsButton.querySelector('small')) {
    const small = document.createElement('small');
    small.textContent = 'Novo produto + IA';
    productsButton.appendChild(small);
  }
}

function enhanceProducts(root) {
  enhanceProductLabels(root);
  bindProductAi(root);
  bindProductChips(root);
}

export function renderCleanApp(root) {
  renderReportApp(root);
  if (!root) return;
  root.setAttribute('data-bela-version', APP_CONFIG.version);
  enhanceProducts(root);
}
