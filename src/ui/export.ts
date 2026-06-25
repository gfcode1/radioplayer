import { store } from '../state';
import { getFavoriteStations } from '../api';
import { toast } from './toast';

export function initExportImport(): void {
  document.getElementById('exportBtn')?.addEventListener('click', exportData);
  document.getElementById('importBtn')?.addEventListener('click', () => {
    document.getElementById('importInput')?.click();
  });
  document.getElementById('importInput')?.addEventListener('change', importData);
}

async function exportData(): Promise<void> {
  /* JSON backup */
  const data = {
    favorites: store.favorites,
    history: store.history,
    eq: store.eq,
    volume: store.volume,
    theme: store.theme,
  };
  const jsonBlob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  downloadBlob(jsonBlob, 'jukebox-backup.json');

  /* M3U playlist */
  try {
    const favs = await getFavoriteStations();
    if (favs.length > 0) {
      let m3u = '#EXTM3U\n';
      favs.forEach((s) => {
        m3u += `#RADIOBROWSERUUID:${s.stationuuid}\n`;
        m3u += `#EXTINF:-1,${s.name} - ${s.country || ''}\n`;
        m3u += `${s.url_resolved || s.url}\n\n`;
      });
      const m3uBlob = new Blob([m3u], { type: 'audio/x-mpegurl' });
      downloadBlob(m3uBlob, 'jukebox-favorites.m3u');
    }
  } catch {
    /* ignore M3U errors */
  }

  toast('Dati esportati (JSON + M3U)', 'success');
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function importData(event: Event): void {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target?.result as string);
      if (Array.isArray(data.favorites) && data.favorites.every((f: unknown) => typeof f === 'string')) {
        store.favorites = data.favorites.slice(0, 500);
      }
      if (Array.isArray(data.history)) {
        store.history = data.history
          .filter((h: unknown) => h && typeof h === 'object' && typeof (h as { uuid?: unknown }).uuid === 'string')
          .slice(0, 20);
      }
      if (data.eq && Array.isArray(data.eq.bands) && data.eq.bands.length === 5) {
        const validBands = data.eq.bands.every((b: unknown) => typeof b === 'number' && b >= -12 && b <= 12);
        if (validBands) {
          store.eq.bands = data.eq.bands;
          store.eq.preset = typeof data.eq.preset === 'string' ? data.eq.preset : 'flat';
        }
      }
      if (typeof data.volume === 'number' && data.volume >= 0 && data.volume <= 100) {
        store.volume = data.volume;
        store.emit('volume-changed');
      }
      if (data.theme === 'dark' || data.theme === 'light') {
        store.theme = data.theme;
        document.documentElement.setAttribute('data-theme', store.theme);
        const btn = document.getElementById('themeBtn');
        if (btn) btn.textContent = store.theme === 'dark' ? '🌙' : '☀';
      }
      store.save();
      toast('Dati importati', 'success');
      store.emit('section-changed');
    } catch {
      toast('File non valido', 'error');
    }
  };
  reader.readAsText(file);
  (event.target as HTMLInputElement).value = '';
}
