import type { Station, Country, Language, Tag } from './types';
import { store } from './state';

const API_SERVERS = [
  'https://all.api.radio-browser.info',
  'https://de1.api.radio-browser.info',
  'https://de2.api.radio-browser.info',
  'https://de3.api.radio-browser.info',
];
let currentServerIndex = 0;

const MAX_RETRIES = 2;
const INITIAL_BACKOFF_MS = 500;

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function apiFetch<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      await sleep(INITIAL_BACKOFF_MS * Math.pow(2, attempt - 1));
    }

    try {
      const serverUrl = API_SERVERS[currentServerIndex];
      const url = new URL(path, serverUrl);
      for (const [k, v] of Object.entries(params)) {
        if (v) url.searchParams.set(k, v);
      }
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error(`API ${res.status}`);
      return res.json() as Promise<T>;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      /* fallback al prossimo server */
      currentServerIndex = (currentServerIndex + 1) % API_SERVERS.length;
    }
  }

  throw lastError ?? new Error('API fetch failed');
}

/* ── stations ─────────────────────────────────────────────── */

export async function searchStations(query: string, page = 0): Promise<Station[]> {
  const offset = page * store.pageSize;
  return apiFetch<Station[]>('/json/stations/search', {
    name: query,
    countrycode: store.filters.countrycode,
    language: store.filters.language,
    tag: store.filters.tag,
    hidebroken: 'true',
    order: 'votes',
    reverse: 'true',
    limit: String(store.pageSize),
    offset: String(offset),
  });
}

export async function getTopStations(limit = 50): Promise<Station[]> {
  return apiFetch<Station[]>(`/json/stations/topvote/${limit}`);
}

export async function getStationsByCountry(cc: string, page = 0): Promise<Station[]> {
  const offset = page * store.pageSize;
  return apiFetch<Station[]>('/json/stations/search', {
    countrycode: cc,
    hidebroken: 'true',
    order: 'votes',
    reverse: 'true',
    limit: String(store.pageSize),
    offset: String(offset),
  });
}

export async function getStationsByLanguage(lang: string, page = 0): Promise<Station[]> {
  const offset = page * store.pageSize;
  return apiFetch<Station[]>('/json/stations/search', {
    language: lang,
    hidebroken: 'true',
    order: 'votes',
    reverse: 'true',
    limit: String(store.pageSize),
    offset: String(offset),
  });
}

export async function getStationsByTag(tag: string, page = 0): Promise<Station[]> {
  const offset = page * store.pageSize;
  return apiFetch<Station[]>('/json/stations/search', {
    tag: tag,
    hidebroken: 'true',
    order: 'votes',
    reverse: 'true',
    limit: String(store.pageSize),
    offset: String(offset),
  });
}

export async function getFavoriteStations(): Promise<Station[]> {
  if (store.favorites.length === 0) return [];
  return getStationsByUuids(store.favorites);
}

/* ── lists ────────────────────────────────────────────────── */

export async function getCountries(): Promise<Country[]> {
  return apiFetch<Country[]>('/json/countries', {
    order: 'stationcount',
    reverse: 'true',
    limit: '200',
  });
}

export async function getLanguages(): Promise<Language[]> {
  return apiFetch<Language[]>('/json/languages', {
    order: 'stationcount',
    reverse: 'true',
    limit: '200',
  });
}

export async function getTags(): Promise<Tag[]> {
  return apiFetch<Tag[]>('/json/tags', {
    order: 'stationcount',
    reverse: 'true',
    limit: '100',
  });
}

/* ── single station ──────────────────────────────────────── */

export async function getStationByUuid(uuid: string): Promise<Station | null> {
  try {
    const data = await apiFetch<Station[]>(`/json/stations/byuuid/${uuid}`);
    return data[0] ?? null;
  } catch {
    return null;
  }
}

export async function getStationsByUuids(uuids: string[]): Promise<Station[]> {
  if (uuids.length === 0) return [];
  const unique = [...new Set(uuids)];
  try {
    const data = await apiFetch<Station[]>(`/json/stations/byuuid/${unique.join(',')}`);
    return data;
  } catch {
    return [];
  }
}

/* ── click tracking ───────────────────────────────────────── */

export function countClick(uuid: string): void {
  fetch(`${API_SERVERS[currentServerIndex]}/url/${uuid}`).catch(() => {});
}
