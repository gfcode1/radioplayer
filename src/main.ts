import { store } from './state';
import { initHeader } from './ui/header';
import { initSidebar } from './ui/sidebar';
import { initSearch, loadSection } from './ui/search';
import { initEq } from './ui/eq';
import { initMap } from './ui/map';
import { initModals } from './ui/modals';
import { initVuMeter } from './ui/vu';
import { initExportImport } from './ui/export';
import { initShortcuts } from './utils/shortcuts';
import { installFaviconFallback } from './utils/dom';

/* ── styles ───────────────────────────────────────────────── */
import './styles/variables.css';
import './styles/base.css';
import './styles/layout.css';
import './styles/header.css';
import './styles/nowplaying.css';
import './styles/transport.css';
import './styles/stations.css';
import './styles/search.css';
import './styles/eq.css';
import './styles/map.css';
import './styles/toast.css';
import './styles/modals.css';
import './styles/responsive.css';

/* ── init ─────────────────────────────────────────────────── */
function init(): void {
  installFaviconFallback();
  store.load();
  initHeader();
  initSidebar();
  initSearch();
  initEq();
  initMap();
  initModals();
  initVuMeter();
  initExportImport();
  initShortcuts();
  loadSection();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
