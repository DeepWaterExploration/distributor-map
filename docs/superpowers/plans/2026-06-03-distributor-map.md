# Distributor Map Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full-viewport dark, monochrome world map that plots distributors from `distributors.json` as glowing clustered pins, with a rich copy-on-click info card per pin, deployable as static files to GitHub Pages.

**Architecture:** Vite + React + TypeScript single-page app. `react-map-gl/maplibre` renders a MapLibre GL map using CARTO dark raster tiles desaturated to a neutral black-and-white basemap. Points are clustered client-side with `supercluster` and rendered as HTML `<Marker>` elements (glowing dots + count bubbles) — no glyph fonts or external services beyond the basemap tiles. Clicking a pin opens a styled `<Popup>` card whose text rows copy to clipboard on click. Data is fetched at runtime from `public/distributors.json`.

**Tech Stack:** Vite 8, React 19, TypeScript 6, react-map-gl 8 (`/maplibre` entry), maplibre-gl 5, supercluster 8, Vitest 4 (jsdom). Deployed via GitHub Actions to GitHub Pages.

---

## File Structure

```
package.json                    # deps + scripts
vite.config.ts                  # base:'./', react plugin, vitest config
tsconfig.json                   # app TS config
index.html                      # Vite entry
src/
  vite-env.d.ts                 # vite client types
  main.tsx                      # React root, global CSS + maplibre CSS import
  App.tsx                       # fetch + parse data, loading/error/ready states
  components/
    DistributorMap.tsx          # Map, basemap, clustering markers, popup
    DistributorPopup.tsx        # rich card body
    CopyableRow.tsx             # one copy-on-click row
  lib/
    types.ts                    # Distributor type
    validateData.ts             # parseDistributors / isValidDistributor
    copyToClipboard.ts          # clipboard helper with fallback
    bounds.ts                   # boundsOf helper for initial fit
  styles/
    global.css                  # full-bleed reset, overlay
    map.css                     # pins, clusters, popup card styling
  lib/__tests__/
    validateData.test.ts
    copyToClipboard.test.ts
public/
  distributors.json             # the data (moved from repo root)
.github/workflows/
  deploy.yml                    # build + deploy to Pages
README.md                       # usage + deploy notes
```

---

## Task 1: Scaffold the Vite + React + TS project

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `src/vite-env.d.ts`, `src/main.tsx`, `src/App.tsx`, `src/styles/global.css`

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "distributor-map",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview",
    "test": "vitest run"
  },
  "dependencies": {
    "maplibre-gl": "^5.24.0",
    "react": "^19.2.0",
    "react-dom": "^19.2.0",
    "react-map-gl": "^8.1.1",
    "supercluster": "^8.0.1"
  },
  "devDependencies": {
    "@types/react": "^19.2.0",
    "@types/react-dom": "^19.2.0",
    "@types/supercluster": "^7.1.3",
    "@vitejs/plugin-react": "^6.0.0",
    "jsdom": "^29.0.0",
    "typescript": "^6.0.0",
    "vite": "^8.0.0",
    "vitest": "^4.1.0"
  }
}
```

- [ ] **Step 2: Create `vite.config.ts`**

```ts
/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './',
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
  },
});
```

- [ ] **Step 3: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "types": ["vitest/globals", "node"]
  },
  "include": ["src"]
}
```

- [ ] **Step 4: Create `index.html`**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Distributor Map</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 5: Create `src/vite-env.d.ts`**

```ts
/// <reference types="vite/client" />
```

- [ ] **Step 6: Create `src/styles/global.css`**

```css
:root { color-scheme: dark; }
* { box-sizing: border-box; }
html, body, #root { margin: 0; padding: 0; width: 100%; height: 100%; }
body {
  background: #09090b;
  overflow: hidden;
  font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
}
.overlay {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: #a1a1aa;
  background: #09090b;
  font-size: 14px;
}
```

- [ ] **Step 7: Create `src/main.tsx`**

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import 'maplibre-gl/dist/maplibre-gl.css';
import './styles/global.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

