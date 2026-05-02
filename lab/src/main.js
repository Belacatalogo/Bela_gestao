import { renderApp } from './app.js';

const root = document.getElementById('app');

renderApp(root);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('./sw.js')
      .catch((error) => {
        console.warn('[Bela Gestão LAB] Service worker não registrado:', error);
      });
  });
}
