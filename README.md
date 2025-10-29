
# PV‑One v3.0 — PWA (concise)

PV‑One is a lightweight Progressive Web App for hemodynamic (PV loop) analysis, optimized for iPad and modern browsers.

## Quick summary

- Lightweight, offline-capable PWA. First load requires internet to cache Plotly (CDN).
- Data is stored locally in the browser (localStorage). Export/import via CSV is available for backups.

## Quick start

1. Open `index.html` in your browser.
2. First load: wait for Plotly to download (internet required).
3. On iPad: open `index.html` in Safari, then Share → "Add to Home Screen" to install.

Tip: after installation the app works fully offline.

## Data and backups

- Patient data is saved per-browser in localStorage.
- Use the built-in Export CSV to back up data; save files to iCloud/Drive.

## Project files (important)

- `index.html` — main UI
- `service-worker.js` — offline cache
- `manifest.json` — PWA manifest
- `lib/` — core scripts (logic, formulas, renderers)
- `scripts/loadPlotly.js` — Plotly loader (CDN)

## CDN

- Plotly.js (loaded from CDN): <https://cdn.plot.ly/plotly-2.35.3.min.js>

## License & support

Academic / research use. See app About for details.

Support: <mailto:jorgeoh1992@gmail.com>

Version: 3.0.0 PWA Edition — Oct 2025