- [ ] **Step 8: Create placeholder `src/App.tsx`** (replaced in Task 4)

```tsx
export default function App() {
  return <div className="overlay">Distributor map — scaffolding works.</div>;
}
```

- [ ] **Step 9: Install dependencies**

Run: `npm install`
Expected: completes without errors, creates `node_modules/` and `package-lock.json`.

- [ ] **Step 10: Verify dev server boots**

Run: `npm run dev -- --port 5180 &` then after ~3s `curl -s -o /dev/null -w "%{http_code}" http://localhost:5180/` then `kill %1`
Expected: prints `200`.

- [ ] **Step 11: Create `.gitignore` additions**

Append to existing `.gitignore` (it already ignores `.superpowers/` and `.DS_Store`):

```
node_modules/
dist/
```

- [ ] **Step 12: Commit**

```bash
git add package.json package-lock.json vite.config.ts tsconfig.json index.html src/ .gitignore
git commit -m "chore: scaffold Vite + React + TS project"
```

---

## Task 2: Distributor type + data validation (TDD)

**Files:**
- Create: `src/lib/types.ts`, `src/lib/validateData.ts`
- Test: `src/lib/__tests__/validateData.test.ts`

- [ ] **Step 1: Create `src/lib/types.ts`**

```ts
export type Distributor = {
  name: string;
  website: string;
  address: string;
  phone: string;
  email: string;
  /** [latitude, longitude] */
  coordinates: [number, number];
};
```

- [ ] **Step 2: Write the failing test `src/lib/__tests__/validateData.test.ts`**

```ts
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { isValidDistributor, parseDistributors } from '../validateData';

const valid = {
  name: 'Blue Robotics',
  website: 'https://bluerobotics.com/',
  address: '2740 California St. Torrance, CA 90503',
  phone: '+1 (310) 620-3080',
  email: 'sales@bluerobotics.com',
  coordinates: [33.8417319, -118.3353929],
};

describe('isValidDistributor', () => {
  it('accepts a well-formed entry', () => {
    expect(isValidDistributor(valid)).toBe(true);
  });

  it('rejects a missing or empty name', () => {
    expect(isValidDistributor({ ...valid, name: '' })).toBe(false);
    expect(isValidDistributor({ ...valid, name: undefined })).toBe(false);
  });

  it('rejects malformed coordinates', () => {
    expect(isValidDistributor({ ...valid, coordinates: [1] })).toBe(false);
    expect(isValidDistributor({ ...valid, coordinates: ['a', 2] })).toBe(false);
    expect(isValidDistributor({ ...valid, coordinates: undefined })).toBe(false);
  });

  it('rejects out-of-range latitude/longitude', () => {
    expect(isValidDistributor({ ...valid, coordinates: [120, 0] })).toBe(false);
    expect(isValidDistributor({ ...valid, coordinates: [0, 200] })).toBe(false);
  });

  it('accepts entries with empty optional fields', () => {
    expect(isValidDistributor({ ...valid, email: '' })).toBe(true);
  });
});

describe('parseDistributors', () => {
  it('keeps valid entries and drops invalid ones', () => {
    const result = parseDistributors([valid, { name: 'broken' }, 42]);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Blue Robotics');
  });

  it('returns [] for non-array input', () => {
    expect(parseDistributors({})).toEqual([]);
    expect(parseDistributors(null)).toEqual([]);
  });

  it('coerces missing optional string fields to empty strings', () => {
    const [d] = parseDistributors([
      { name: 'X', coordinates: [0, 0] },
    ]);
    expect(d.website).toBe('');
    expect(d.address).toBe('');
    expect(d.phone).toBe('');
    expect(d.email).toBe('');
  });

  it('validates the real distributors.json dataset', () => {
    const raw = JSON.parse(
      readFileSync(new URL('../../../public/distributors.json', import.meta.url), 'utf-8'),
    );
    const parsed = parseDistributors(raw);
    expect(Array.isArray(raw)).toBe(true);
    expect(parsed).toHaveLength(raw.length); // every shipped entry is valid
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npm test -- validateData`
Expected: FAIL — cannot find module `../validateData`. (The real-dataset test will also fail until Task 4 moves the file to `public/`; that is expected for now.)

