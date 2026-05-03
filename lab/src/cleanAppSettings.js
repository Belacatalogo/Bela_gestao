import { renderCleanApp as renderProductsApp } from './cleanAppProducts.js';
import { APP_CONFIG } from './config/appConfig.js';
import { listProducts } from './services/dataGateway.js';
import { clearCloudinaryLabConfig, getCloudinaryLabConfig, saveCloudinaryLabConfig } from './services/cloudinaryLabService.js';
import { resolveGoogleRedirectLab, signInWithGoogleLab, signOutGoogleLab } from './services/firebaseAuthLabService.js';
import { clearGoogleLoginGateUser, getGoogleLoginGateState, markRealDataReadAttempt } from './services/googleLoginGateService.js';
import { clearCarouselSelection, clearGeminiLabKey, getCarouselSelection, getGeminiLabKeyInfo, getLabSettings, saveGeminiLabKey, saveLabSettings, simulatePriceSync, testGeminiLabKey, toggleCarouselProduct } from './services/settingsLabService.js';

function esc(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function renderGoogleLoginPanel() {
  const state = getGoogleLoginGateState();
  return `
    <section class="legacy-settings-section real-login-section">
      <h3>Login Google — dados reais</h3>
      <div class="legacy-settings-card google-login-card ${state.isSignedIn ? 'signed' : 'locked'}">
        <h4>🔐 Entrar com a conta da Yasmin</h4>
        <p>Os dados reais da sua esposa só devem aparecer depois do login Google na conta dela. Antes disso, o sistema continua usando apenas dados LAB/offline.</p>
        <div class="real-login-status ${state.isSignedIn ? 'ok' : 'locked'}" data-google-login-status>
          ${state.isSignedIn
            ? `✓ Login ativo: ${esc(state.displayName || state.email)} · modo leitura seguro`
            : 'Dados reais bloqueados. Faça login Google para liberar leitura segura.'}
        </div>
        ${state.isSignedIn ? `
          <div class="real-user-card">
            ${state.photoURL ? `<img src="${esc(state.photoURL)}" alt="Foto do perfil Google">` : '<span>G</span>'}
            <div><strong>${esc(state.displayName || 'Conta Google')}</strong><small>${esc(state.email)}</small></div>
          </div>
        ` : ''}
        <div class="legacy-settings-actions google-actions">
          ${state.isSignedIn
            ? '<button class="secondary-button" type="button" data-read-real-data>Verificar dados reais</button><button class="danger-button" type="button" data-google-logout>Sair</button>'
            : '<button class="primary-button" type="button" data-google-login>Entrar com Google</button>'}
        </div>
        <div class="real-login-note" data-real-data-note>
          ${state.isSignedIn
            ? 'Próximo passo: leitura controlada do Firebase real. Nenhuma escrita real automática está liberada.'
            : 'Importante: os dados reais não serão misturados com dados LAB.'}
        </div>
      </div>
    </section>
  `;
}

function renderCloudinaryPanel() {
  const config = getCloudinaryLabConfig();
  return `
    <section class="legacy-settings-section">
      <h3>☁ Upload de fotos — Cloudinary</h3>
      <div class="legacy-settings-card">
        <h4>Configurar Upload Automático</h4>
        <p>Ao escolher uma foto em Novo Produto, o app envia para o Cloudinary e preenche a URL automaticamente. Fotos existentes não são afetadas.</p>
        <form class="legacy-settings-form" data-cloudinary-settings-form>
          <label><span>Cloud name</span><input name="cloudName" value="${esc(config.cloudName)}" placeholder="dolxxic7t"></label>
          <label><span>Upload preset unsigned</span><input name="uploadPreset" value="${esc(config.uploadPreset)}" placeholder="bela_upload"></label>
          <label><span>Pasta</span><input name="folder" value="${esc(config.folder)}" placeholder="bela-gestao-lab"></label>
          <div class="legacy-settings-actions"><button class="primary-button" type="submit">💾 Salvar</button><button class="secondary-button" type="button" data-test-cloudinary>🔍 Testar</button><button class="danger-button" type="button" data-clear-cloudinary>×</button></div>
        </form>
        <div class="legacy-settings-status ${config.configured ? 'ok' : 'warn'}" data-cloudinary-status>${config.configured ? '✓ Configurado — upload automático ativo' : 'Cloudinary não configurado — upload automático bloqueado'}</div>
      </div>
    </section>
  `;
}

function renderGeminiPanel() {
  const keyInfo = getGeminiLabKeyInfo();
  return `
    <section class="legacy-settings-section">
      <h3>IA — análise de foto</h3>
      <div class="legacy-settings-card">
        <h4>🔑 Chave da API Gemini (Google)</h4>
        <p>Cole aqui sua chave para preparar a análise automática de fotos. A chave fica salva só no seu celular/LAB e ainda não vai para GitHub ou internet.</p>
        <form class="legacy-settings-form" data-gemini-settings-form>
          <label><span>Chave Gemini</span><input name="geminiKey" type="password" placeholder="••••••••••••••••••••" value=""></label>
          <div class="legacy-settings-actions"><button class="primary-button" type="submit">💾 Salvar chave</button><button class="secondary-button" type="button" data-test-gemini>🔍 Testar</button><button class="danger-button" type="button" data-clear-gemini>×</button></div>
        </form>
        <div class="legacy-settings-status ${keyInfo.configured ? 'ok' : 'warn'}" data-gemini-status>${keyInfo.configured ? `✓ Chave salva — ${esc(keyInfo.masked)}` : 'Chave Gemini ainda não configurada'}</div>
      </div>
    </section>
  `;
}

function renderCatalogSettingsPanel(products) {
  const settings = getLabSettings();
  return `
    <section class="legacy-settings-section">
      <h3>Configurações do catálogo</h3>
      <div class="legacy-settings-card">
        <h4>💰 Mostrar preços no catálogo</h4>
        <p>Quando ativado, os preços aparecem nos produtos do catálogo para as clientes. Quando desativado, aparece “Consulte”.</p>
        <div class="catalog-price-row"><strong>${settings.showCatalogPrices ? '✓ Preços visíveis' : 'Preços ocultos'}</strong><button class="danger-button wide" type="button" data-toggle-catalog-prices>${settings.showCatalogPrices ? 'Ocultar preços' : 'Mostrar preços'}</button></div>
      </div>
      <div class="legacy-settings-card">
        <h4>🔄 Sincronizar preços com o catálogo</h4>
        <p>Envia para o catálogo os preços que você já cadastrou nos produtos do Gestão. Neste LAB, é só simulação segura.</p>
        <button class="primary-button full" type="button" data-sync-prices-lab>Sincronizar preços em modo LAB</button>
        <div class="legacy-settings-status warn" data-sync-status>${settings.lastPriceSyncAt ? `Última simulação: ${new Date(settings.lastPriceSyncAt).toLocaleString('pt-BR')}` : `${products.length} produto(s) disponíveis para simulação`}</div>
      </div>
    </section>
  `;
}

function renderCarouselPanel(products) {
  const selection = getCarouselSelection();
  const visible = products.filter((product) => product.imageUrl && !String(product.imageUrl).startsWith('data:image/svg+xml'));
  return `
    <section class="legacy-settings-section">
      <h3>Carrossel da coleção</h3>
      <div class="legacy-settings-card">
        <h4>✦ Produtos em destaque no carrossel</h4>
        <p>Escolha quais produtos aparecem no carrossel principal da aba Coleção do catálogo. Ideal: entre 3 e 8 produtos com fotos bonitas.</p>
        <div class="carousel-counter"><strong>${selection.length} selecionado(s)</strong><button class="danger-button" type="button" data-clear-carousel>Limpar seleção</button></div>
        <div class="carousel-product-list">
          ${visible.length ? visible.map((product, index) => {
            const selected = selection.includes(product.id);
            return `
              <button class="carousel-product-row ${selected ? 'selected' : ''}" type="button" data-carousel-product="${esc(product.id)}">
                <img src="${esc(product.imageUrl)}" alt="${esc(product.name)}">
                <span><strong>${esc(product.name)}</strong><small>${esc(product.brand || product.category || '')}</small></span>
                <em>${selected ? '✓' : index + 1}</em>
              </button>
            `;
          }).join('') : '<div class="settings-empty">Nenhum produto com foto real para carrossel.</div>'}
        </div>
        <button class="primary-button full" type="button" data-save-carousel-lab>+ Salvar carrossel no catálogo LAB</button>
      </div>
    </section>
  `;
}

function renderBackupToolsNotice() {
  return `
    <details class="legacy-lab-tools">
      <summary><span>Ferramentas LAB / Migração</span><strong>Recolhido</strong></summary>
      <p>Backup LAB, migração offline, auditoria e mapa técnico continuam disponíveis abaixo na estrutura antiga da LAB.</p>
    </details>
  `;
}

function renderSettingsTab(root) {
  const { products } = listProducts();
  const page = document.createElement('section');
  page.className = 'clean-section legacy-settings-page';
  page.innerHTML = `
    <div class="clean-section-title"><span>Backup</span><h2>Configurações</h2></div>
    ${renderGoogleLoginPanel()}
    ${renderCloudinaryPanel()}
    ${renderGeminiPanel()}
    ${renderCatalogSettingsPanel(products)}
    ${renderCarouselPanel(products)}
    ${renderBackupToolsNotice()}
  `;

  const main = root.querySelector('.clean-page');
  if (!main) return;
  const currentContent = [...main.children].filter((child) => !child.classList.contains('clean-hero') && !child.classList.contains('clean-tab-nav') && !child.classList.contains('clean-notice'));
  currentContent.forEach((child) => child.remove());
  main.appendChild(page);
}

function syncSettingsActiveTab(root) {
  root.querySelectorAll('[data-clean-tab]').forEach((button) => {
    button.classList.toggle('active', button.getAttribute('data-clean-tab') === 'ajustes');
  });
}

function rerenderSettings(root) {
  renderSettingsTab(root);
  syncSettingsActiveTab(root);
  bindSettings(root);
}

function bindSettings(root) {
  root.querySelector('[data-clean-tab="ajustes"]')?.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();
    window.localStorage.setItem('belaGestaoLab.cleanTab', 'ajustes');
    renderProductsApp(root);
    enhanceSettings(root);
  });

  root.querySelector('[data-google-login]')?.addEventListener('click', async () => {
    const status = root.querySelector('[data-google-login-status]');
    if (status) status.textContent = 'Abrindo login Google...';
    const result = await signInWithGoogleLab();
    if (!result.ok) {
      if (status) {
        status.className = 'real-login-status locked';
        status.textContent = result.error || 'Falha ao entrar com Google.';
      }
      return;
    }
    if (!result.redirectStarted) rerenderSettings(root);
  });

  root.querySelector('[data-google-logout]')?.addEventListener('click', async () => {
    await signOutGoogleLab().catch(() => null);
    clearGoogleLoginGateUser();
    rerenderSettings(root);
  });

  root.querySelector('[data-read-real-data]')?.addEventListener('click', () => {
    markRealDataReadAttempt();
    const note = root.querySelector('[data-real-data-note]');
    if (note) note.textContent = 'Login confirmado. Próximo bloco fará leitura controlada do Firebase real, ainda sem escrita automática.';
  });

  root.querySelector('[data-cloudinary-settings-form]')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const result = saveCloudinaryLabConfig({ cloudName: data.get('cloudName'), uploadPreset: data.get('uploadPreset'), folder: data.get('folder') });
    const status = root.querySelector('[data-cloudinary-status]');
    if (status) {
      status.className = `legacy-settings-status ${result.ok && result.config.configured ? 'ok' : 'warn'}`;
      status.textContent = result.ok && result.config.configured ? '✓ Configurado — upload automático ativo' : (result.error || 'Preencha Cloud name e Upload preset unsigned');
    }
  });

  root.querySelector('[data-test-cloudinary]')?.addEventListener('click', () => {
    const config = getCloudinaryLabConfig();
    const status = root.querySelector('[data-cloudinary-status]');
    if (status) {
      status.className = `legacy-settings-status ${config.configured ? 'ok' : 'warn'}`;
      status.textContent = config.configured ? '✓ Configuração encontrada. Teste real ocorre ao escolher uma foto no Novo Produto.' : 'Preencha Cloud name e Upload preset unsigned.';
    }
  });

  root.querySelector('[data-clear-cloudinary]')?.addEventListener('click', () => {
    clearCloudinaryLabConfig();
    rerenderSettings(root);
  });

  root.querySelector('[data-gemini-settings-form]')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const result = saveGeminiLabKey(data.get('geminiKey'));
    const status = root.querySelector('[data-gemini-status]');
    if (status) {
      status.className = `legacy-settings-status ${result.ok ? 'ok' : 'warn'}`;
      status.textContent = result.ok ? `✓ Chave salva — ${result.keyInfo.masked}` : result.error;
    }
  });

  root.querySelector('[data-test-gemini]')?.addEventListener('click', () => {
    const result = testGeminiLabKey();
    const status = root.querySelector('[data-gemini-status]');
    if (status) {
      status.className = `legacy-settings-status ${result.ok ? 'ok' : 'warn'}`;
      status.textContent = result.message;
    }
  });

  root.querySelector('[data-clear-gemini]')?.addEventListener('click', () => {
    clearGeminiLabKey();
    rerenderSettings(root);
  });

  root.querySelector('[data-toggle-catalog-prices]')?.addEventListener('click', () => {
    const settings = getLabSettings();
    saveLabSettings({ showCatalogPrices: !settings.showCatalogPrices });
    rerenderSettings(root);
  });

  root.querySelector('[data-sync-prices-lab]')?.addEventListener('click', () => {
    const { products } = listProducts();
    const result = simulatePriceSync(products);
    const status = root.querySelector('[data-sync-status]');
    if (status) {
      status.className = 'legacy-settings-status ok';
      status.textContent = result.message;
    }
  });

  root.querySelectorAll('[data-carousel-product]').forEach((button) => button.addEventListener('click', () => {
    toggleCarouselProduct(button.getAttribute('data-carousel-product'));
    rerenderSettings(root);
  }));

  root.querySelector('[data-clear-carousel]')?.addEventListener('click', () => {
    clearCarouselSelection();
    rerenderSettings(root);
  });

  root.querySelector('[data-save-carousel-lab]')?.addEventListener('click', () => {
    const counter = root.querySelector('.carousel-counter strong');
    const status = document.createElement('div');
    status.className = 'legacy-settings-status ok';
    status.textContent = 'Carrossel salvo em modo LAB. Catálogo real não foi alterado.';
    counter?.closest('.legacy-settings-card')?.appendChild(status);
  });
}

async function enhanceSettings(root) {
  await resolveGoogleRedirectLab().catch(() => null);
  const activeTab = window.localStorage.getItem('belaGestaoLab.cleanTab');
  if (activeTab === 'ajustes') {
    renderSettingsTab(root);
    syncSettingsActiveTab(root);
  }
  bindSettings(root);
}

export function renderCleanApp(root) {
  renderProductsApp(root);
  if (!root) return;
  root.setAttribute('data-bela-version', APP_CONFIG.version);
  enhanceSettings(root);
}
