const MAX_INPUT_IMAGE_SIZE_BYTES = 8 * 1024 * 1024;
const MAX_OUTPUT_SIDE = 900;
const JPEG_QUALITY = 0.72;
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

function loadImage(dataUrl) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Não foi possível carregar a imagem escolhida.'));
    image.src = dataUrl;
  });
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Não foi possível ler a imagem.'));
    reader.readAsDataURL(file);
  });
}

function getResizeSize(width, height) {
  const longestSide = Math.max(width, height);
  if (longestSide <= MAX_OUTPUT_SIDE) return { width, height };

  const scale = MAX_OUTPUT_SIDE / longestSide;
  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
  };
}

async function compressImageFile(file) {
  const originalDataUrl = await readFileAsDataUrl(file);
  const image = await loadImage(originalDataUrl);
  const size = getResizeSize(image.naturalWidth || image.width, image.naturalHeight || image.height);

  const canvas = document.createElement('canvas');
  canvas.width = size.width;
  canvas.height = size.height;

  const context = canvas.getContext('2d', { alpha: false });
  if (!context) return originalDataUrl;

  context.fillStyle = '#080808';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  return canvas.toDataURL('image/jpeg', JPEG_QUALITY);
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

  if (file.size > MAX_INPUT_IMAGE_SIZE_BYTES) {
    return {
      ok: false,
      imageUrl: '',
      error: 'A imagem é muito grande para o modo LAB. Use uma foto com até 8 MB.',
    };
  }

  try {
    const imageUrl = await compressImageFile(file);
    return {
      ok: true,
      imageUrl,
      warning: 'Imagem comprimida e salva localmente no LAB. Ainda não foi enviada para serviço externo real.',
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
