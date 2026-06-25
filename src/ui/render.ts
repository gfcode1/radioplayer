import type { Station } from '../types';
import { store } from '../state';
import { escHtml, escAttr } from '../utils/dom';
import { playStation } from '../audio';

export function renderStationList(
  stations: Station[],
  container: HTMLElement,
  emptyMsg = 'Nessuna stazione trovata',
): void {
  if (!stations || stations.length === 0) {
    container.innerHTML = `<div class="empty-state"><div class="icon">📻</div><p>${emptyMsg}</p></div>`;
    return;
  }

  let html = '<div class="station-list" role="list">';
  stations.forEach((s, i) => {
    const isPlaying = store.currentStation?.stationuuid === s.stationuuid;
    const isFav = store.isFavorite(s.stationuuid);
    const faviconHtml = s.favicon
      ? `<img class="station-favicon" src="${escHtml(s.favicon)}" alt="">`
      : '📻';
    html += `
      <div class="station-card${isPlaying ? ' playing' : ''}" data-index="${i}" role="listitem" tabindex="0" aria-label="${escAttr(s.name)}${s.country ? ', ' + escAttr(s.country) : ''}">
        <div class="sc-favicon" aria-hidden="true">${faviconHtml}</div>
        <div class="sc-info">
          <div class="sc-name">${escHtml(s.name)}</div>
          <div class="sc-meta">
            <span>${escHtml(s.country || '')}</span>
            <span>${escHtml(s.language || '')}</span>
            <span>${escHtml(s.codec || '')}${s.bitrate ? ' ' + s.bitrate + 'k' : ''}</span>
          </div>
        </div>
        <div class="sc-actions">
          <button class="sc-action${isFav ? ' fav-active' : ''}" data-fav="${s.stationuuid}" aria-label="${isFav ? 'Rimuovi dai preferiti' : 'Aggiungi ai preferiti'}">
            ${isFav ? '♥' : '♡'}
          </button>
        </div>
      </div>`;
  });
  html += '</div>';

  if (store.totalPages > 1) {
    const isFirstPage = store.page === 0;
    const isLastPage = store.currentList.length < store.pageSize;
    const pageInfo = store.totalPages === Infinity
      ? `PAG ${store.page + 1}`
      : `PAG ${store.page + 1} / ${store.totalPages}`;
    html += `
      <div class="pagination" role="navigation" aria-label="Paginazione">
        <button class="page-btn" id="pagePrev"${isFirstPage ? ' disabled' : ''} aria-label="Pagina precedente">◀ PREV</button>
        <span class="page-info" aria-live="polite">${pageInfo}</span>
        <button class="page-btn" id="pageNext"${isLastPage ? ' disabled' : ''} aria-label="Pagina successiva">NEXT ▶</button>
      </div>`;
  }

  container.innerHTML = html;

  /* attach events */
  container.querySelectorAll('.station-card').forEach((card) => {
    const handleActivation = () => {
      const idx = parseInt((card as HTMLElement).dataset.index ?? '0', 10);
      playStation(store.currentList[idx], undefined, idx);
    };
    card.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (target.closest('.sc-action')) return;
      handleActivation();
    });
    card.addEventListener('keydown', (e) => {
      const ke = e as KeyboardEvent;
      if (ke.key === 'Enter' || ke.key === ' ') {
        const target = ke.target as HTMLElement;
        if (target.closest('.sc-action')) return;
        ke.preventDefault();
        handleActivation();
      }
    });
  });

  container.querySelectorAll('[data-fav]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const uuid = (btn as HTMLElement).dataset.fav!;
      store.toggleFavorite(uuid);
    });
  });

  const prev = container.querySelector('#pagePrev');
  const next = container.querySelector('#pageNext');
  prev?.addEventListener('click', () => store.emit('page-prev'));
  next?.addEventListener('click', () => store.emit('page-next'));
}
