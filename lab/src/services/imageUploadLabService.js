const MAX_IMAGE_SIZE_BYTES = 4 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Não foi possível ler a imagem.'));
    reader.readAsDataURL(file);
  });
}

export async function generateLabImageUrl(file) {
  if (!file) {
    return {
      ok: true,
      imageUrl: '',
      warning: null,
    };
  }

  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return {
      ok: false,
      imageUrl: '',
      error: 'Use uma imagem JPG, PNG, WEBP ou GIF.',
    };
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return {
      ok: false,
      imageUrl: '',
      error: 'A imagem é muito grande para o modo LAB. Use uma foto com até 4 MB.',
    };
  }

  try {
    const imageUrl = await readFileAsDataUrl(file);
    return {
      ok: true,
      imageUrl,
      warning: 'Imagem salva localmente no LAB. Ainda não foi enviada para serviço externo real.',
    };
  } catch (error) {
    return {
      ok: false,
      imageUrl: '',
      error: error.message || 'Não foi possível gerar a URL da imagem.',
    };
  }
}

export function isLabGeneratedImage(imageUrl) {
  return String(imageUrl || '').startsWith('data:image/') && !String(imageUrl || '').startsWith('data:image/svg+xml');
}
