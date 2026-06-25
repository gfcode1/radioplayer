// Generate simple PNG icons for PWA
// Run: node generate-icons.mjs

import { writeFileSync } from 'fs';

function createSVG(size) {
  const r = Math.round(size * 0.15);
  const cx = size / 2;
  const cy = size * 0.42;
  const outerR = size * 0.22;
  const innerR = size * 0.07;
  const barW = size * 0.38;
  const barH = size * 0.04;
  const barY1 = size * 0.68;
  const barY2 = size * 0.77;
  const fontSize = size * 0.09;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  <rect width="${size}" height="${size}" rx="${r}" fill="#0d0d1a"/>
  <circle cx="${cx}" cy="${cy}" r="${outerR}" fill="none" stroke="#e94560" stroke-width="${size * 0.02}"/>
  <circle cx="${cx}" cy="${cy}" r="${innerR}" fill="#e94560"/>
  <rect x="${cx - barW / 2}" y="${barY1}" width="${barW}" height="${barH}" rx="${barH / 2}" fill="#e94560" opacity="0.5"/>
  <rect x="${cx - barW * 0.35}" y="${barY2}" width="${barW * 0.7}" height="${barH * 0.8}" rx="${barH * 0.4}" fill="#e94560" opacity="0.3"/>
  <text x="${cx}" y="${size * 0.92}" text-anchor="middle" font-family="monospace" font-size="${fontSize}" fill="#e94560" font-weight="bold">RADIO</text>
</svg>`;
}

// We generate SVG files since we can't create real PNGs without canvas
// Browsers support SVG in manifest
const svg192 = createSVG(192);
const svg512 = createSVG(512);

writeFileSync('public/icon-192.svg', svg192);
writeFileSync('public/icon-512.svg', svg512);

console.log('Generated icon-192.svg and icon-512.svg');