- [ ] **Step 4: Implement `src/lib/validateData.ts`**

```ts
import type { Distributor } from './types';

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

export function isValidDistributor(value: unknown): boolean {
  if (typeof value !== 'object' || value === null) return false;
  const d = value as Record<string, unknown>;

  if (typeof d.name !== 'string' || d.name.trim() === '') return false;

  const coords = d.coordinates;
  if (!Array.isArray(coords) || coords.length !== 2) return false;
  const [lat, lng] = coords;
  if (!isFiniteNumber(lat) || lat < -90 || lat > 90) return false;
  if (!isFiniteNumber(lng) || lng < -180 || lng > 180) return false;

  return true;
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

export function parseDistributors(raw: unknown): Distributor[] {
  if (!Array.isArray(raw)) return [];

  const result: Distributor[] = [];
  for (const item of raw) {
    if (!isValidDistributor(item)) {
      console.warn('Skipping invalid distributor entry:', item);
      continue;
    }
    const d = item as Record<string, unknown>;
    const coords = d.coordinates as [number, number];
    result.push({
      name: d.name as string,
      website: asString(d.website),
      address: asString(d.address),
      phone: asString(d.phone),
      email: asString(d.email),
      coordinates: [coords[0], coords[1]],
    });
  }
  return result;
}
```

- [ ] **Step 5: Run the test (the real-dataset case will still fail until Task 4)**

