# QuickCook — PWA Prototype (Materialize CSS)

## Overview
**QuickCook** is a lightweight Progressive Web App that streamlines kitchen tasks and demonstrates core PWA features (installability, offline, responsive UI). It includes pantry & shopping management with quantities, multi-timers with pause/resume + notifications, a meal planner that suggests recipes from your pantry, favorites, dark mode, and an install prompt banner. All data is stored locally—no backend.

## Tech Stack
- HTML + **Materialize CSS** (CDN)
- Vanilla JavaScript
- **Service Worker** + **Web App Manifest**
- LocalStorage (device-local persistence)

## Features
- **Pantry**  
  - Add items, adjust quantity (+/−), delete.  
  - Stays on the page after actions (no unwanted navigation).
- **Shopping List**  
  - Add items with quantity, +/−, delete.  
  - **Add to Pantry** merges quantities instantly and shows immediately in Pantry.
- **Recipes**  
  - Default sample recipes auto-seeded.  
  - **Add/Edit/Delete your own recipes** (title, image URL, ingredients, steps).  
  - **Favorites** (star toggle) and quick view modal.
- **Meal Planner**  
  - Suggests recipes by comparing pantry items to recipe ingredients (shows “have / need” and missing items).
- **Timers**  
  - Multiple timers with names, **pause/resume/remove**.  
  - **Notifications**: Uses the Service Worker to show OS-level notifications when timers complete (Chromium + supported platforms), plus in-app toasts as a fallback.
- **Installability**  
  - **Install banner** (auto-shows on first visit, with a cooldown).  
  - Native install prompt on Chrome/Edge/Brave after user clicks **Install**.  
  - iOS Safari **“Add to Home Screen”** tip.
- **Offline**  
  - Service worker pre-caches HTML, CSS, JS, icons, and images.  
  - Cache-first strategy for assets; pages usable offline after first visit.
- **Dark Mode**  
  - Accessible dark theme across all pages (navbar, cards, lists, inputs).  
  - Brand logo color adapts (blue in light mode, white in dark).
- **FAB (+/−)**  
  - Quick shortcuts to Pantry, Shopping, Timers.  
  - Icon flips reliably between **+** and **−**; synced across page changes.

## How to Run Locally
Service workers require `http(s)`:

**Option A (Python 3)**
1. Open a terminal **inside** the `quickcook-final` folder (the one with `index.html`).  
2. Run:  
   `py -m http.server 8080` 
3. Open:  
   `http://localhost:8080/`

**Option B (serve parent folder)**
1. Start the server in the parent directory.  
2. Open:  
   `http://localhost:8080/quickcook-final/`

**Option C (VS Code Live Server)**
- Right-click `index.html` → **Open with Live Server**.

## Install as a PWA
- **Desktop Chrome/Edge/Brave**: On first visit you’ll see the in-app **Install** banner. Click **Install** to trigger the native prompt.  
- **Android (Chromium browsers)**: Same as desktop; app installs to the launcher.  
- **iOS Safari**: Use **Share → Add to Home Screen** (a tip appears automatically on first visit).

## Test Offline
1. Visit the app once while online (assets get cached).  
2. In DevTools → Network, toggle **Offline**.  
3. Refresh: navigate Home, Pantry, Timers, Shopping, Planner, Settings—content should load from cache.

## Notifications (Timers)
- Go to **Settings** → **Enable Timer Notifications** and allow the browser prompt.  
- Start a short timer, navigate to another page or tab; when the timer ends, a system notification should appear (supported platforms). iOS shows in-app toasts unless web push is fully enabled on the OS.

## Project Structure
- `index.html` — Layout, sections (Home, Pantry, Timers, Shopping, Planner, Settings), FAB, install banner, iOS tip.  
- `app.js` — Hash-based routing, FAB sync, pantry/shopping/timers logic, recipes CRUD, favorites, meal planner scoring, dark-mode toggle, **install banner + iOS tip** logic, SW registration, notifications.  
- `sw.js` — Service worker (precache & runtime fetch; offline), notification click handler; cache name bumped per release.  
- `manifest.json` — Web App Manifest (`name`, `short_name`, `description`, `icons`, `start_url`, `display: standalone`, `theme_color`, `background_color`).  
- `assets/` — App icons (`icon-192.png`, `icon-512.png`) and placeholder images.

## GitHub Submission / Pages
1. Create a **public** repo (e.g., `quickcook-pwa`).  
2. Put project files in the repo (keep `index.html` at the root or under `quickcook-final/`).  
3. **Settings → Pages**: Deploy from `main`, folder **/ (root)** (or `/docs` if you move files).  
4. Open your Pages URL (HTTPS) and test install + offline.  
5. Ensure `manifest.json` has `"start_url": "./index.html"` so it works under subpaths.

## Troubleshooting
- **404 / Not Found**: If you started the server in the parent folder, use `/quickcook-final/`. If you started it inside the folder with `index.html`, use `/`.  
- **Old version persisting**: Hard refresh (Ctrl/Cmd+Shift+R). In DevTools → Application → Service Workers → **Unregister** then reload.  
- **Install banner not showing**: It appears once per cooldown window. Reset via Console:  
  `localStorage.removeItem('qc_install_seen_v2'); location.reload();`  
- **Notifications not appearing**: Ensure permission is **Allowed** and you’re on `https` or `http://localhost`. iOS may only show in-app toasts unless additional web-push setup is done.  
- **Blank page / stuck view**: Make sure you’re at the correct URL and that `app.js` is loading after Materialize JS.

## Limitations (Prototype)
- No authentication or cloud sync (Firebase suggestions are noted for future work).  
- Placeholder recipes/images; educational demo, not production cooking guidance.

## Credits
- UI: **Materialize CSS** (CDN).  
- Code: Educational prototype for coursework.
