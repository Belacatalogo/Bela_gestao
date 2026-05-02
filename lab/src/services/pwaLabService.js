const LAB_CACHE_PREFIX = 'bela-gestao-lab-';

export async function getPwaLabStatus() {
  const hasServiceWorker = 'serviceWorker' in navigator;
  const hasCache = 'caches' in window;
  const registration = hasServiceWorker ? await navigator.serviceWorker.getRegistration('./') : null;
  const keys = hasCache ? await caches.keys() : [];
  const labCaches = keys.filter((key) => key.startsWith(LAB_CACHE_PREFIX));

  return {
    hasServiceWorker,
    hasCache,
    controlled: Boolean(navigator.serviceWorker?.controller),
    registered: Boolean(registration),
    scope: registration?.scope || '',
    activeScript: registration?.active?.scriptURL || '',
    waiting: Boolean(registration?.waiting),
    installing: Boolean(registration?.installing),
    labCaches,
  };
}

export async function checkPwaLabUpdate() {
  if (!('serviceWorker' in navigator)) {
    return {
      ok: false,
      message: 'Service Worker indisponível neste navegador.',
    };
  }

  const registration = await navigator.serviceWorker.getRegistration('./');
  if (!registration) {
    return {
      ok: false,
      message: 'Nenhum Service Worker LAB registrado ainda.',
    };
  }

  await registration.update();

  return {
    ok: true,
    message: registration.waiting
      ? 'Atualização encontrada. Recarregue o app.'
      : 'Verificação concluída. Nenhuma atualização pendente detectada.',
  };
}

export async function clearPwaLabCaches() {
  if (!('caches' in window)) {
    return {
      ok: false,
      removed: [],
      message: 'Cache API indisponível neste navegador.',
    };
  }

  const keys = await caches.keys();
  const labKeys = keys.filter((key) => key.startsWith(LAB_CACHE_PREFIX));
  await Promise.all(labKeys.map((key) => caches.delete(key)));

  return {
    ok: true,
    removed: labKeys,
    message: `${labKeys.length} cache(s) LAB removido(s).`,
  };
}

export function reloadPwaLab() {
  window.location.reload();
}