Run: `npm test -- validateData -t "isValidDistributor"`
Expected: all `isValidDistributor` and the non-dataset `parseDistributors` cases PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/types.ts src/lib/validateData.ts src/lib/__tests__/validateData.test.ts
git commit -m "feat: add distributor type and data validation"
```

---

## Task 3: Clipboard helper with fallback (TDD)

**Files:**
- Create: `src/lib/copyToClipboard.ts`
- Test: `src/lib/__tests__/copyToClipboard.test.ts`

- [ ] **Step 1: Write the failing test `src/lib/__tests__/copyToClipboard.test.ts`**

```ts
import { afterEach, describe, expect, it, vi } from 'vitest';
import { copyToClipboard } from '../copyToClipboard';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('copyToClipboard', () => {
  it('uses the async clipboard API when available', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });

    const ok = await copyToClipboard('hello');

    expect(ok).toBe(true);
    expect(writeText).toHaveBeenCalledWith('hello');
  });

  it('falls back to execCommand when clipboard API is missing', async () => {
    vi.stubGlobal('navigator', {});
    const exec = vi.fn().mockReturnValue(true);
    document.execCommand = exec as unknown as typeof document.execCommand;

    const ok = await copyToClipboard('fallback');

    expect(ok).toBe(true);
    expect(exec).toHaveBeenCalledWith('copy');
  });

  it('returns false when both methods fail', async () => {
    vi.stubGlobal('navigator', {
      clipboard: { writeText: vi.fn().mockRejectedValue(new Error('denied')) },
    });
    document.execCommand = vi.fn().mockReturnValue(false) as unknown as typeof document.execCommand;

    const ok = await copyToClipboard('nope');

    expect(ok).toBe(false);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- copyToClipboard`
Expected: FAIL — cannot find module `../copyToClipboard`.

- [ ] **Step 3: Implement `src/lib/copyToClipboard.ts`**

```ts
/**
 * Copy text to the clipboard. Tries the async Clipboard API first, then a
 * hidden-textarea execCommand fallback for insecure contexts / old browsers.
 * Resolves to true on success, false on failure (never throws).
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through to the legacy path
  }

  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- copyToClipboard`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/copyToClipboard.ts src/lib/__tests__/copyToClipboard.test.ts
git commit -m "feat: add clipboard helper with fallback"
```

---

## Task 4: Move data to public/ and wire up data loading

**Files:**
- Move: `distributors.json` → `public/distributors.json`
- Create: `src/components/DistributorMap.tsx` (temporary stub, replaced in Task 5)
- Modify: `src/App.tsx`

- [ ] **Step 1: Move the data file into `public/`**

Run:
```bash
mkdir -p public
git mv distributors.json public/distributors.json
```
Expected: `public/distributors.json` exists; repo root no longer has it.

- [ ] **Step 2: Verify the real-dataset validation test now passes**

Run: `npm test -- validateData`
Expected: ALL cases PASS, including "validates the real distributors.json dataset".

- [ ] **Step 3: Create a temporary `src/components/DistributorMap.tsx` stub**

```tsx
import type { Distributor } from '../lib/types';

export function DistributorMap({ distributors }: { distributors: Distributor[] }) {
  return (
    <div className="overlay">
      Loaded {distributors.length} distributors. Map renders in Task 5.
    </div>
  );
}
```

- [ ] **Step 4: Replace `src/App.tsx` with the data-loading version**

```tsx
import { useEffect, useState } from 'react';
import { DistributorMap } from './components/DistributorMap';
import { parseDistributors } from './lib/validateData';
import type { Distributor } from './lib/types';

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; distributors: Distributor[] };

export default function App() {
  const [state, setState] = useState<LoadState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    fetch(`${import.meta.env.BASE_URL}distributors.json`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((raw) => {
        if (!cancelled) {
          setState({ status: 'ready', distributors: parseDistributors(raw) });
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error('Failed to load distributors.json', err);
          setState({ status: 'error', message: 'Could not load distributor data.' });
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (state.status === 'loading') return <div className="overlay">Loading map…</div>;
  if (state.status === 'error') return <div className="overlay">{state.message}</div>;
  return <DistributorMap distributors={state.distributors} />;
}
```

- [ ] **Step 5: Manually verify data loads in the browser**

Run: `npm run dev` and open the printed URL.
Expected: the page shows "Loaded 21 distributors. Map renders in Task 5." (Stop the server with Ctrl-C when done.)

- [ ] **Step 6: Commit**

```bash
git add public/distributors.json src/App.tsx src/components/DistributorMap.tsx
git commit -m "feat: load distributor data from public/ at runtime"
```

---

## Task 5: Render the monochrome map with clustered glowing pins

**Files:**
- Create: `src/lib/bounds.ts`, `src/styles/map.css`
- Replace: `src/components/DistributorMap.tsx`

- [ ] **Step 1: Create `src/lib/bounds.ts`**

```ts
import type { Distributor } from './types';

export type LngLatBox = {
  minLng: number;
  minLat: number;
  maxLng: number;
  maxLat: number;
};

export function boundsOf(distributors: Distributor[]): LngLatBox {
  let minLng = Infinity;
  let minLat = Infinity;
  let maxLng = -Infinity;
  let maxLat = -Infinity;
  for (const d of distributors) {
    const [lat, lng] = d.coordinates;
    minLng = Math.min(minLng, lng);
    maxLng = Math.max(maxLng, lng);
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
  }
  return { minLng, minLat, maxLng, maxLat };
}
```

- [ ] **Step 2: Create `src/styles/map.css`**

```css
.map-root,
.maplibregl-map {
  width: 100%;
  height: 100%;
}

/* Single glowing accent pin */
.pin {
  width: 16px;
  height: 16px;
  padding: 0;
  border-radius: 50%;
  background: #46bae7;
  border: 2px solid #0b0b0d;
  box-shadow: 0 0 0 3px rgba(70, 186, 231, 0.18),
    0 0 14px 3px rgba(70, 186, 231, 0.55);
  cursor: pointer;
  transition: transform 0.12s ease;
}
.pin:hover {
  transform: scale(1.18);
}

/* Cluster count bubble */
.cluster {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border-radius: 50%;
  color: #eaf7fd;
  font-weight: 600;
  font-size: 13px;
  background: rgba(70, 186, 231, 0.16);
  border: 1.5px solid #46bae7;
  box-shadow: 0 0 14px 2px rgba(70, 186, 231, 0.35);
  cursor: pointer;
  backdrop-filter: blur(2px);
  transition: background 0.12s ease;
}
.cluster:hover {
  background: rgba(70, 186, 231, 0.28);
}
```

- [ ] **Step 3: Replace `src/components/DistributorMap.tsx`**

```tsx
import { useCallback, useMemo, useRef, useState } from 'react';
import Map, {
  Marker,
  NavigationControl,
  type MapRef,
  type ViewStateChangeEvent,
} from 'react-map-gl/maplibre';
import type { StyleSpecification } from 'maplibre-gl';
import Supercluster from 'supercluster';
import type { Distributor } from '../lib/types';
import { boundsOf } from '../lib/bounds';
import '../styles/map.css';

const ACCENT = '#46bae7';

// CARTO dark raster tiles, desaturated to a neutral black-and-white basemap.
const MAP_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    carto: {
      type: 'raster',
      tiles: [
        'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
        'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
        'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
        'https://d.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
      ],
      tileSize: 256,
      attribution:
        '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions">CARTO</a>',
    },
  },
  layers: [
    {
      id: 'carto-dark',
      type: 'raster',
      source: 'carto',
      paint: {
        'raster-saturation': -1,
        'raster-contrast': 0.1,
        'raster-brightness-min': 0,
        'raster-brightness-max': 0.85,
      },
    },
  ],
};

