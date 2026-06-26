import { store } from '../state';
import { escHtml } from '../utils/dom';
import { toggleMute, togglePlay, prevStation, nextStation, setVolume } from '../audio';
import { toast } from './toast';

export function initHeader(): void {
  const playBtn = document.getElementById('playBtn')!;
  const volumeSlider = document.getElementById('volumeSlider') as HTMLInputElement;
  const volumeVal = document.getElementById('volumeVal')!;
  const volumeIcon = document.getElementById('volumeIcon')!;
  const themeBtn = document.getElementById('themeBtn')!;
  const prevBtn = document.getElementById('prevBtn')!;
  const nextBtn = document.getElementById('nextBtn')!;
  const npFavBtn = document.getElementById('npFavBtn')!;
  const shareBtn = document.getElementById('shareBtn')!;

  playBtn.addEventListener('click', togglePlay);
  prevBtn.addEventListener('click', prevStation);
  nextBtn.addEventListener('click', nextStation);

  volumeSlider.addEventListener('input', () => {
    setVolume(parseInt(volumeSlider.value, 10));
    volumeVal.textContent = volumeSlider.value + '%';
  });

  volumeIcon.addEventListener('click', () => {
    const muted = toggleMute();
    volumeIcon.textContent = muted ? '🔇' : '🔊';
  });

  themeBtn.addEventListener('click', () => {
    store.theme = store.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', store.theme);
    themeBtn.textContent = store.theme === 'dark' ? '🌙' : '☀';
    store.save();
  });

  npFavBtn.addEventListener('click', () => {
    if (!store.currentStation) return;
    const added = store.toggleFavorite(store.currentStation.stationuuid);
    toast(added ? 'Added to favorites' : 'Removed from favorites', added ? 'success' : 'info');
  });

  shareBtn.addEventListener('click', () => {
    if (!store.currentStation) return;
    const url = `https://www.radio-browser.info/#/uuid/${store.currentStation.stationuuid}`;
    navigator.clipboard
      .writeText(url)
      .then(() => toast('Link copied', 'success'))
      .catch(() => toast('Unable to copy', 'error'));
  });

  /* listen to state changes */
  store.on('station-changed', updateNowPlaying);
  store.on('favorites-changed', updateNowPlaying);
  store.on('playback-changed', updatePlayButton);
  store.on('volume-changed', () => {
    volumeIcon.textContent = store.muted ? '🔇' : '🔊';
  });
  store.on('playback-error', () => {
    toast('Stream unavailable, skipping...', 'error');
  });

  store.on('toggle-favorite', () => {
    if (!store.currentStation) return;
    const added = store.toggleFavorite(store.currentStation.stationuuid);
    toast(added ? 'Added to favorites' : 'Removed from favorites', added ? 'success' : 'info');
  });

  /* apply persisted state */
  volumeSlider.value = String(store.volume);
  volumeVal.textContent = store.volume + '%';
  document.documentElement.setAttribute('data-theme', store.theme);
  themeBtn.textContent = store.theme === 'dark' ? '🌙' : '☀';
}

function updateNowPlaying(): void {
  const s = store.currentStation;
  if (!s) return;

  const favicon = document.getElementById('npFavicon')!;
  if (s.favicon) {
    favicon.innerHTML = `<img class="station-favicon" src="${escHtml(s.favicon)}" alt="">`;
  } else {
    favicon.innerHTML = '📻';
  }

  document.getElementById('npName')!.textContent = s.name || 'UNKNOWN';
  document.getElementById('npCountry')!.textContent = [s.country, s.language]
    .filter(Boolean)
    .join(' • ');
  document.getElementById('npCodec')!.textContent = s.codec || '';
  document.getElementById('npBitrate')!.textContent = s.bitrate ? s.bitrate + ' kbps' : '';

  const favBtn = document.getElementById('npFavBtn')!;
  const isFav = store.isFavorite(s.stationuuid);
  favBtn.textContent = isFav ? '♥' : '♡';
  favBtn.classList.toggle('fav-active', isFav);
  favBtn.setAttribute('aria-label', isFav ? 'Remove from favorites' : 'Add to favorites');
}

function updatePlayButton(): void {
  const playBtn = document.getElementById('playBtn')!;
  playBtn.textContent = store.isPlaying ? '⏸' : '▶';
  playBtn.classList.toggle('playing', store.isPlaying);
  playBtn.setAttribute('aria-label', store.isPlaying ? 'Pause' : 'Play');
}
