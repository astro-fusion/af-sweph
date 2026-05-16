# @af/sweph-json

Zero-native-dependency JSON ephemeris engine for `@af/sweph`.

Works in any JavaScript environment: Vercel serverless, edge functions, React Native, and browsers — without native binaries, WASM, or build tooling.

## When to use this

| Use case | Recommended engine |
|---|---|
| Serverless cold-start sensitivity | **`@af/sweph-json`** |
| React Native / Expo | **`@af/sweph-json`** |
| CI / test environments | **`@af/sweph-json`** |
| High-accuracy house cusps | `@af/sweph` (native) |
| Sub-arcsecond planets | `@af/sweph` (native) |

Accuracy summary:

| Planet | Error vs SWEPH |
|---|---|
| Sun | < 0.01° |
| Moon | < 0.5° (daily data), < 0.1° (6-hourly data) |
| Mars, Venus | < 0.05° |
| Jupiter, Saturn | < 0.02° |
| Rahu/Ketu | < 0.02° |
| Lagna (ascendant) | ~0.3–0.5° |

## Installation

```bash
# pnpm
pnpm add @af/sweph-json @af/sweph-core

# npm
npm install @af/sweph-json @af/sweph-core

# yarn
yarn add @af/sweph-json @af/sweph-core
```

## Quick start

### Node.js (file system loader)

```typescript
import { createJsonSweph, NodeFsLoader } from '@af/sweph-json';

const sweph = createJsonSweph({
  loader: new NodeFsLoader('./ephemeris_data'),
});

const date = new Date('1990-07-15T10:30:00Z');
const location = { latitude: 28.6139, longitude: 77.2090 }; // New Delhi

const planets = await sweph.calculatePlanets(date, { ayanamsa: 1 }); // Lahiri
const lagna = await sweph.calculateLagna(date, location, { ayanamsa: 1 });
const sunTimes = await sweph.calculateSunTimes(date, location);
```

### Vercel / edge — CDN-hosted data

```typescript
import { createJsonSweph, UrlLoader } from '@af/sweph-json';

const sweph = createJsonSweph({
  loader: new UrlLoader('https://cdn.example.com/ephemeris'),
});
```

### Bundled data (webpack / Vite raw import)

```typescript
import { createJsonSweph } from '@af/sweph-json';
import data2024 from '../data/2024/main.csv?raw';
import moonData2024 from '../data/2024/moon.csv?raw';

const sweph = createJsonSweph({
  preloadedData: { 2024: data2024 },
  preloadedMoonData: { 2024: moonData2024 },
});
```

## API reference

### `createJsonSweph(options?)`

Returns a `JsonSwephInstance` that matches the `@af/sweph` v2 API.

```typescript
interface JsonSwephOptions {
  loader?: IEphemerisLoader;      // How to fetch CSV strings
  preloadedData?: Record<number, string>;      // Pre-fetched main.csv by year
  preloadedMoonData?: Record<number, string>;  // Pre-fetched moon.csv by year
}
```

### `JsonSwephInstance` methods

| Method | Description |
|---|---|
| `calculatePlanets(date, opts?)` | All 9 Vedic planets (Sun–Ketu) |
| `calculatePlanet(id, date, opts?)` | Single planet by numeric ID |
| `calculateLagna(date, location, opts?)` | Ascendant + house 1 |
| `calculateSunTimes(date, location)` | Sunrise, sunset, solar noon |
| `calculateSolarNoon(date, location)` | Solar noon time |
| `calculateMoonPhase(date)` | Phase, illumination, age, name |
| `calculateMoonData(date, location)` | Extended moon info |
| `calculateNextMoonPhases(date)` | New moon / full moon dates |
| `getAyanamsa(date, type?)` | Ayanamsa value in degrees |
| `dateToJulian(date)` | Julian Day Number |

**Not supported** (returns null/empty — escalate to native engine):

- `calculateRiseSet()` — individual planet rise/set
- `calculateSunPath()` — azimuth/altitude path
- Exact house cusps

### Ayanamsa types

```typescript
import { AYANAMSA_TYPE } from '@af/sweph-json';

AYANAMSA_TYPE.LAHIRI        // 1 — default
AYANAMSA_TYPE.RAMAN         // 3
AYANAMSA_TYPE.KRISHNAMURTI  // 5 — KP system
AYANAMSA_TYPE.YUKTESHWAR    // 7
AYANAMSA_TYPE.JN_BHASIN     // 8
```

### Custom loader

```typescript
import type { IEphemerisLoader } from '@af/sweph-json';

class MyLoader implements IEphemerisLoader {
  async loadYear(year: number): Promise<string> {
    // Return CSV string for the given year
    const response = await fetch(`/api/ephemeris/${year}`);
    return response.text();
  }

  async loadMoonYear(year: number): Promise<string> {
    // Optional: higher-resolution Moon data
    const response = await fetch(`/api/ephemeris/${year}/moon`);
    return response.text();
  }
}
```

### Using with the tiered engine system

```typescript
import { createJsonEngine } from '@af/sweph-json';
import type { ICalculationEngine } from '@af/sweph-core';

const jsonEngine: ICalculationEngine = createJsonEngine({ loader: myLoader });
const available = await jsonEngine.isAvailable(); // always true
const planets = await jsonEngine.calculatePlanets(new Date());
```

## Data format

The engine reads the CSV files produced by `scripts/generate-ephemeris.js`:

### `main.csv` — daily snapshots (noon UTC)

```
date,ayanamsa,sun_declination,equation_of_time,sun_long,sun_speed,moon_long,moon_speed,...
2024-01-01,24.1924,-23.0191,-3.29,280.5485,1.0190,161.9070,11.8138,...
```

- All longitudes are **tropical** (ayanamsa subtracted internally)
- Speed values are degrees/day (negative = retrograde)
- One row per day

### `moon.csv` — 6-hourly Moon positions (optional, improves accuracy)

```
date,moon_long,moon_speed
2024-01-01 00:00:00,155.2340,12.1200
2024-01-01 06:00:00,158.0890,12.0900
```

## Generating ephemeris data

```bash
# From the repository root
pnpm generate              # Current year
pnpm generate:year -- 2025 # Specific year
```

Output lands in `ephemeris_data/<year>/main.csv` and `moon.csv`.

## Performance

| Operation | Cold (first year load) | Warm (cached) |
|---|---|---|
| `calculatePlanets()` | ~5–20ms | < 1ms |
| `calculateLagna()` | < 1ms | < 1ms |
| `calculateSunTimes()` | ~5–20ms | < 1ms |
| CSV parse (365 rows) | ~2–5ms | 0ms (cached) |

Data is cached at module scope — warm Lambda containers pay the parse cost only once.

## License

MIT
