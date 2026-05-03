import { renderCleanApp as renderReportApp } from './cleanAppReport.js';
import { APP_CONFIG } from './config/appConfig.js';
import { clearCloudinaryLabConfig, getCloudinaryLabConfig, saveCloudinaryLabConfig, uploadImageToCloudinaryLab } from './services/cloudinaryLabService.js';

function fillField(root, name, value) {
  const field = root.querySelector(`[name="${name}"]`);
  if (field && !field.value) field.value = value;
}

function setHidden(root, name, value) {
  const field = root.querySelector(`[name="${name}"]`);
  if (field) field.value = value;
}

function hasImageUrl(root) {
  return Boolean(root.querySelector('[data-product-image-url]')?.value?.trim());
}

function setUploadHint(root, message, tone = '') {
  const hint = root.querySelector('[data-cloudinary-upload-hint]');
  if (!hint) return;
  hint.textContent = message;
  hint.dataset.tone = tone;
}

function refreshAiLock(root) {
  const ready = hasImageUrl(root);
  const aiPanel = root.querySelector('[data-ai-panel]');
  const fillButton = root.querySelector('[data-ai-fill-product]');
  const photoButton = root.querySelector('[data-ai-photo-hint]');
  const hint = root.querySelector('[data-ai-product-hint]');

  aiPanel?.classList.toggle('ready', ready);
  aiPanel?.classList.toggle('locked', !ready);
  fillButton?.toggleAttribute('disabled', !ready);
  photoButton?.toggleAttribute('disabled', !ready);
  if (photoButton) photoButton.textContent = ready ? 'Analisar foto' : 'Aguardando URL';
  if (hint && !ready) hint.textContent = 'Escolha uma foto do celular. Após o upload automático no Cloudinary, a URL aparecerá aqui e a IA será liberada.';
  if (hint && ready) hint.textContent = 'URL pronta. A análise por IA poderá usar esta imagem.';
}

function bindCloudinaryUpload(root) {
  const fileInput = root.querySelector('[data-cloudinary-file-input]');
  const uploadButton = root.querySelector('[data-cloudinary-upload]');
  const urlInput = root.querySelector('[data-product-image-url]');

  async function uploadSelectedFile() {
    const file = fileInput?.files?.[0];
    if (!file) {
      setUploadHint(root, 'Selecione uma foto do celular antes de enviar ao Cloudinary.', 'error');
      return;
    }

    if (uploadButton) {
      uploadButton.disabled = true;
      uploadButton.textContent = 'Enviando...';
    }
    setUploadHint(root, 'Enviando foto ao Cloudinary...', 'loading');

    const result = await uploadImageToCloudinaryLab(file);

    if (uploadButton) {
      uploadButton.disabled = false;
      uploadButton.textContent = 'Enviar ao Cloudinary';
    }

    if (!result.ok) {
      setUploadHint(root, result.error || 'Não foi possível enviar a imagem.', 'error');
      refreshAiLock(root);
      return;
    }

    if (urlInput) {
      urlInput.value = result.imageUrl;
      urlInput.dispatchEvent(new Event('input', { bubbles: true }));
    }

    const preview = root.querySelector('[data-upload-status]');
    if (preview) {
      preview.outerHTML = `<div class="legacy-product-preview" data-upload-status><img src="${result.imageUrl}" alt="Prévia da imagem do produto"><span>URL pronta para IA</span></div>`;
    }

    setUploadHint(root, 'Upload concluído. URL preenchida automaticamente e IA liberada.', 'success');
    refreshAiLock(root);
  }

  fileInput?.addEventListener('change', uploadSelectedFile);
  uploadButton?.addEventListener('click', uploadSelectedFile);
  urlInput?.addEventListener('input', () => refreshAiLock(root));
  refreshAiLock(root);
}

