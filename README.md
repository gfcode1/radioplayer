# GFradio

Listen to radio stations from around the world with a vintage jukebox-inspired interface.

## Features

- **59,000+ stazioni** tramite Radio Browser API
- **Streaming HLS** con supporto hls.js
- **Equalizer a 5 bande** con 7 preset (Rock, Jazz, Pop, Classic, Bass, Vocal)
- **VU Meter** con visualizzazione audio in tempo reale
- **Mappa interattiva** con Leaflet e marker clustering
- **Preferiti** con esportazione M3U e backup JSON
- **Cronologia** degli ascolti
- **Dark/Light theme**
- **PWA** con supporto offline
- **Scorciatoie da tastiera**
- **Responsive** per mobile e desktop

## Tech Stack

- TypeScript vanilla (nessun framework)
- Vite (build tool)
- hls.js (HTTP Live Streaming)
- Leaflet + MarkerCluster (mappe)
- Web Audio API (equalizer + VU meter)
- CSS modulare con CSS custom properties

## Setup

```bash
# Installa dipendenze
npm install

# Dev server
npm run dev

# Build produzione
npm run build

# Preview build
npm run preview

# Lint
npm run lint

# Formatta
npm run format
```

## Scorciatoie da Tastiera

| Tasto | Azione |
|-------|--------|
| `Space` | Play / Pausa |
| `M` | Mute / Unmute |
| `F` | Aggiungi/Rimuovi dai preferiti |
| `?` | Mostra scorciatoie |

## Architettura

```
src/
├── main.ts              # Entry point
├── types.ts             # TypeScript interfaces
├── state.ts             # Store centralizzato (pub/sub + localStorage)
├── api.ts               # Radio Browser API client
├── audio.ts             # Audio playback (HTML5 Audio + Web Audio API)
├── ui/
│   ├── header.ts        # Header, controlli, now-playing
│   ├── sidebar.ts       # Navigazione laterale
│   ├── search.ts        # Ricerca, filtri, sezioni
│   ├── render.ts        # Rendering lista stazioni
│   ├── eq.ts            # Equalizer
│   ├── map.ts           # Mappa Leaflet
│   ├── vu.ts            # VU Meter
│   ├── toast.ts         # Notifiche toast
│   ├── modals.ts        # Modali (shortcuts, offline)
│   └── export.ts        # Import/Export JSON + M3U
├── utils/
│   ├── dom.ts           # Utility DOM + escape HTML
│   └── shortcuts.ts     # Gestione scorciatoie
└── styles/              # CSS modulare (12 file)
```

## License

MIT