type PinProps = { distributor: Distributor };

function clusterSize(count: number): number {
  if (count < 10) return 34;
  if (count < 50) return 42;
  return 52;
}

export function DistributorMap({ distributors }: { distributors: Distributor[] }) {
  const mapRef = useRef<MapRef>(null);
  const [bbox, setBbox] = useState<[number, number, number, number] | null>(null);
  const [zoom, setZoom] = useState(1.2);

  const index = useMemo(() => {
    const sc = new Supercluster<PinProps>({ radius: 60, maxZoom: 14 });
    sc.load(
      distributors.map((d) => ({
        type: 'Feature' as const,
        properties: { distributor: d },
        geometry: {
          type: 'Point' as const,
          coordinates: [d.coordinates[1], d.coordinates[0]],
        },
      })),
    );
    return sc;
  }, [distributors]);

  const initialViewState = useMemo(() => {
    if (distributors.length === 0) return { longitude: 0, latitude: 20, zoom: 1.2 };
    const b = boundsOf(distributors);
    if (distributors.length === 1) {
      return { longitude: b.minLng, latitude: b.minLat, zoom: 6 };
    }
    return {
      bounds: [
        [b.minLng, b.minLat],
        [b.maxLng, b.maxLat],
      ] as [[number, number], [number, number]],
      fitBoundsOptions: { padding: 60 },
    };
  }, [distributors]);

  const syncView = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    const b = map.getBounds();
    setBbox([b.getWest(), b.getSouth(), b.getEast(), b.getNorth()]);
    setZoom(map.getZoom());
  }, []);

  const handleMove = useCallback(
    (e: ViewStateChangeEvent) => {
      setZoom(e.viewState.zoom);
      syncView();
    },
    [syncView],
  );

  const clusters = useMemo(() => {
    if (!bbox) return [];
    return index.getClusters(bbox, Math.round(zoom));
  }, [index, bbox, zoom]);

  return (
    <Map
      ref={mapRef}
      initialViewState={initialViewState}
      mapStyle={MAP_STYLE}
      style={{ width: '100%', height: '100%' }}
      minZoom={1}
      onLoad={syncView}
      onMove={handleMove}
    >
      <NavigationControl position="top-right" showCompass={false} />

      {clusters.map((feature) => {
        const [lng, lat] = feature.geometry.coordinates as [number, number];
        const props = feature.properties;

        if ('cluster' in props && props.cluster) {
          const count = props.point_count;
          const size = clusterSize(count);
          return (
            <Marker
              key={`cluster-${props.cluster_id}`}
              longitude={lng}
              latitude={lat}
              anchor="center"
            >
              <button
                type="button"
                className="cluster"
                style={{ width: size, height: size }}
                onClick={() => {
                  const target = Math.min(index.getClusterExpansionZoom(props.cluster_id), 16);
                  mapRef.current?.easeTo({ center: [lng, lat], zoom: target, duration: 500 });
                }}
              >
                {count}
              </button>
            </Marker>
          );
        }

        const d = props.distributor;
        return (
          <Marker
            key={`pin-${d.name}-${lat}-${lng}`}
            longitude={lng}
            latitude={lat}
            anchor="center"
          >
            <button type="button" className="pin" aria-label={d.name} />
          </Marker>
        );
      })}
    </Map>
  );
}

