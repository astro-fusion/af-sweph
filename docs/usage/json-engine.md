# JSON Engine Deep Dive

`@af/sweph-json` computes planetary positions by reading pre-generated CSV files and interpolating between daily snapshots. It has zero native dependencies and works identically in Vercel serverless, AWS Lambda, Cloudflare Workers, React Native, and browsers.

For the quick-start and API overview, see [packages/json/README.md](../../packages/json/README.md). This document covers data generation, bundling strategies, and the accuracy trade-offs in detail.

---

## When to use `@af/sweph-json`

- **Serverless cold-start budget under 100ms** — the JSON engine pays only a CSV parse cost (5–30ms cold; <1ms warm in a hot container).
- **Vercel edge / Cloudflare Workers** — no native `.node` binaries, no WASM compilation.
- **React Native managed workflow** — no native build step required.
- **CI pipelines and tests** — deterministic, fast, no binary dependencies to install.
- **Primary calculation engine with native escalation** — use JSON for the fast path, escalate to native only when sub-degree accuracy is required.

---

## Generating ephemeris data

The `scripts/generate-ephemeris.js` script uses the native engine to pre-compute positions for every day of a year and writes them to CSV.

```bash
# From the repository root
pnpm generate              # generates data for the current year
pnpm generate:year -- 2025 # generates data for a specific year
pnpm generate:range -- 2020 2030  # generates data for a range of years
```

Output structure:

```
ephemeris_data/
  2024/
    main.csv    — daily snapshots (Sun, Moon, all planets, ayanamsa)
    moon.csv    — 6-hourly Moon positions (optional, improves Moon accuracy)
  2025/
    main.csv
    moon.csv
```

The Moon data is optional. If `moon.csv` is present for a year, the engine uses it for cubic interpolation at 6-hour resolution instead of 24-hour interpolation, reducing Moon error from <0.5° to <0.1°.

---

## Data format

### `main.csv`

```
date,ayanamsa,sun_declination,equation_of_time,sun_long,sun_speed,moon_long,moon_speed,mars_long,mars_speed,...
2024-01-01,24.1924,-23.0191,-3.29,280.5485,1.0190,161.9070,11.8138,108.9234,0.6312,...
```

- One row per day, at noon UTC
- All longitudes are **tropical** (sidereal ayanamsa is subtracted internally at query time)
- Speed values are degrees/day (negative = retrograde)

### `moon.csv`

```
date,moon_long,moon_speed
2024-01-01 00:00:00,155.2340,12.1200
2024-01-01 06:00:00,158.0890,12.0900
2024-01-01 12:00:00,161.9070,11.8138
2024-01-01 18:00:00,165.6590,11.5100
```

---

## Loaders

### `NodeFsLoader` — Node.js file system

```typescript
import { createJsonSweph, NodeFsLoader } from '@af/sweph-json';

const sweph = createJsonSweph({
  loader: new NodeFsLoader('/path/to/ephemeris_data'),
});
```

The loader reads `<dataDir>/<year>/main.csv` and `<dataDir>/<year>/moon.csv` on demand. Files are parsed once and cached at module scope — Lambda warm containers do not re-parse on subsequent invocations.

### `UrlLoader` — CDN or HTTP endpoint

```typescript
import { createJsonSweph, UrlLoader } from '@af/sweph-json';

const sweph = createJsonSweph({
  loader: new UrlLoader('https://cdn.example.com/ephemeris'),
});
```

The URL loader fetches `<baseUrl>/<year>/main.csv` and `<baseUrl>/<year>/moon.csv` using the global `fetch`. Pass a custom fetch function for Node 16 compatibility:

```typescript
import nodeFetch from 'node-fetch';

const sweph = createJsonSweph({
  loader: new UrlLoader('https://cdn.example.com/ephemeris', nodeFetch),
});
```

### Preloaded data — bundled CSV strings

For environments where file system access or network requests are not available (Vercel edge, React Native, browser without a server), bundle the CSV strings directly:

```typescript
import { createJsonSweph } from '@af/sweph-json';

// Pre-imported at bundle time
import mainCsv2024 from '../data/ephemeris/2024/main.csv?raw';
import moonCsv2024 from '../data/ephemeris/2024/moon.csv?raw';

const sweph = createJsonSweph({
  preloadedData:     { 2024: mainCsv2024 },
  preloadedMoonData: { 2024: moonCsv2024 },
});
```

### Custom loader

Implement `IEphemerisLoader` to load data from any source:

