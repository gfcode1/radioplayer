import Hls from 'hls.js';
import { store } from './state';
import { countClick } from './api';

export const EQ_FREQUENCIES = [60, 250, 1000, 4000, 12000] as const;

export const EQ_PRESETS: Record<string, number[]> = {
  flat: [0, 0, 0, 0, 0],
  rock: [4, 2, -1, 2, 3],
  jazz: [2, 1, 0, 1, 2],
  pop: [-1, 2, 3, 2, -1],
  classic: [3, 1, 0, 1, 3],
  bass: [6, 3, 0, 0, 0],
  vocal: [-2, 1, 3, 2, 0],
};

/* ── audio element ────────────────────────────────────────── */

export const audio = new Audio();
audio.crossOrigin = 'anonymous';
audio.preload = 'none';

/* ── web audio ────────────────────────────────────────────── */

let audioCtx: AudioContext | null = null;
let sourceNode: MediaElementAudioSourceNode | null = null;
let analyserNode: AnalyserNode | null = null;
const eqFilters: BiquadFilterNode[] = [];
let hlsInstance: Hls | null = null;
let consecutiveErrors = 0;
const MAX_CONSECUTIVE_ERRORS = 5;

export function initAudioContext(): void {
  if (audioCtx) return;
  audioCtx = new AudioContext();
  sourceNode = audioCtx.createMediaElementSource(audio);

  eqFilters.length = 0;
  EQ_FREQUENCIES.forEach((freq, i) => {
    const filter = audioCtx!.createBiquadFilter();
    filter.type = i === 0 ? 'lowshelf' : i === 4 ? 'highshelf' : 'peaking';
    filter.frequency.value = freq;
    filter.gain.value = store.eq.bands[i];
    filter.Q.value = 1.4;
    eqFilters.push(filter);
  });

  analyserNode = audioCtx.createAnalyser();
  analyserNode.fftSize = 256;

  let chain: AudioNode = sourceNode;
  for (const f of eqFilters) {
    chain.connect(f);
    chain = f;
  }
  chain.connect(analyserNode);
  analyserNode.connect(audioCtx.destination);
}

export function resumeContext(): void {
  if (audioCtx?.state === 'suspended') audioCtx.resume();
}

/* ── EQ ───────────────────────────────────────────────────── */

let eqSaveTimeout: ReturnType<typeof setTimeout> | null = null;

export function setEqBand(index: number, value: number): void {
  store.eq.bands[index] = value;
  if (eqFilters[index]) eqFilters[index].gain.value = value;
  if (eqSaveTimeout) clearTimeout(eqSaveTimeout);
  eqSaveTimeout = setTimeout(() => store.save(), 300);
}

export function setEqPreset(name: string): void {
  store.eq.preset = name;
  const values = EQ_PRESETS[name] ?? EQ_PRESETS.flat;
  values.forEach((v, i) => {
    store.eq.bands[i] = v;
    if (eqFilters[i]) eqFilters[i].gain.value = v;
  });
  store.save();
}

/* ── VU meter ─────────────────────────────────────────────── */

let vuFrame: number | null = null;

export function getAnalyser(): AnalyserNode | null {
  return analyserNode;
}

export function startVuMeter(callback: (data: Uint8Array) => void): void {
  stopVuMeter();
  if (!analyserNode) return;
  const data = new Uint8Array(analyserNode.frequencyBinCount);
  const loop = () => {
    analyserNode!.getByteFrequencyData(data);
    callback(data);
    vuFrame = requestAnimationFrame(loop);
  };
  loop();
}

export function stopVuMeter(): void {
  if (vuFrame !== null) {
    cancelAnimationFrame(vuFrame);
    vuFrame = null;
  }
}

/* ── playback ─────────────────────────────────────────────── */

export function playStation(
  station: {
    stationuuid: string;
    url_resolved: string;
    url: string;
    hls: number;
  },
  list?: typeof store.currentList,
  index?: number,
): void {
  initAudioContext();
  resumeContext();

  store.currentStation = station as (typeof store.currentStation);
  if (list) store.currentList = list;
  if (index !== undefined) store.currentIndex = index;

  const url = station.url_resolved || station.url;

  if (station.hls === 1 && Hls.isSupported()) {
    if (hlsInstance) hlsInstance.destroy();
    hlsInstance = new Hls();
    hlsInstance.loadSource(url);
    hlsInstance.attachMedia(audio);
    hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => {
      audio.play().catch(handlePlayError);
    });
    hlsInstance.on(Hls.Events.ERROR, (_event, data) => {
      if (data.fatal) {
        handlePlayError();
      }
    });
  } else if (station.hls === 1 && audio.canPlayType('application/vnd.apple.mpegurl')) {
    audio.src = url;
    audio.play().catch(handlePlayError);
  } else {
    if (hlsInstance) {
      hlsInstance.destroy();
      hlsInstance = null;
    }
    audio.src = url;
    audio.play().catch(handlePlayError);
  }

  countClick(station.stationuuid);
  store.addHistory(station.stationuuid);
  store.emit('station-changed');
  consecutiveErrors = 0;
}

function handlePlayError(): void {
  store.isPlaying = false;
  store.emit('playback-error');
  consecutiveErrors++;
  if (consecutiveErrors < MAX_CONSECUTIVE_ERRORS && store.currentList.length > 0) {
    setTimeout(() => nextStation(), 1500);
  }
}

export function togglePlay(): void {
  if (!store.currentStation) return;
  initAudioContext();
  resumeContext();
  if (store.isPlaying) {
    audio.pause();
  } else {
    audio.play().catch(handlePlayError);
  }
}

export function prevStation(): void {
  if (store.currentList.length === 0) return;
  const idx = store.currentIndex > 0 ? store.currentIndex - 1 : store.currentList.length - 1;
  playStation(store.currentList[idx], undefined, idx);
}

export function nextStation(): void {
  if (store.currentList.length === 0) return;
  const idx =
    store.currentIndex < store.currentList.length - 1 ? store.currentIndex + 1 : 0;
  playStation(store.currentList[idx], undefined, idx);
}

export function setVolume(val: number): void {
  store.volume = val;
  audio.volume = store.muted ? 0 : store.volume / 100;
  store.save();
}

export function toggleMute(): boolean {
  store.muted = !store.muted;
  audio.volume = store.muted ? 0 : store.volume / 100;
  store.emit('volume-changed');
  return store.muted;
}

/* ── audio events ─────────────────────────────────────────── */

audio.addEventListener('play', () => {
  store.isPlaying = true;
  store.emit('playback-changed');
});

audio.addEventListener('pause', () => {
  store.isPlaying = false;
  store.emit('playback-changed');
});

audio.addEventListener('error', () => {
  if (store.isPlaying) handlePlayError();
});