export { ACCENT };
```

- [ ] **Step 4: Typecheck and run unit tests**

Run: `npm run build`
Expected: `tsc --noEmit` passes and `vite build` produces `dist/` with no errors.

- [ ] **Step 5: Manually verify the map in the browser**

Run: `npm run dev` and open the URL.
Expected:
- A neutral black-and-white (not blue) dark basemap fills the whole viewport.
- All distributors are visible on load (fit to bounds), shown as glowing cyan dots.
- Zooming out merges nearby pins into count bubbles; clicking a bubble zooms in and splits it.
- Zoom +/− buttons appear top-right; attribution shows CARTO + OpenStreetMap.
If the basemap looks too dark or too bright, tune `raster-brightness-max` / `raster-contrast` in `MAP_STYLE` and re-check. Stop the server when done.

- [ ] **Step 6: Commit**

```bash
git add src/components/DistributorMap.tsx src/lib/bounds.ts src/styles/map.css
git commit -m "feat: render monochrome basemap with clustered glowing pins"
```

---

## Task 6: Popup card with copy-on-click rows

**Files:**
- Create: `src/components/DistributorPopup.tsx`, `src/components/CopyableRow.tsx`
- Modify: `src/components/DistributorMap.tsx`, `src/styles/map.css`

- [ ] **Step 1: Create `src/components/CopyableRow.tsx`**

```tsx
import { useState } from 'react';
import { copyToClipboard } from '../lib/copyToClipboard';

export function CopyableRow({ icon, value }: { icon: string; value: string }) {
  const [copied, setCopied] = useState(false);

  const handleClick = async () => {
    const ok = await copyToClipboard(value);
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <button type="button" className="copy-row" onClick={handleClick} title="Click to copy">
      <span className="copy-icon" aria-hidden="true">{icon}</span>
      <span className="copy-text">{value}</span>
      <span className={copied ? 'copy-flag is-visible' : 'copy-flag'}>
        {copied ? 'Copied!' : 'Copy'}
      </span>
    </button>
  );
}
```

- [ ] **Step 2: Create `src/components/DistributorPopup.tsx`**

```tsx
import type { Distributor } from '../lib/types';
import { CopyableRow } from './CopyableRow';

