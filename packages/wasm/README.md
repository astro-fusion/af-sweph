# @af/sweph-wasm

Browser WebAssembly implementation of Swiss Ephemeris. Runs the original C code compiled to WASM — high accuracy without any server round-trips.

## When to use this

Use `@af/sweph-wasm` when you need:
- In-browser calculations (no server dependency)
- High accuracy Lagna and house cusps in the browser
- A Next.js / Vite / plain HTML app with client-side chart rendering

For server-side rendering (SSR), use `@af/sweph-json` (zero native deps) or `@af/sweph-node` (native).

## Installation

```bash
pnpm add @af/sweph-wasm @af/sweph-core
# npm install @af/sweph-wasm @af/sweph-core
```

## Usage

### Browser (plain HTML / Vite)

```typescript
import { createSweph } from '@af/sweph-wasm';

const sweph = await createSweph();
const date  = new Date('1990-07-15T10:30:00Z');
const loc   = { latitude: 28.6139, longitude: 77.2090 };

const planets = sweph.calculatePlanets(date, { ayanamsa: 1 });
const lagna   = sweph.calculateLagna(date, loc, { ayanamsa: 1 });
const moon    = sweph.calculateMoonPhase(date);
```

### Next.js (App Router — client component)

```typescript
'use client';
import { useEffect, useState } from 'react';
import type { Planet } from '@af/sweph-core';

export default function PlanetChart({ date }: { date: Date }) {
  const [planets, setPlanets] = useState<Planet[]>([]);

  useEffect(() => {
    // Dynamic import prevents SSR errors
    import('@af/sweph-wasm').then(({ createSweph }) => {
      createSweph().then(sweph => {
        setPlanets(sweph.calculatePlanets(date, { ayanamsa: 1 }));
      });
    });
  }, [date]);

  return <pre>{JSON.stringify(planets, null, 2)}</pre>;
}
```

### Next.js (Pages Router — dynamic import with ssr: false)

```typescript
import dynamic from 'next/dynamic';

const PlanetChart = dynamic(() => import('./PlanetChart'), { ssr: false });
```

## Features

| Feature | Supported |
|---|---|
| Planets (9 Vedic) | ✅ High accuracy |
| Lagna / Ascendant | ✅ |
| House cusps | ✅ |
| Sun times | ✅ |
| Moon phase + rise/set | ✅ |
| Ayanamsa (exact) | ✅ |
| Planet rise/set | ✅ |

## Using as an `ICalculationEngine`

```typescript
import { WasmEngine } from '@af/sweph-wasm';
import type { ICalculationEngine } from '@af/sweph-core';

const engine: ICalculationEngine = new WasmEngine();
await engine.initialize(); // loads and compiles the .wasm binary
const planets = await engine.calculatePlanets(new Date());
```

## Accuracy

Backed by the same Swiss Ephemeris source as the native Node.js bindings:

| Planet | Typical error |
|---|---|
| Sun, Moon | < 0.001° |
| All planets | < 0.001° |
| Lagna | < 0.01° |
| Ayanamsa | Exact (same SWEPH formula) |

## Bundle size

The `.wasm` binary is ~1.2 MB (gzipped). It is loaded dynamically on first use and cached by the browser. Pre-warm by calling `createSweph()` early in your app lifecycle.

## License

MIT
