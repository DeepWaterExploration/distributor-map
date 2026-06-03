# Distributor Map — Design Spec

**Date:** 2026-06-03
**Status:** Approved (pending spec review)

## Goal

A single full-viewport, modern dark map showing worldwide distributors as pins.
Built to be embedded in an iframe on another site. Deployable as static files to
GitHub Pages via a build step, with no runtime backend, no API keys, and no
externally hosted large files. The data lives in `distributors.json`, which the
owner edits over time to add distributors; editing it and pushing redeploys the
site with no code changes.

## Non-Goals

- No runtime backend or server.
- No search box, filters, legend, title bar, or other chrome — the page is only
  the map and pins (it lives inside an iframe).
- No user accounts, analytics, or third-party API keys.

## Stack

- **Vite + React + TypeScript** — build step producing static assets.
- **react-map-gl/maplibre** (visgl wrapper) over **maplibre-gl** — declarative
  `<Map>`, `<Source>`, `<Layer>`, `<Popup>` components.
- **Vitest** for data validation tests.
- MapLibre and all JS are npm dependencies bundled at build time — no CDN. The
  only runtime external fetch is the CARTO basemap tiles.
- `vite.config.ts` uses **`base: './'`** (relative asset paths) so the build works
  under any GitHub Pages project subpath and inside an iframe without knowing the
  repo name.

## Project Structure

```
index.html                # Vite entry, full-bleed root div
public/
  distributors.json       # the data (owner edits this; fetched at runtime)
src/
  main.tsx                # React root
  App.tsx                 # loads data, renders the map
  components/
    DistributorMap.tsx    # <Map>, basemap, clustered source/layers, popup state
    DistributorPopup.tsx  # rich card with copy-on-click rows
    CopyableRow.tsx       # one icon+text row with click-to-copy behavior
  lib/
    types.ts              # Distributor type
    validateData.ts       # runtime guard + the function Vitest tests
  styles/                 # global + map/popup CSS (or CSS modules)
.github/workflows/
  deploy.yml              # build with Vite, deploy to GitHub Pages
```

## Data

Source file: `public/distributors.json` (array of objects), fetched at runtime.
Existing shape, unchanged:

```json
{
  "name": "Blue Robotics",
  "website": "https://bluerobotics.com/",
  "address": "2740 California St. Torrance, CA 90503",
  "phone": "+1 (310) 620-3080",
  "email": "sales@bluerobotics.com",
  "coordinates": [33.8417319, -118.3353929]
}
```

TypeScript type (`src/lib/types.ts`):

```ts
type Distributor = {
  name: string;
  website: string;
  address: string;
  phone: string;
  email: string;
  coordinates: [number, number]; // [latitude, longitude]
};
```

- Any of `website`, `address`, `phone`, `email` may be empty (`""`); empty fields
  are hidden in the popup.
- `name` and a valid 2-number `coordinates` pair are required for an entry to
  render. `validateData.ts` filters/validates entries before they reach the map.

## Map Engine & Basemap

- **react-map-gl/maplibre** (WebGL) for smooth zoom/pan inertia and a modern feel.
- Basemap: **OpenFreeMap `dark` vector style** (`https://tiles.openfreemap.org/styles/dark`),
  a free, no-API-key vector tile service. Vector tiles give crisp labels and
  borders at every zoom — a notable step up from raster, which looked soft/dated
  on hi-DPI displays and "Leaflet-like" when zoomed out.
  - *History:* the design originally specified CARTO `dark_all` raster tiles
    desaturated via `raster-saturation: -1`. Switched to OpenFreeMap vector after
    the raster version was judged not sharp/modern enough. Trade-off accepted: the
    basemap provider is now a free community service rather than CARTO.
- **Monochrome treatment:** apply a CSS `filter: grayscale(1) brightness(0.85)
  contrast(1.05)` to **only** the `.maplibregl-canvas` element. The HTML pin/cluster
  markers and the popup live outside the canvas, so they keep their colour — this
  yields a neutral shadcn-style near-black basemap while the pins stay `#46bae7`.
- The `#46bae7` accent (pins/buttons) is the only saturated color, so it reads as
  a single deliberate accent against the monochrome basemap.

### Initial view & controls

- On load, fit bounds to all valid pins (with padding) so every distributor is
  visible. If only one valid pin exists, center on it at a sensible zoom; if zero,
  fall back to a default world view.
- Minimal controls for iframe use: zoom +/− (`NavigationControl`) and the compact
  attribution control that MapLibre derives from the style (OpenFreeMap /
  OpenMapTiles / OpenStreetMap — license requirement).
