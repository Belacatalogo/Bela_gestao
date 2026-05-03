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

function setUploadPreview(root, html) {
  const preview = root.querySelector('[data-upload-status]');
  if (preview) preview.outerHTML = html;
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
  if (hint && !ready) hint.textContent = 'Escolha uma foto do celular. O upload começa automaticamente; quando a URL aparecer, a IA será liberada.';
  if (hint && ready) hint.textContent = 'URL pronta. A análise por IA poderá usar esta imagem.';
}

async function uploadSelectedFile(root, file) {
  const chooseLabel = root.querySelector('.legacy-file-button');
  const urlInput = root.querySelector('[data-product-image-url]');

  if (!file) {
    setUploadHint(root, 'Selecione uma foto do celular para iniciar o upload automático.', 'error');
    return;
  }

  if (chooseLabel) {
    chooseLabel.setAttribute('aria-busy', 'true');
    chooseLabel.classList.add('is-uploading');
  }

  setUploadHint(root, 'Enviando ao Cloudinary... não feche esta tela.', 'loading');
  setUploadPreview(root, '<div class="legacy-uploading-preview" data-upload-status><span class="upload-spinner"></span><strong>Enviando ao Cloudinary...</strong><small>A URL será preenchida automaticamente.</small></div>');

  const result = await uploadImageToCloudinaryLab(file);

  if (chooseLabel) {
    chooseLabel.removeAttribute('aria-busy');
    chooseLabel.classList.remove('is-uploading');
  }

  if (!result.ok) {
    setUploadHint(root, result.error || 'Não foi possível enviar a imagem.', 'error');
    setUploadPreview(root, '<div class="legacy-no-photo" data-upload-status>Upload não concluído</div>');
    refreshAiLock(root);
    return;
  }

  if (urlInput) {
    urlInput.value = result.imageUrl;
    urlInput.dispatchEvent(new Event('input', { bubbles: true }));
  }

  setUploadPreview(root, `<div class="legacy-product-preview" data-upload-status><img src="${result.imageUrl}" alt="Prévia da imagem do produto"><span>URL pronta para IA</span></div>`);
  setUploadHint(root, 'Upload concluído. URL preenchida automaticamente e IA liberada.', 'success');
  refreshAiLock(root);
}

function bindDelegatedProductEvents(root) {
  if (root.dataset.productsDelegated === 'true') return;
  root.dataset.productsDelegated = 'true';

  root.addEventListener('change', (event) => {
    const target = event.target;
    if (target?.matches?.('[data-cloudinary-file-input]')) {
      uploadSelectedFile(root, target.files?.[0]);
      return;
    }

    if (target?.matches?.('[data-product-image-url]')) {
      refreshAiLock(root);
    }
  });

  root.addEventListener('input', (event) => {
    if (event.target?.matches?.('[data-product-image-url]')) refreshAiLock(root);
  });

  root.addEventListener('click', (event) => {
    const chip = event.target?.closest?.('[data-chip-value]');
    if (chip) {
      const group = chip.closest('[data-chip-group]');
      const input = group?.querySelector('input[type="hidden"]');
      const multi = group?.getAttribute('data-chip-multi') === 'true';
      const value = chip.getAttribute('data-chip-value') || '';
      if (!group || !input) return;

      if (!multi) {
        group.querySelectorAll('[data-chip-value]').forEach((item) => item.classList.remove('active'));
        chip.classList.add('active');
        input.value = value;
      } else {
        chip.classList.toggle('active');
        input.value = [...group.querySelectorAll('[data-chip-value].active')]
          .map((item) => item.getAttribute('data-chip-value'))
          .filter(Boolean)
          .join(', ');
      }
      return;
    }

    if (event.target?.closest?.('[data-ai-fill-product]')) {
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
      return;
    }

    if (event.target?.closest?.('[data-ai-photo-hint]')) {
      const hint = root.querySelector('[data-ai-product-hint]');
      if (!hasImageUrl(root)) {
        if (hint) hint.textContent = 'A análise da foto está bloqueada até o Cloudinary preencher a URL.';
        return;
      }
      if (hint) hint.textContent = 'Análise de foto reservada para a integração real da IA. A URL já está pronta para ser enviada ao modelo.';
    }
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
  bindDelegatedProductEvents(root);
  refreshAiLock(root);
}

export function renderCleanApp(root) {
  renderReportApp(root);
  if (!root) return;
  root.setAttribute('data-bela-version', APP_CONFIG.version);
  enhanceProducts(root);
}
