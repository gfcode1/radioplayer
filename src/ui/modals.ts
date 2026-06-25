import { store } from '../state';

export function initModals(): void {
  /* shortcuts */
  document.getElementById('shortcutsBtn')?.addEventListener('click', toggleShortcuts);
  document.getElementById('closeShortcuts')?.addEventListener('click', toggleShortcuts);
  document.getElementById('shortcutsModal')?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) toggleShortcuts();
  });
  store.on('toggle-shortcuts', toggleShortcuts);

  /* offline */
  document.getElementById('retryBtn')?.addEventListener('click', () => location.reload());
  window.addEventListener('online', () => {
    document.getElementById('offlineOverlay')?.classList.remove('open');
  });
  window.addEventListener('offline', () => {
    document.getElementById('offlineOverlay')?.classList.add('open');
  });
  if (!navigator.onLine) {
    document.getElementById('offlineOverlay')?.classList.add('open');
  }
}

function toggleShortcuts(): void {
  document.getElementById('shortcutsModal')?.classList.toggle('open');
}