- A small page `<link rel="icon">` points at the DWE wave favicon (avoids a
  `/favicon.ico` 404 when embedded).

## Pins & Clustering

- Distributors loaded into a single GeoJSON `<Source>` with **native MapLibre
  clustering** enabled via Source props (`cluster`, `clusterRadius`,
  `clusterMaxZoom`).
- **Single pin:** a glowing `#46bae7` dot — a filled circle `<Layer>` with a
  softer outer glow circle beneath it.
- **Cluster:** a translucent `#46bae7` bubble `<Layer>` with a white count symbol
  layer. Clicking a cluster eases to the cluster's expansion zoom to break it
  apart.
- Single pins show a pointer cursor on hover; clicking sets popup state.

## Popup Card

`<Popup>` opens on single-pin click, rendering `<DistributorPopup>`.
**Rich card, no top accent bar.** Clicking the map outside the card closes it
(`closeOnClick`), as does the close button.

- **shadcn neutral (zinc) styling:** surface zinc-900 (`#18181b`), 1px zinc-800
  border (`#27272a`), zinc-50 foreground (`#fafafa`), muted zinc-400 rows
  (`#a1a1aa`), 12px radius, soft shadow. CSS overrides MapLibre's default popup
  chrome (tip/arrow, close button, padding) to match.
- **Title:** distributor `name`.
- **Rows** (`<CopyableRow>`, each hidden if its field is empty):
  - 📍 `address`
  - 📞 `phone`
  - ✉️ `email`
- **Website button:** "Visit website →" in `#46bae7`, opens `website` in a new tab
  (`target=_blank`, `rel=noopener`). Hidden if `website` is empty.

### Click-to-copy on text rows (`CopyableRow`)

- Address / phone / email rows are **copy-on-click** (not `tel:`/`mailto:` links).
  Website remains the one real link/button.
- On hover, a row shows a subtle highlight + copy affordance (small copy icon /
  cursor change) indicating it's copyable.
- On click, copy the raw field value via the async Clipboard API and flash a brief
  "Copied!" state on that row (local component state, auto-resets after ~1.5s).
- **Fallback:** if the Clipboard API is unavailable (insecure context / old
  browser), use a `document.execCommand('copy')` textarea fallback; if that also
  fails, fail silently (optional console warning), no crash.

## Edge Cases

- **Data fetch failure** (`distributors.json` missing / network error / invalid
  JSON): show a small centered message on the dark background instead of a blank
  map; log details to console.
- **Invalid entry** (missing `name`, or `coordinates` not a 2-number array, or
  out-of-range lat/lng): skip that entry, log a console warning, continue
  rendering the rest. Handled in `validateData.ts`.
- **Empty / all-invalid dataset:** render the basemap at a default world view
  rather than crashing on `fitBounds`.
- **Clipboard unavailable:** handled by the copy fallback above.

## Build & Deployment

- **Local dev:** `npm run dev` (Vite dev server).
- **Build:** `npm run build` → static assets in `dist/` (relative `base`).
- **CI/CD:** `.github/workflows/deploy.yml` — on push to the default branch:
  install, `npm run build`, upload `dist/` as a Pages artifact, and deploy with
  GitHub's official Pages Actions (`actions/upload-pages-artifact` +
  `actions/deploy-pages`). Pages configured to deploy from GitHub Actions.
- **Embedding:** iframe the resulting Pages URL in the parent site.
- **Updating distributors:** edit `public/distributors.json`, commit, push → the
  workflow rebuilds and redeploys. No code changes required.

## Testing

- **Vitest** unit tests for `validateData.ts`: valid entries pass; entries missing
  `name`, with malformed/missing `coordinates`, or out-of-range lat/lng are
  rejected; the real `distributors.json` parses and passes validation (guards
  against bad data edits before they ship).
- **Manual verification:** run `npm run dev`, confirm the monochrome basemap
  renders, pins/clusters appear and clusters expand on click, clicking a pin opens
  the styled card, empty fields are hidden, copy-on-click works with "Copied!"
  feedback, and the website button opens in a new tab. Confirm the page is
  full-bleed with no scrollbars (iframe-ready).

## Open Questions

None outstanding. All design decisions confirmed during brainstorming:
Vite + React + TS with a build step; react-map-gl/maplibre; CARTO dark tiles
desaturated to a monochrome shadcn-style basemap (no key); glowing `#46bae7` pins
with native clustering; rich copy-on-click popup card with no accent bar; no map
chrome; `distributors.json` in `public/` fetched at runtime; relative `base` for
GitHub Pages + iframe; GitHub Actions build-and-deploy to Pages.
