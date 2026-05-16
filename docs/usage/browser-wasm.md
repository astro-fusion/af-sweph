# Browser / WASM Usage Guide

`@af/sweph-wasm` runs the full Swiss Ephemeris inside the browser via WebAssembly. No server required. All features including house systems and Lagna are supported.

---

## Install

```bash
pnpm add @af/sweph-wasm @af/sweph-core

# npm
npm install @af/sweph-wasm @af/sweph-core
```

---

## Basic usage

```typescript
import { createSweph } from '@af/sweph-wasm';

const sweph = await createSweph();

const date = new Date();
const location = { latitude: 28.6139, longitude: 77.2090, timezone: 5.5 };

const planets = sweph.calculatePlanets(date, { ayanamsa: 1 }); // Lahiri
const lagna   = sweph.calculateLagna(date, location, { ayanamsa: 1 });
const moon    = sweph.calculateMoonPhase(date);
const sun     = sweph.calculateSunTimes(date, location);
```

Note: unlike the Node.js engine, WASM instance methods are **synchronous** (they call into the already-loaded WASM module). The `createSweph()` factory is async because it loads and compiles the `.wasm` binary.

---

## Next.js

### App Router (client component)

```typescript
'use client';

import { useEffect, useState } from 'react';
import type { Planet } from '@af/sweph-core';

export function PlanetDisplay() {
  const [planets, setPlanets] = useState<Planet[]>([]);

  useEffect(() => {
    async function load() {
      // Dynamic import prevents SSR execution
      const { createSweph } = await import('@af/sweph-wasm');
      const sweph = await createSweph();
      setPlanets(sweph.calculatePlanets(new Date(), { ayanamsa: 1 }));
    }
    load();
  }, []);

  return <ul>{planets.map(p => <li key={p.id}>{p.name}: {p.longitude.toFixed(2)}°</li>)}</ul>;
}
```

### Pages Router

```typescript
import dynamic from 'next/dynamic';

// Prevent SSR — WASM will not run in Node.js with this package
const AstroChart = dynamic(() => import('../components/AstroChart'), { ssr: false });
```

### next.config.mjs — WebAssembly support

Next.js requires explicit WASM support to be enabled:

```javascript
// next.config.mjs
const nextConfig = {
  webpack(config) {
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };
    return config;
  },
};

export default nextConfig;
```

---

## Vite

Vite supports WASM out of the box with the `@vitejs/plugin-legacy` or via `vite-plugin-wasm`:

```bash
pnpm add -D vite-plugin-wasm vite-plugin-top-level-await
```

```typescript
// vite.config.ts
import wasm from 'vite-plugin-wasm';
import topLevelAwait from 'vite-plugin-top-level-await';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [wasm(), topLevelAwait()],
});
```

Then use the package normally:

```typescript
import { createSweph } from '@af/sweph-wasm';

const sweph = await createSweph();
const planets = sweph.calculatePlanets(new Date(), { ayanamsa: 1 });
```

---

## Plain HTML (CDN)

If you are not using a bundler, load the package via a CDN that serves ES modules:

```html
<script type="module">
import { createSweph } from 'https://esm.sh/@af/sweph-wasm';

const sweph = await createSweph();
const planets = sweph.calculatePlanets(new Date(), { ayanamsa: 1 });
console.log(planets);
</script>
```

### Custom WASM URL

If your CDN or deployment setup serves the `.wasm` file at a non-default URL, pass it via `wasmUrl`:

```typescript
const sweph = await createSweph({
  wasmUrl: 'https://cdn.example.com/assets/swisseph.wasm',
});
```

---

## Dynamic loading pattern (avoiding SSR issues)

Always dynamic-import `@af/sweph-wasm` in SSR frameworks. The module accesses `WebAssembly` at load time, which does not exist in Node.js.

```typescript
// Shared helper — safe to call on server or client
async function getSweph() {
  if (typeof WebAssembly === 'undefined') {
    throw new Error('WebAssembly not available in this environment');
  }
  const { createSweph } = await import('@af/sweph-wasm');
  return createSweph();
}
```

Module-level caching (singleton pattern):

```typescript
let _swephPromise: ReturnType<typeof import('@af/sweph-wasm').createSweph> | null = null;

export function getSweph() {
  if (!_swephPromise) {
    _swephPromise = import('@af/sweph-wasm').then(m => m.createSweph());
  }
  return _swephPromise;
}
```

---

## API

The WASM engine implements `ISwephInstance` from `@af/sweph-core`. Available methods:

| Method | Description |
|---|---|
| `calculatePlanets(date, opts?)` | All 9 Vedic planets |
| `calculateLagna(date, location, opts?)` | Ascendant + house cusps |
| `calculateSunTimes(date, location)` | Sunrise, sunset, solar noon, twilight |
| `calculateMoonPhase(date)` | Phase, illumination, age, name |
| `calculateMoonData(date, location)` | Moonrise, moonset, transit, distance |
| `calculatePlanetRiseSetTimes(planetId, date, location)` | Rise/set/transit for any planet |
| `getAyanamsa(date, type?)` | Ayanamsa value in degrees |
| `dateToJulian(date)` | Julian Day Number |
| `julianToDate(jd, tzOffset?)` | Julian Day to Date |

All methods are synchronous (after the one-time `await createSweph()`).

For types, import from `@af/sweph-core` or from `@af/sweph-wasm` (it re-exports everything from core):

```typescript
import type { Planet, LagnaInfo, SunTimes, GeoLocation } from '@af/sweph-wasm';
```

---

## Performance notes

- The `.wasm` binary (~2MB) is loaded and compiled once. Subsequent `createSweph()` calls return the cached instance immediately.
- In React apps, call `createSweph()` outside the component render cycle to avoid redundant loads.
- For cold-start sensitive applications that also have a browser client (e.g., Next.js hybrid), consider using `@af/sweph-json` for initial render and hydrating with WASM results after the binary loads.
