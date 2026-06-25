import { store } from '../state';
import {
  searchStations,
  getCountries,
  getLanguages,
  getTags,
  getTopStations,
  getFavoriteStations,
  getStationsByUuids,
} from '../api';
import { escHtml, escAttr } from '../utils/dom';
import { renderStationList } from './render';
import { playStation } from '../audio';
import { toast } from './toast';
import type { Country, Language, Tag } from '../types';

let cachedCountries: Country[] | null = null;
let cachedLanguages: Language[] | null = null;
let cachedTags: Tag[] | null = null;
let sectionRequestId = 0;

export function initSearch(): void {
  store.on('section-changed', loadSection);
  store.on('favorites-changed', () => {
    if (store.section === 'favorites') loadSection();
  });
  store.on('page-prev', () => {
    if (store.page > 0) {
      store.page--;
      loadSection();
    }
  });
  store.on('page-next', () => {
    if (store.currentList.length >= store.pageSize) {
      store.page++;
      loadSection();
    }
  });
}

export async function loadSection(): Promise<void> {
  const content = document.getElementById('content')!;
  const requestId = ++sectionRequestId;

  const isStale = () => requestId !== sectionRequestId;

  switch (store.section) {
    case 'search':
      renderSearchView(content);
      break;
    case 'countries':
      if (!cachedCountries) {
        content.innerHTML = '<div class="loading">Caricamento paesi</div>';
        cachedCountries = await getCountries();
      }
      if (isStale()) return;
      renderItemList(cachedCountries, 'country', content);
      break;
    case 'languages':
      if (!cachedLanguages) {
        content.innerHTML = '<div class="loading">Caricamento lingue</div>';
        cachedLanguages = await getLanguages();
      }
      if (isStale()) return;
      renderItemList(cachedLanguages, 'language', content);
      break;
    case 'tags':
      if (!cachedTags) {
        content.innerHTML = '<div class="loading">Caricamento generi</div>';
        cachedTags = await getTags();
      }
      if (isStale()) return;
      renderItemList(cachedTags, 'tag', content);
      break;
    case 'top':
      content.innerHTML = '<div class="loading">Caricamento top stazioni</div>';
      try {
        const top = await getTopStations(50);
        if (isStale()) return;
        store.currentList = top;
        store.totalPages = 1;
        renderStationList(top, content);
      } catch {
        if (isStale()) return;
        content.innerHTML = '<div class="empty-state"><p>Errore nel caricamento</p></div>';
      }
      break;
    case 'favorites':
      content.innerHTML = '<div class="loading">Caricamento preferiti</div>';
      try {
        const favs = await getFavoriteStations();
        if (isStale()) return;
        store.currentList = favs;
        store.totalPages = 1;
        renderStationList(favs, content, 'Nessun preferito. Clicca ♡ per aggiungere.');
      } catch {
        if (isStale()) return;
        content.innerHTML = '<div class="empty-state"><p>Errore nel caricamento</p></div>';
      }
      break;
    case 'history': {
      if (store.history.length === 0) {
        renderStationList([], content, 'Nessuna cronologia.');
        break;
      }
      content.innerHTML = '<div class="loading">Caricamento cronologia</div>';
      const uuids = store.history.map((h) => h.uuid);
      const histStations = await getStationsByUuids(uuids);
      if (isStale()) return;
      store.currentList = histStations;
      store.totalPages = 1;
      renderStationList(histStations, content, 'Nessuna cronologia.');
      break;
    }
    case 'eq':
      store.emit('render-eq');
      break;
  }
}