function bindProductAi(root) {
  root.querySelector('[data-ai-fill-product]')?.addEventListener('click', () => {
    if (!hasImageUrl(root)) {
      const hint = root.querySelector('[data-ai-product-hint]');
      if (hint) hint.textContent = 'A IA só será liberada depois que a URL do Cloudinary aparecer.';
      return;
    }
    fillField(root, 'name', 'Produto sugerido pela IA LAB');
    fillField(root, 'brand', 'O Boticário');
    fillField(root, 'description', 'Descrição elegante gerada em modo LAB a partir da URL da foto. A IA real será conectada depois com segurança.');
    fillField(root, 'price', '99.90');
    setHidden(root, 'category', 'feminino');
    setHidden(root, 'catalogTabs', 'todos, coleção');
    const hint = root.querySelector('[data-ai-product-hint]');
    if (hint) hint.textContent = 'Sugestão LAB aplicada usando o fluxo correto: foto → Cloudinary → URL → IA.';
  });

  root.querySelector('[data-ai-photo-hint]')?.addEventListener('click', () => {
    const hint = root.querySelector('[data-ai-product-hint]');
    if (!hasImageUrl(root)) {
      if (hint) hint.textContent = 'A análise da foto está bloqueada até o Cloudinary preencher a URL.';
      return;
    }
    if (hint) hint.textContent = 'Análise de foto reservada para a integração real da IA. A URL já está pronta para ser enviada ao modelo.';
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
    small.textContent = 'Foto → URL → IA';
    productsButton.appendChild(small);
  }
}

function cloudinarySettingsCard() {
  const config = getCloudinaryLabConfig();
  return `
    <div class="clean-card cloudinary-settings-card" data-cloudinary-settings-card>
      <h3>Cloudinary — upload automático</h3>
      <p>Usado no Novo Produto: foto do celular → upload automático → URL preenchida → IA liberada. Configuração salva só neste LAB/localStorage.</p>
      <form class="cloudinary-settings-form" data-cloudinary-settings-form>
        <label><span>Cloud name</span><input name="cloudName" value="${config.cloudName}" placeholder="ex: sua-cloud"></label>
        <label><span>Upload preset unsigned</span><input name="uploadPreset" value="${config.uploadPreset}" placeholder="ex: bela_unsigned"></label>
        <label><span>Pasta</span><input name="folder" value="${config.folder}" placeholder="bela-gestao-lab"></label>
        <div class="cloudinary-settings-actions">
          <button class="primary-button" type="submit">Salvar Cloudinary</button>
          <button class="secondary-button" type="button" data-clear-cloudinary>Limpar</button>
        </div>
      </form>
      <div class="cloudinary-status ${config.configured ? 'ok' : 'warn'}" data-cloudinary-status>
        ${config.configured ? 'Cloudinary configurado. Upload automático liberado.' : 'Cloudinary ainda não configurado. Upload automático ficará bloqueado.'}
      </div>
    </div>
  `;
}

function enhanceCloudinarySettings(root) {
  const settingsSection = [...root.querySelectorAll('.clean-section')]
    .find((section) => section.textContent.includes('Funções e ferramentas') || section.textContent.includes('Backup, segurança'));
  if (!settingsSection || settingsSection.querySelector('[data-cloudinary-settings-card]')) return;

  const title = settingsSection.querySelector('.clean-section-title');
  if (title) title.insertAdjacentHTML('afterend', cloudinarySettingsCard());

  const form = settingsSection.querySelector('[data-cloudinary-settings-form]');
  form?.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const result = saveCloudinaryLabConfig({
      cloudName: data.get('cloudName'),
      uploadPreset: data.get('uploadPreset'),
      folder: data.get('folder'),
    });
    const status = settingsSection.querySelector('[data-cloudinary-status]');
    if (status) {
      status.className = `cloudinary-status ${result.ok && result.config.configured ? 'ok' : 'warn'}`;
      status.textContent = result.ok && result.config.configured
        ? 'Cloudinary configurado. Upload automático liberado.'
        : (result.error || 'Preencha Cloud name e Upload preset unsigned.');
    }
  });

  settingsSection.querySelector('[data-clear-cloudinary]')?.addEventListener('click', () => {
    clearCloudinaryLabConfig();
    const status = settingsSection.querySelector('[data-cloudinary-status]');
    if (status) {
      status.className = 'cloudinary-status warn';
      status.textContent = 'Cloudinary limpo. Upload automático bloqueado.';
    }
    form?.reset();
  });
}

function enhanceProducts(root) {
  enhanceProductLabels(root);
  enhanceCloudinarySettings(root);
  bindCloudinaryUpload(root);
  bindProductAi(root);
  bindProductChips(root);
}

export function renderCleanApp(root) {
  renderReportApp(root);
  if (!root) return;
  root.setAttribute('data-bela-version', APP_CONFIG.version);
  enhanceProducts(root);
}