export function DistributorPopup({ distributor }: { distributor: Distributor }) {
  return (
    <div className="card">
      <h2 className="card-title">{distributor.name}</h2>
      {distributor.address && <CopyableRow icon="📍" value={distributor.address} />}
      {distributor.phone && <CopyableRow icon="📞" value={distributor.phone} />}
      {distributor.email && <CopyableRow icon="✉️" value={distributor.email} />}
      {distributor.website && (
        <a
          className="card-website"
          href={distributor.website}
          target="_blank"
          rel="noopener noreferrer"
        >
          Visit website →
        </a>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Append popup styles to `src/styles/map.css`**

```css
/* Popup card (overrides MapLibre's default popup chrome) */
.maplibregl-popup.distributor-popup .maplibregl-popup-content {
  background: #14161a;
  border: 1px solid #26282e;
  border-radius: 14px;
  padding: 16px;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.55);
  color: #e7e9ee;
}
.maplibregl-popup.distributor-popup .maplibregl-popup-close-button {
  color: #8a8f99;
  font-size: 18px;
  padding: 2px 8px;
}
.maplibregl-popup.distributor-popup .maplibregl-popup-close-button:hover {
  color: #e7e9ee;
  background: transparent;
}
.maplibregl-popup.distributor-popup.maplibregl-popup-anchor-bottom .maplibregl-popup-tip {
  border-top-color: #14161a;
}
.maplibregl-popup.distributor-popup.maplibregl-popup-anchor-top .maplibregl-popup-tip {
  border-bottom-color: #14161a;
}
.maplibregl-popup.distributor-popup.maplibregl-popup-anchor-left .maplibregl-popup-tip {
  border-right-color: #14161a;
}
.maplibregl-popup.distributor-popup.maplibregl-popup-anchor-right .maplibregl-popup-tip {
  border-left-color: #14161a;
}

.card-title {
  margin: 0 0 12px;
  padding-right: 14px;
  font-size: 16px;
  font-weight: 600;
  color: #f4f5f7;
}
.copy-row {
  position: relative;
  display: flex;
  align-items: center;
  gap: 9px;
  width: 100%;
  margin: 0 0 2px;
  padding: 7px 8px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: #aab2bd;
  font-size: 13px;
  text-align: left;
  cursor: pointer;
  transition: background 0.12s ease, color 0.12s ease;
}
.copy-row:hover {
  background: #1d2026;
  color: #dfe3ea;
}
.copy-icon {
  flex: 0 0 auto;
  font-size: 13px;
}
.copy-text {
  flex: 1 1 auto;
  line-height: 1.35;
  word-break: break-word;
}
.copy-flag {
  flex: 0 0 auto;
  font-size: 11px;
  font-weight: 600;
  color: #46bae7;
  opacity: 0;
  transition: opacity 0.12s ease;
}
.copy-row:hover .copy-flag {
  opacity: 0.7;
}
.copy-flag.is-visible {
  opacity: 1;
}
.card-website {
  display: block;
  margin-top: 10px;
  padding: 9px;
  border-radius: 9px;
  background: #46bae7;
  color: #06222e;
  font-size: 13px;
  font-weight: 600;
  text-align: center;
  text-decoration: none;
}
.card-website:hover {
  background: #5cc6ef;
}
```

- [ ] **Step 4: Wire the popup into `src/components/DistributorMap.tsx`**

Add `Popup` to the existing react-map-gl import:

```tsx
import Map, {
  Marker,
  Popup,
  NavigationControl,
  type MapRef,
  type ViewStateChangeEvent,
} from 'react-map-gl/maplibre';
```

Add the popup import near the top with the other component imports:

```tsx
import { DistributorPopup } from './DistributorPopup';
```

Add selection state inside the component, just below the `mapRef` line:

```tsx
  const [selected, setSelected] = useState<Distributor | null>(null);
```

Set the selection when a pin is clicked — replace the single-pin `<button>` markup with:

```tsx
            <button
              type="button"
              className="pin"
              aria-label={d.name}
              onClick={(e) => {
                e.stopPropagation();
                setSelected(d);
              }}
            />
```

Render the popup as the last child of `<Map>`, immediately after the `clusters.map(...)` block and before `</Map>`:

```tsx
      {selected && (
        <Popup
          longitude={selected.coordinates[1]}
          latitude={selected.coordinates[0]}
          anchor="bottom"
          offset={18}
          closeOnClick={false}
          onClose={() => setSelected(null)}
          className="distributor-popup"
          maxWidth="320px"
        >
          <DistributorPopup distributor={selected} />
        </Popup>
      )}
```

- [ ] **Step 5: Typecheck and run the full test suite**

Run: `npm run build && npm test`
Expected: build passes; all Vitest tests pass.

- [ ] **Step 6: Manually verify the popup in the browser**

Run: `npm run dev` and open the URL.
Expected:
- Clicking a glowing pin opens a dark rounded card with the distributor name, 📍/📞/✉️ rows, and a "Visit website →" button.
- Rows with empty fields are absent (e.g. RobotShop has no email → no ✉️ row).
- Hovering a row highlights it and shows a faint "Copy"; clicking it copies the value and flashes "Copied!".
- "Visit website →" opens the site in a new tab.
- Closing the popup (X) works. Stop the server when done.

- [ ] **Step 7: Commit**

```bash
git add src/components/DistributorPopup.tsx src/components/CopyableRow.tsx src/components/DistributorMap.tsx src/styles/map.css
git commit -m "feat: add copy-on-click distributor popup card"
```

---

## Task 7: GitHub Pages deployment + README

**Files:**
- Create: `.github/workflows/deploy.yml`, `README.md`

- [ ] **Step 1: Create `.github/workflows/deploy.yml`**

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 2: Create `README.md`**

```markdown
# Distributor Map

A full-viewport dark, monochrome world map plotting distributors from
`public/distributors.json` as glowing clustered pins. Built to be embedded in an
iframe. Static — deploys to GitHub Pages with no backend or API keys.

## Develop

```bash
npm install
npm run dev      # local dev server
npm test         # run data + clipboard unit tests
npm run build    # typecheck + production build to dist/
```

## Update distributors

Edit `public/distributors.json` (array of objects):

```json
{
  "name": "Example Co",
  "website": "https://example.com/",
  "address": "123 Main St, City",
  "phone": "+1 555 123 4567",
  "email": "info@example.com",
  "coordinates": [12.3456, -65.4321]
}
```

`coordinates` is `[latitude, longitude]`. Any of `website`/`address`/`phone`/`email`
may be empty (`""`) and will be hidden in the popup. `name` and a valid
`coordinates` pair are required. Commit and push — the site rebuilds and redeploys.

## Deploy

Pushing to `main` triggers `.github/workflows/deploy.yml`, which builds and
deploys to GitHub Pages. One-time setup: in the repo, go to
**Settings → Pages → Build and deployment → Source** and select **GitHub Actions**.

## Embed

```html
<iframe src="https://<user>.github.io/<repo>/" style="border:0;width:100%;height:600px"></iframe>
```
```

- [ ] **Step 3: Verify a clean production build**

Run: `npm run build`
Expected: passes; `dist/index.html` and hashed assets exist; `dist/distributors.json` is present (copied from `public/`).

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/deploy.yml README.md
git commit -m "ci: add GitHub Pages deploy workflow and README"
```

- [ ] **Step 5: Final full verification**

Run: `npm test && npm run build`
Expected: all tests pass and the build succeeds. The project is ready to push to GitHub; enable Pages → GitHub Actions as the source.

---

## Self-Review Notes

- **Spec coverage:** Vite/React/TS stack (Task 1) ✓; types + validation (Task 2) ✓; clipboard helper (Task 3) ✓; data in `public/` fetched at runtime with loading/error states (Task 4) ✓; monochrome desaturated CARTO basemap + initial fit-bounds + minimal controls (Task 5) ✓; glowing `#46bae7` pins + native-equivalent clustering via supercluster with click-to-expand (Task 5) ✓; rich popup card with no accent bar, empty-field hiding, copy-on-click rows + website button (Task 6) ✓; full-bleed iframe-ready layout (Tasks 1 & 5 CSS) ✓; edge cases — fetch failure, invalid entries, empty dataset, clipboard fallback (Tasks 2–5) ✓; Vitest data validation test (Task 2) ✓; GitHub Actions deploy to Pages (Task 7) ✓.
- **Clustering approach note:** The spec described MapLibre native GeoJSON clustering. The plan uses `supercluster` (the same engine MapLibre uses internally) with HTML `<Marker>`s instead, because (a) it renders the count bubbles and glowing pins with pure CSS exactly matching the approved mockups, and (b) it avoids needing a glyph-font source for cluster-count text — keeping the "only CARTO tiles fetched at runtime" guarantee intact. Same UX, no external glyph dependency.
- **Type consistency:** `Distributor` shape is identical across `types.ts`, `validateData.ts`, `bounds.ts`, map, popup, and row components. `parseDistributors`/`isValidDistributor`/`copyToClipboard`/`boundsOf` names are consistent between definitions, tests, and call sites. Supercluster `PinProps` carries `{ distributor }` and is read back the same way in the marker loop.
```
