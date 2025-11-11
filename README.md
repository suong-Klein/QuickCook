# QuickCook — PWA with Firebase & IndexedDB

## Overview

**QuickCook** is a Progressive Web App that streamlines kitchen tasks and demonstrates modern PWA and offline-first patterns:

- Pantry + shopping list with quantities
- Featured and custom recipes
- Meal planner suggestions based on your pantry
- Multiple timers with pause/resume and notifications
- Dark mode and a floating action button (FAB) for quick navigation
- Installable, offline-capable, and synced via Firebase when online

---

## Tech Stack

- HTML + **Materialize CSS** (CDN)
- Vanilla JavaScript
- **Service Worker** for caching & offline support
- **Web App Manifest** for installability
- **IndexedDB** for local/offline storage
- **Firebase Firestore** for online cloud storage & synchronization

---

## Features

### Pantry
- Add items, adjust quantity (+/−), delete.
- Stays on the pantry page after actions.
- Persists locally and syncs to Firestore when online.

### Shopping List
- Add items with quantity, update (+/−), delete.
- **Add to Pantry**:
  - Moves/merges items into pantry.
  - Uses consistent quantities and updates immediately.

### Recipes
- Default sample recipes (seeded with stable IDs to avoid duplicates).
- **Add / Edit / Delete** custom recipes:
  - Title, image URL, ingredients, steps.
- View recipe details in a modal.

### Meal Planner
- Suggests recipes by comparing pantry items to recipe ingredients.
- Shows how many ingredients you have vs need and what’s missing.

### Timers
- Multiple named timers.
- Pause, resume, remove.
- Uses Notifications API + Service Worker (where supported); falls back to in-app toasts.

### Dark Mode
- Dark theme applied consistently across pages (navbar, cards, lists).
- Brand/logo colors adapt to light/dark mode.
- Preference stored in `localStorage`.

### FAB (+ / −)
- Floating Action Button for quick navigation (e.g., pantry, shopping, timers).
- Icon toggles between **+** (closed) and **−** (expanded).

---

## PWA Implementation

### Manifest (`manifest.json`)
- Defines:
  - `name`, `short_name`, `description`
  - `start_url: "./index.html"`
  - `display: "standalone"`
  - `theme_color` and `background_color`
  - Icons (`192x192`, `512x512`) in `/assets`
- Linked in `index.html`:
  ```html
  <link rel="manifest" href="manifest.json">
  <meta name="theme-color" content="#2196f3">
  ```

### Service Worker (`sw.js`)
- Pre-caches core assets:
  - `index.html`, `app.js`, `sw.js`, `manifest.json`
  - Icons and recipe images
- Cache-first strategy for static assets.
- Fallback to cached shell when offline.
- Cleans up old caches on `activate`.
- Handles notification clicks (focuses or opens the app).

---

## Data Storage: Firebase + IndexedDB

QuickCook uses a **hybrid** model.

### Online (Firestore-first)
When online and Firebase is configured:

- CRUD for `pantry`, `shopping`, and `recipes`:
  - Writes to **Cloud Firestore** collections.
  - Mirrors data into **IndexedDB** (`quickcook-db`) as a local cache.
- Firestore is the source of truth across devices.

### Offline (IndexedDB + Pending Queue)
When offline or Firestore is unreachable:

- CRUD operations are applied to IndexedDB only:
  - Object stores: `pantry`, `shopping`, `recipes`.
- Each operation is also added to a `pending` store with:
  - `op: "set"` or `op: "delete"`,
  - target `collection`,
  - `data` including a stable `id`.

### Synchronization & IDs
- Each record uses a client-generated stable `id`.
- The same `id` is used in:
  - IndexedDB
  - Firestore document IDs
  - Pending operations
- On reconnect:
  - `syncPending()` replays queued ops to Firestore in order.
  - Successful ops are removed from `pending`.
  - A toast informs the user when sync is complete.
- This avoids duplicates and ID conflicts.

---

## How to Run Locally

Because of the service worker and Firebase, do **not** open via `file://`.

### Option A — Python

```bash
python -m http.server 8080
```

Then open:

```text
http://localhost:8080/
```

### Option B — VS Code Live Server

- Open the project folder.
- Right-click `index.html` → **Open with Live Server**.

Any simple static server works.

---

## Firebase Setup (for Reviewers)

1. Create a Firebase project.
2. Enable **Cloud Firestore**.
3. Add a Web App and copy its `firebaseConfig`.
4. In `index.html`, include:

```html
<script src="https://www.gstatic.com/firebasejs/9.22.2/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore-compat.js"></script>
<script>
  const firebaseConfig = { /* your config */ };
  const firebaseApp = firebase.initializeApp(firebaseConfig);
  const firestore = firebase.firestore();
</script>
<script src="app.js"></script>
```

5. Use relaxed rules for grading, e.g.:

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

Update these rules for real-world use.

---

## How to Test Online/Offline & Sync

1. **Online CRUD**
   - Add pantry/shopping/recipe items.
   - Confirm they appear in Firestore and in `IndexedDB > quickcook-db`.

2. **Offline CRUD**
   - In DevTools → Network → set to **Offline**.
   - Perform adds/edits/deletes.
   - Data remains visible; changes are stored in IndexedDB and queued.

3. **Sync**
   - Switch back to **Online**.
   - App runs `syncPending()` automatically.
   - Check Firestore: offline changes are applied.
   - `pending` store is cleared.

4. **Persistence**
   - Reload the app:
     - Data persists via IndexedDB (offline) and/or Firestore (online).

---

## Project Structure

- `index.html` — Layout, sections, navigation, FAB, dark mode toggle.
- `app.js` — UI logic, routing, pantry/shopping/recipes/timers, meal planner, FAB control, Firebase + IndexedDB logic, sync.
- `sw.js` — Service worker for caching, offline, and notifications handling.
- `manifest.json` — Web App Manifest configuration.
- `assets/` — Icons and placeholder images.

---

## Troubleshooting

- PWA requires `http://localhost` or HTTPS (not `file://`).
- If an old version persists, hard refresh or unregister the service worker in DevTools.
- If offline doesn’t work, confirm `sw.js` is at root and registered.
- If Firebase errors appear, verify your `firebaseConfig`, Firestore is enabled, and rules allow reads/writes for testing.

---

## Limitations

- No authentication or per-user data isolation in this demo configuration.
- Sample recipes/images only; not production-ready.

---

## Credits

- UI: **Materialize CSS**
- Cloud sync: **Firebase Firestore**
- Offline storage: **IndexedDB**
- Built as an educational PWA + offline-first prototype.
