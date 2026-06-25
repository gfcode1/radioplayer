import { getAnalyser, startVuMeter, stopVuMeter, initAudioContext } from '../audio';
import { store } from '../state';

const VU_BARS = 24;

export function initVuMeter(): void {
  const container = document.getElementById('vuMeter');
  if (!container) return;
  container.innerHTML = '';
  for (let i = 0; i < VU_BARS; i++) {
    const bar = document.createElement('div');
    bar.className = 'vu-bar';
    container.appendChild(bar);
  }

  store.on('playback-changed', () => {
    if (store.isPlaying) {
      startVu(drawVu);
    } else {
      stopVuMeter();
      resetBars();
    }
  });
}

function startVu(callback: (data: Uint8Array) => void): void {
  initAudioContext();
  if (!getAnalyser()) return;
  startVuMeter(callback);
}

function drawVu(data: Uint8Array): void {
  const bars = document.querySelectorAll('.vu-bar');
  const step = Math.floor(data.length / bars.length);
  bars.forEach((bar, i) => {
    const val = data[i * step] ?? 0;
    const h = Math.max(2, (val / 255) * 28);
    const el = bar as HTMLElement;
    el.style.height = h + 'px';
    const ratio = val / 255;
    if (ratio < 0.5) el.style.background = 'var(--vu-1)';
    else if (ratio < 0.7) el.style.background = 'var(--vu-3)';
    else if (ratio < 0.85) el.style.background = 'var(--vu-5)';
    else el.style.background = 'var(--vu-7)';
  });
}

function resetBars(): void {
  document.querySelectorAll('.vu-bar').forEach((b) => {
    (b as HTMLElement).style.height = '2px';
  });
}