```typescript
import type { IEphemerisLoader } from '@af/sweph-json';

class S3Loader implements IEphemerisLoader {
  constructor(private readonly bucket: string) {}

  async loadYear(year: number): Promise<string> {
    const res = await fetch(`https://${this.bucket}.s3.amazonaws.com/ephemeris/${year}/main.csv`);
    if (!res.ok) throw new Error(`Failed to load year ${year}`);
    return res.text();
  }

  async loadMoonYear(year: number): Promise<string> {
    const res = await fetch(`https://${this.bucket}.s3.amazonaws.com/ephemeris/${year}/moon.csv`);
    if (!res.ok) throw new Error(`Failed to load moon year ${year}`);
    return res.text();
  }
}
```

---

## Bundling with webpack (Next.js, Create React App)

```javascript
// webpack.config.js or next.config.mjs
{
  module: {
    rules: [
      {
        test: /\.csv$/,
        type: 'asset/source',  // returns file content as a string
      },
    ],
  },
}
```

Then import normally:

```typescript
import mainCsv from '../data/ephemeris/2024/main.csv';
```

### Next.js with `?raw` import

With Next.js + Turbopack, use the `?raw` query:

```typescript
const mainCsv = await import('../data/ephemeris/2024/main.csv?raw');
```

Or use a dynamic import inside `getStaticProps` / `generateStaticParams`:

```typescript
export async function getStaticProps() {
  const { default: mainCsv } = await import('../data/2024/main.csv?raw');
  return { props: { ephemeris: mainCsv } };
}
```

### Vite

Vite supports `?raw` out of the box:

```typescript
import mainCsv from '../data/ephemeris/2024/main.csv?raw';
```

### Vercel static assets

Upload the CSV files to Vercel's `public/` directory and use `UrlLoader` pointing to your deployment URL:

```typescript
const sweph = createJsonSweph({
  loader: new UrlLoader(`${process.env.NEXT_PUBLIC_URL}/ephemeris`),
});
```

The files will be served from Vercel's CDN at zero compute cost.

---

## Using with the `ICalculationEngine` tiered system

`createJsonEngine` returns an `ICalculationEngine`-compatible object:

```typescript
import { createJsonEngine } from '@af/sweph-json';
import type { ICalculationEngine } from '@af/sweph-core';

const jsonEngine: ICalculationEngine = createJsonEngine({ loader: myLoader });

// Check availability (always true for JSON engine)
const available = await jsonEngine.isAvailable(); // true
await jsonEngine.initialize();

const planets = await jsonEngine.calculatePlanets(new Date(), { ayanamsa: 1 });
```

---

## Using as AstroFusion's SWEPH fallback

The recommended production pattern for Next.js / AstroFusion:

```typescript
import { createJsonSweph, NodeFsLoader } from '@af/sweph-json';
import path from 'path';

// JSON engine — always available, no cold-start risk
const jsonSweph = createJsonSweph({
  loader: new NodeFsLoader(path.join(process.cwd(), 'ephemeris_data')),
});

// Native engine — lazy loaded, only when sub-arcsecond accuracy is needed
async function getNativeSweph() {
  const _m = '@af/sweph/node';
  const mod = await import(/* webpackIgnore: true */ /* turbopackIgnore: true */ _m as string);
  return mod.createSweph({ serverlessMode: true });
}

export async function calculateChart(
  date: Date,
  location: { latitude: number; longitude: number },
  opts: { highAccuracy?: boolean } = {}
) {
  if (opts.highAccuracy) {
    try {
      const native = await getNativeSweph();
      return {
        planets: await native.calculatePlanets(date, { ayanamsa: 1 }),
        lagna: await native.calculateLagna(date, location, { ayanamsa: 1 }),
        source: 'native' as const,
      };
    } catch {
      // Fall through to JSON
    }
  }

  return {
    planets: await jsonSweph.calculatePlanets(date, { ayanamsa: 1 }),
    lagna: await jsonSweph.calculateLagna(date, location, { ayanamsa: 1 }),
    source: 'json' as const,
  };
}
```

---

## Accuracy trade-offs

| Body | JSON accuracy (daily data) | JSON accuracy (6-hourly moon.csv) |
|---|---|---|
| Sun | <0.01° | <0.01° |
| Moon | <0.5° | <0.1° |
| Mars, Venus | <0.05° | <0.05° |
| Jupiter, Saturn | <0.02° | <0.02° |
| Rahu / Ketu | <0.02° | <0.02° |
| Lagna (ascendant) | ~0.3–0.5° | ~0.3–0.5° |

The Lagna accuracy depends primarily on the birth time precision (1 minute of time ≈ 0.25° of Ascendant movement near the ecliptic).

For sub-arcsecond results required in professional Vedic chart software, use the native engine (`@af/sweph-node`).

---

## Performance

| Operation | Cold container | Warm container |
|---|---|---|
| CSV parse (365 rows, `main.csv`) | 2–5ms | 0ms (cached) |
| CSV parse (1460 rows, `moon.csv`) | 5–10ms | 0ms (cached) |
| `calculatePlanets()` | 5–20ms (first year load) | <1ms |
| `calculateLagna()` | <1ms | <1ms |
| `calculateSunTimes()` | 5–20ms (first year load) | <1ms |

Data is cached at module scope. A warm Lambda container that has already processed one request for a given year will serve all subsequent requests for that year in under 1ms.
