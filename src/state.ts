import type {
  Station,
  Section,
  Filters,
  EqSettings,
  HistoryEntry,
  PersistedState,
  EventCallback,
  EventName,
} from './types';

const STORAGE_KEY = 'jukebox';

class Store {
  currentStation: Station | null = null;
  currentList: Station[] = [];
  currentIndex = -1;
  isPlaying = false;
  volume = 75;
  muted = false;
  favorites: string[] = [];
  history: HistoryEntry[] = [];
  eq: EqSettings = { bands: [0, 0, 0, 0, 0], preset: 'flat' };
  theme: 'dark' | 'light' = 'dark';
  section: Section = 'search';
  page = 0;
  pageSize = 20;
  totalPages = 0;
  searchQuery = '';
  filters: Filters = { country: '', countrycode: '', language: '', tag: '' };

  private listeners = new Map<string, Set<EventCallback>>();

  /* ── pub/sub ──────────────────────────────────────────────── */
  on(event: EventName, cb: EventCallback): () => void {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(cb);
    return () => {
      this.listeners.get(event)?.delete(cb);
    };
  }

  emit(event: EventName): void {
    this.listeners.get(event)?.forEach((cb) => cb());
  }

  /* ── persistence ──────────────────────────────────────────── */
  load(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const data: PersistedState = JSON.parse(raw);
      if (data.favorites) this.favorites = data.favorites;
      if (data.history) this.history = data.history;
      if (data.eq) this.eq = data.eq;
      if (data.volume !== undefined) this.volume = data.volume;
      if (data.theme) this.theme = data.theme;
    } catch {
      /* corrupt data, ignore */
    }
  }

  save(): void {
    const data: PersistedState = {
      favorites: this.favorites,
      history: this.history,
      eq: this.eq,
      volume: this.volume,
      theme: this.theme,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  /* ── favorites ────────────────────────────────────────────── */
  isFavorite(uuid: string): boolean {
    return this.favorites.includes(uuid);
  }

  toggleFavorite(uuid: string): boolean {
    if (this.isFavorite(uuid)) {
      this.favorites = this.favorites.filter((id) => id !== uuid);
      this.save();
      this.emit('favorites-changed');
      return false;
    }
    this.favorites.push(uuid);
    this.save();
    this.emit('favorites-changed');
    return true;
  }

  /* ── history ──────────────────────────────────────────────── */
  addHistory(uuid: string): void {
    this.history = this.history.filter((h) => h.uuid !== uuid);
    this.history.unshift({ uuid, ts: Date.now() });
    this.history = this.history.slice(0, 20);
    this.save();
  }
}

export const store = new Store();
