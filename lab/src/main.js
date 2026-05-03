import { renderCleanApp } from './cleanAppRtdbExport.js';

const root = document.getElementById('app');

renderCleanApp(root);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('./sw.js')
      .catch((error) => {
        console.warn('[Bela Gestão LAB] Service worker não registrado:', error);
      });
  });
}
