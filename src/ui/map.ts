import L from 'leaflet';
import 'leaflet.markercluster';
import { store } from '../state';
import { getTopStations } from '../api';
import { escHtml } from '../utils/dom';
import { playStation } from '../audio';

let map: L.Map | null = null;
let markerCluster: L.MarkerClusterGroup | null = null;
let previousSection: string | null = null;

function initMapInstance(): void {
  if (map) {
    map.invalidateSize();
    loadMarkers();
    return;
  }

  map = L.map('map').setView([30, 0], 2);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap',
    maxZoom: 18,
  }).addTo(map);

  markerCluster = L.markerClusterGroup();
  map.addLayer(markerCluster);
  loadMarkers();
}

async function loadMarkers(): Promise<void> {
  if (!markerCluster) return;
  markerCluster.clearLayers();

  let stations = store.currentList.filter((s) => s.geo_lat != null && s.geo_long != null);
  if (stations.length === 0) {
    try {
      stations = await getTopStations(100);
      stations = stations.filter((s) => s.geo_lat != null && s.geo_long != null);
    } catch {
      return;
    }
  }

  stations.forEach((s) => {
    const marker = L.marker([s.geo_lat!, s.geo_long!]);
    const popupHtml = `
      <div class="map-popup">
        <h3>${escHtml(s.name)}</h3>
        <p>${escHtml(s.country || '')} ${s.language ? '• ' + escHtml(s.language) : ''}</p>
        <p>${escHtml(s.codec || '')} ${s.bitrate ? s.bitrate + ' kbps' : ''}</p>
        <button data-play-map="${s.stationuuid}" aria-label="Riproduci ${escHtml(s.name)}">▶ PLAY</button>
      </div>`;
    marker.bindPopup(popupHtml);
    markerCluster!.addLayer(marker);
  });
}

export function initMap(): void {
  document.getElementById('openMap')?.addEventListener('click', () => {
    /* deselect all nav items */
    document.querySelectorAll('.nav-item').forEach((el) => el.classList.remove('active'));
    openMap();
  });
  document.getElementById('closeMap')?.addEventListener('click', closeMap);
  document.getElementById('mapOverlay')?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeMap();
  });

  store.on('close-map', closeMap);

  /* delegated play from popup */
  document.getElementById('map')?.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest('[data-play-map]');
    if (btn) {
      const uuid = (btn as HTMLElement).dataset.playMap!;
      const station = store.currentList.find((s) => s.stationuuid === uuid);
      if (station) {
        playStation(station);
        closeMap();
      }
    }
  });
}

function openMap(): void {
  previousSection = store.section;
  document.getElementById('mapOverlay')?.classList.add('open');
  setTimeout(initMapInstance, 100);
}

function closeMap(): void {
  document.getElementById('mapOverlay')?.classList.remove('open');
  if (previousSection) {
    store.section = previousSection as typeof store.section;
    document.querySelectorAll('.nav-item').forEach((el) => el.classList.remove('active'));
    document.querySelector(`[data-section="${previousSection}"]`)?.classList.add('active');
    previousSection = null;
  }
}
