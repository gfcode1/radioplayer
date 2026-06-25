export interface Station {
  changeuuid: string;
  stationuuid: string;
  serveruuid: string | null;
  name: string;
  url: string;
  url_resolved: string;
  homepage: string;
  favicon: string;
  tags: string;
  country: string;
  countrycode: string;
  iso_3166_2: string | null;
  state: string;
  language: string;
  languagecodes: string;
  votes: number;
  lastchangetime: string;
  lastchangetime_iso8601: string;
  codec: string;
  bitrate: number;
  hls: number;
  lastcheckok: number;
  lastchecktime: string;
  lastchecktime_iso8601: string;
  lastcheckoktime: string;
  lastcheckoktime_iso8601: string;
  lastlocalchecktime: string;
  lastlocalchecktime_iso8601: string;
  clicktimestamp: string;
  clicktimestamp_iso8601: string | null;
  clickcount: number;
  clicktrend: number;
  ssl_error: number;
  geo_lat: number | null;
  geo_long: number | null;
  geo_distance: number | null;
  has_extended_info: boolean;
}

export interface Country {
  name: string;
  iso_3166_1: string;
  stationcount: number;
}

export interface Language {
  name: string;
  iso_639: string | null;
  stationcount: number;
}

export interface Tag {
  name: string;
  stationcount: number;
}

export interface HistoryEntry {
  uuid: string;
  ts: number;
}

export interface EqSettings {
  bands: number[];
  preset: string;
}

export interface PersistedState {
  favorites: string[];
  history: HistoryEntry[];
  eq: EqSettings;
  volume: number;
  theme: 'dark' | 'light';
}

export type Section =
  | 'search'
  | 'countries'
  | 'languages'
  | 'tags'
  | 'top'
  | 'favorites'
  | 'history'
  | 'eq';

export interface Filters {
  country: string;
  countrycode: string;
  language: string;
  tag: string;
}

export type ToastType = 'success' | 'error' | 'info';

export type EventCallback = () => void;

export interface EventMap {
  'station-changed': void;
  'playback-changed': void;
  'playback-error': void;
  'volume-changed': void;
  'favorites-changed': void;
  'section-changed': void;
  'toggle-favorite': void;
  'toggle-shortcuts': void;
  'render-eq': void;
  'render-eq-inline': void;
  'page-prev': void;
  'page-next': void;
  'close-map': void;
}

export type EventName = keyof EventMap;
