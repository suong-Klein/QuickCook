# QuickCook — PWA Prototype (Materialize CSS)

## Overview

QuickCook is a lightweight Progressive Web App that streamlines kitchen tasks. You can:

* Manage a **pantry** with quantities (increase, decrease, delete)
* Build a **shopping list** with per-item quantities, delete items, and **Add to Pantry** (merges quantities)
* Run multiple **timers** with labels and **pause/resume**
  A floating action button (FAB) gives fast shortcuts to Pantry, Shopping, and Timers. The app is responsive, installable, and works offline via a service worker; data is stored locally (no backend).

## Tech Stack

* HTML + **Materialize CSS** (CDN)
* Vanilla JavaScript
* Service Worker + Web App Manifest
* LocalStorage for data persistence

## How to View the Prototype Locally

Service workers require HTTP(S), so use a static server:

Option A (Python 3):

1. In a terminal at the project’s parent folder, run:
   `python -m http.server 8080`
2. Visit: `http://localhost:8080/<project-folder>/`

Option B (Node):

1. Install/run a static server:
   `npx serve`
2. Follow the URL shown, e.g. `http://localhost:3000`, then open `<project-folder>/`

Option C (VS Code):

* Use the “Live Server” extension and open `index.html` via “Open with Live Server”.

## Install as a PWA

* Desktop Chrome/Edge: open the site → install prompt (address bar icon) or in-app “Install” banner.
* Mobile: “Add to Home screen” from the browser menu.

## Test Offline

1. Load the app once while online (to let the service worker cache assets).
2. In DevTools → Network, toggle “Offline”.
3. Refresh: the app should still load; pantry, shopping list, and timers continue to work.

## GitHub Submission / GitHub Pages

1. Create a **public** repo (e.g., `quickcook-pwa`).
2. Place all project files at the repo root.
3. In **Settings → Pages**: “Deploy from branch”, select `main` and `/ (root)`.
4. Pages URL will look like: `https://<username>.github.io/quickcook-pwa/`
5. Submit your repo link (and Pages URL if required).

## Features (Summary)

* **Pantry:** structured items `{name, qty}`, +/− controls, delete, quantity merge from Shopping.
* **Shopping List:** per-item quantity, +/−, delete, **Add to Pantry** (merges and shows immediately).
* **Timers:** multiple labeled timers with **pause/resume/remove**.
* **FAB:** quick navigation; main icon toggles **+ / −**.
* **Offline:** service worker pre-caches HTML, JS, CSS, icons, and images.
* **Installable:** manifest with app name, theme color, and icons.

## Project Structure

* `index.html` — layout, Materialize components, FAB, sections (Home, Pantry, Timers, Shopping, Settings)
* `app.js` — routing, FAB behavior, pantry/shopping/timer logic, install banner, SW registration
* `sw.js` — service worker (pre-cache; network-first for HTML, cache-first for assets)
* `manifest.webmanifest` — PWA metadata and icons
* `assets/` — icons and placeholder images

## Troubleshooting

* **Styles/JS missing or FAB not opening:** ensure Materialize JS loads **before** `app.js` in `index.html`.
* **Changes not appearing:** service workers can cache aggressively. Do a hard refresh (Ctrl/Cmd+Shift+R). In DevTools → Application → Service Workers, enable “Update on reload”.
* **Opening via `file://` shows unstyled page:** use a local server (`http://localhost`) as noted above.

## Limitations (Prototype)

* No authentication or cloud sync; data is device-local.
* Placeholder content/images; not intended as production cooking guidance.

## License / Credits

* Materialize CSS is used via CDN under its license.
* All other code is provided as an educational prototype for coursework.
