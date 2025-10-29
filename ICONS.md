# App icons checklist (iOS / iPadOS)

This project relies on a classic iOS Web Clip icon (apple-touch-icon.png) for the Home Screen icon on iPhone/iPad. iOS ignores the PWA manifest for icons.

## Required file

- apple-touch-icon.png (180x180 PNG) at the repository root (same folder as index.html)

Optional (nice-to-have, iOS will pick the best):

- apple-touch-icon-120x120.png
- apple-touch-icon-152x152.png
- apple-touch-icon-167x167.png

Links in index.html already include the main tag for iOS. You only need to place the file(s).

## How to generate the PNGs here

1) Open tools/generate-icons.html in a browser
2) Drop the SVG or a square PNG source (at least 512x512)
3) Click "Download" for apple-touch-icon.png (180x180)
4) Save it to the project root

## iOS cache and update notes

- iOS caches icons aggressively. If you added to Home Screen before the PNG existed, the icon will be a default letter. After placing the PNG, you must:
  - Remove the old Home Screen icon
  - Close Safari, then reopen and load your site once
  - Add to Home Screen again
- If the icon still doesn’t update, rename the file (e.g., apple-touch-icon-v2.png) and update the link in index.html to bust cache.

## Service worker

The service worker precache list references './apple-touch-icon.png'. Keeping the file at the project root avoids 404s during install/offline.
