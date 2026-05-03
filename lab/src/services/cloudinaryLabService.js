const CLOUDINARY_CONFIG_KEY = 'belaGestaoLab.cloudinaryConfig.v1';

function safeParse(value, fallback = null) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function normalizeText(value) {
  return String(value || '').trim();
}

function canUseStorage() {
  try {
    const testKey = 'belaGestaoLab.cloudinaryStorageTest';
    window.localStorage.setItem(testKey, '1');
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

export function getCloudinaryLabConfig() {
  if (!canUseStorage()) {
    return {
      cloudName: '',
      uploadPreset: '',
      folder: 'bela-gestao-lab',
      configured: false,
    };
  }

  const config = safeParse(window.localStorage.getItem(CLOUDINARY_CONFIG_KEY), {}) || {};
  const cloudName = normalizeText(config.cloudName);
  const uploadPreset = normalizeText(config.uploadPreset);
  const folder = normalizeText(config.folder) || 'bela-gestao-lab';

  return {
    cloudName,
    uploadPreset,
    folder,
    configured: Boolean(cloudName && uploadPreset),
  };
}

export function saveCloudinaryLabConfig(config = {}) {
  if (!canUseStorage()) {
    return {
      ok: false,
      error: 'localStorage indisponível neste navegador.',
    };
  }

  const nextConfig = {
    cloudName: normalizeText(config.cloudName),
    uploadPreset: normalizeText(config.uploadPreset),
    folder: normalizeText(config.folder) || 'bela-gestao-lab',
    savedAt: new Date().toISOString(),
  };

  window.localStorage.setItem(CLOUDINARY_CONFIG_KEY, JSON.stringify(nextConfig));

  return {
    ok: true,
    config: getCloudinaryLabConfig(),
  };
}

export function clearCloudinaryLabConfig() {
  if (!canUseStorage()) return false;
  window.localStorage.removeItem(CLOUDINARY_CONFIG_KEY);
  return true;
}

export async function uploadImageToCloudinaryLab(file) {
  if (!file) {
    return {
      ok: false,
      error: 'Selecione uma imagem antes de enviar.',
    };
  }

  const config = getCloudinaryLabConfig();
  if (!config.configured) {
    return {
      ok: false,
      needsConfig: true,
      error: 'Cloudinary ainda não configurado. Configure Cloud name e Upload preset em Ajustes antes do upload automático.',
    };
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', config.uploadPreset);
  if (config.folder) formData.append('folder', config.folder);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(config.cloudName)}/image/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    return {
      ok: false,
      error: 'Cloudinary recusou o upload. Confira Cloud name e Upload preset unsigned.',
    };
  }

  const payload = await response.json();
  const imageUrl = payload.secure_url || payload.url || '';

  if (!imageUrl) {
    return {
      ok: false,
      error: 'Upload enviado, mas o Cloudinary não retornou URL da imagem.',
    };
  }

  return {
    ok: true,
    imageUrl,
    payload,
  };
}