function renderSearchView(content: HTMLElement): void {
  let html = '';

  /* EQ toggle */
  html += `
    <div class="eq-toggle-wrap">
      <button class="chip eq-toggle-btn" id="eqToggle">🎛 EQUALIZER</button>
    </div>
    <div class="eq-panel" id="eqPanelInline"></div>`;

  /* Search bar */
  html += `
    <div class="search-bar">
      <input class="search-input" type="text" id="searchInput" placeholder="Cerca stazione..." aria-label="Cerca stazione radio" value="${escAttr(store.searchQuery)}">
      <button class="search-btn" id="searchBtn" aria-label="Cerca">CERCA</button>
    </div>`;

  /* Filters */
  if (store.filters.country || store.filters.language || store.filters.tag) {
    html += '<div class="filter-chips" role="group" aria-label="Filtri attivi">';
    if (store.filters.country)
      html += `<span class="chip active" data-clear="country" role="button" tabindex="0" aria-label="Rimuovi filtro paese: ${escAttr(store.filters.country)}">🌍 ${escHtml(store.filters.country)} ✕</span>`;
    if (store.filters.language)
      html += `<span class="chip active" data-clear="language" role="button" tabindex="0" aria-label="Rimuovi filtro lingua: ${escAttr(store.filters.language)}">🗣 ${escHtml(store.filters.language)} ✕</span>`;
    if (store.filters.tag)
      html += `<span class="chip active" data-clear="tag" role="button" tabindex="0" aria-label="Rimuovi filtro genere: ${escAttr(store.filters.tag)}">🏷 ${escHtml(store.filters.tag)} ✕</span>`;
    html += '</div>';
  }

  html += '<div id="searchResults"><div class="loading">Caricamento</div></div>';
  content.innerHTML = html;

  /* events */
  const searchInput = document.getElementById('searchInput') as HTMLInputElement;
  const searchBtn = document.getElementById('searchBtn')!;
  searchBtn.addEventListener('click', () => {
    store.searchQuery = searchInput.value.trim();
    store.page = 0;
    loadSearchResults();
  });
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      store.searchQuery = searchInput.value.trim();
      store.page = 0;
      loadSearchResults();
    }
  });

  document.getElementById('eqToggle')?.addEventListener('click', () => {
    document.getElementById('eqPanelInline')?.classList.toggle('open');
    store.emit('render-eq-inline');
  });

  content.querySelectorAll('[data-clear]').forEach((chip) => {
    const handleClear = () => {
      const key = (chip as HTMLElement).dataset.clear as keyof typeof store.filters;
      store.filters[key] = '';
      if (key === 'country') store.filters.countrycode = '';
      store.page = 0;
      loadSection();
    };
    chip.addEventListener('click', handleClear);
    chip.addEventListener('keydown', (e) => {
      const ke = e as KeyboardEvent;
      if (ke.key === 'Enter' || ke.key === ' ') {
        ke.preventDefault();
        handleClear();
      }
    });
  });

  loadSearchResults();
}

async function loadSearchResults(): Promise<void> {
  const container = document.getElementById('searchResults');
  if (!container) return;
  const requestId = sectionRequestId;

  try {
    const stations = await searchStations(store.searchQuery, store.page);
    if (requestId !== sectionRequestId) return;
    if (store.page === 0) {
      /* Se la pagina è piena, potrebbero esserci altre pagine.
         Mostrare "1/?" è più onesto di un numero inventato. */
      store.totalPages = stations.length >= store.pageSize ? Infinity : 1;
    }
    store.currentList = stations;
    renderStationList(stations, container);
  } catch {
    if (requestId !== sectionRequestId) return;
    container.innerHTML = '<div class="empty-state"><p>Errore nella ricerca</p></div>';
  }
}

function renderItemList(
  items: Array<{ name: string; stationcount?: number; iso_3166_1?: string }>,
  type: string,
  container: HTMLElement,
): void {
  if (!items || items.length === 0) {
    container.innerHTML = '<div class="empty-state"><div class="icon">📭</div><p>Nessun elemento</p></div>';
    return;
  }

  let html = '<div class="dropdown-list" role="list">';
  items.forEach((item) => {
    const count = item.stationcount ?? '';
    const isoCode = item.iso_3166_1 ?? '';
    html += `
      <div class="dd-item" data-label="${escAttr(item.name)}" data-iso="${escAttr(isoCode)}" data-type="${type}" role="listitem" tabindex="0" aria-label="${escAttr(item.name)}${count ? ', ' + count + ' stazioni' : ''}">
        <span>${escHtml(item.name)}</span>
        ${count ? `<span class="count">${count}</span>` : ''}
      </div>`;
  });
  html += '</div>';
  container.innerHTML = html;

  container.querySelectorAll('.dd-item').forEach((el) => {
    const handleSelect = () => {
      const label = (el as HTMLElement).dataset.label!;
      const iso = (el as HTMLElement).dataset.iso ?? '';
      const t = (el as HTMLElement).dataset.type!;
      if (t === 'country') {
        store.filters.country = label;
        store.filters.countrycode = iso;
      } else if (t === 'language') store.filters.language = label;
      else if (t === 'tag') store.filters.tag = label;
      store.section = 'search';
      store.page = 0;
      document.querySelectorAll('.nav-item').forEach((n) => n.classList.remove('active'));
      document.querySelector('[data-section="search"]')?.classList.add('active');
      loadSection();
    };
    el.addEventListener('click', handleSelect);
    el.addEventListener('keydown', (e) => {
      const ke = e as KeyboardEvent;
      if (ke.key === 'Enter' || ke.key === ' ') {
        ke.preventDefault();
        handleSelect();
      }
    });
  });
}

export function playStationFromMap(uuid: string): void {
  const station = store.currentList.find((s) => s.stationuuid === uuid);
  if (station) {
    playStation(station);
    store.emit('close-map');
    return;
  }
  /* fallback: search across all results */
  searchStations('', 0)
    .then((stations) => {
      const found = stations.find((s) => s.stationuuid === uuid);
      if (found) {
        playStation(found);
        store.emit('close-map');
      }
    })
    .catch(() => toast('Stazione non trovata', 'error'));
}
