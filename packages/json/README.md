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

The `scripts/generate-ephemeris.js` script (in the repository root) produces the CSV files
that `@af/sweph-json` loads. It requires `@af/sweph-node` (native C++ bindings) to be built
first, so it runs offline — you generate once and ship the CSV files with your app.

### Prerequisites

```bash
# 1. Build the native node package
pnpm -F @af/sweph-node build

# 2. Run the generator (from the repo root)
node scripts/generate-ephemeris.js
```

### Interactive menu (no arguments)

Running without flags launches a guided menu:

```
╔══════════════════════════════════════════════════════════╗
║        @af/sweph Ephemeris Data Generator               ║
╚══════════════════════════════════════════════════════════╝

Select accuracy preset:

  1. standard    Daily noon, Moon 6h,  4 decimal places (~190 KB/year)
  2. fine        Daily noon, Moon 3h,  6 decimal places (~280 KB/year)
  3. ultra       Hourly planets, Moon 1h, 8 decimal places (~4 MB/year)
  4. Custom      — set parameters individually

Preset [1]:

── Date range ──

  1. Single year
  2. Year range
  3. Recommended range for kundali (1940–2050)

Range [3]:
```

The menu prompts for preset, date range, and output directory, then shows a summary and
estimated disk size before writing any files.

### Presets

| Preset | Planet interval | Moon interval | Precision | Size / year | Use case |
|---|---|---|---|---|---|
| `standard` | 24h (noon) | 6h | 4 dp | ~190 KB | Kundali, panchanga |
| `fine` | 24h (noon) | 3h | 6 dp | ~280 KB | Higher Moon accuracy |
| `ultra` | 1h | 1h | 8 dp | ~4 MB | Research / validation |

**Standard** is the default and covers all Vedic use cases. Moon error stays below 0.1°
with 6-hourly data and linear interpolation.

**Fine** halves Moon error to ~0.05° — worth it when Moon sign transitions matter (e.g.,
Moon crossing a nakshatra boundary within a birth hour window).

**Ultra** generates sub-degree planet accuracy and is useful for validating the JSON engine
against the native SWEPH output. Not recommended for production bundles.

### Non-interactive (CI / scripts)

```bash
# Standard preset, 1940–2050 (recommended for kundali)
node scripts/generate-ephemeris.js --preset standard --start 1940 --end 2050 --yes

# Single year, fine preset
node scripts/generate-ephemeris.js --preset fine --year 2025 --yes

# Custom Moon interval, specific range
node scripts/generate-ephemeris.js --start 2000 --end 2030 --moon-interval 3 --yes

# Ultra precision for one year (validation/research)
node scripts/generate-ephemeris.js --year 2024 --preset ultra --yes

# Custom output directory
node scripts/generate-ephemeris.js --year 2024 --output ./my-ephemeris --yes
```

### CLI flags

| Flag | Default | Description |
|---|---|---|
| `--preset <name>` | `standard` | `standard`, `fine`, or `ultra` |
| `--year <YYYY>` | — | Single year (overrides `--start`/`--end`) |
| `--start <YYYY>` | `1940` | Start of year range |
| `--end <YYYY>` | `2050` | End of year range |
| `--moon-interval <h>` | preset default | Moon snapshot interval in hours (1–6) |
| `--planet-interval <h>` | preset default | Planet snapshot interval in hours (1–24) |
| `--precision <n>` | preset default | Decimal places (2–10) |
| `--output <dir>` | `./ephemeris_data` | Output root directory |
| `--yes` | — | Skip confirmation prompt |
| `--help` | — | Show usage |

### Output structure

```
ephemeris_data/
  2024/
    main.csv   — all planets at configured interval (noon UTC by default)
    moon.csv   — Moon at finer interval (6h / 3h / 1h)
  2025/
    main.csv
    moon.csv
  ...
```

The loader reads one year bundle at a time and caches parsed data at module scope.
Lambda warm containers pay the CSV parse cost once (~2–5ms per year).

### Tuning accuracy

To improve accuracy for a specific use case, override individual parameters with `--custom`:

```bash
# Moon every 2 hours, everything else standard
node scripts/generate-ephemeris.js \
  --preset standard \
  --moon-interval 2 \
  --precision 6 \
  --year 2024 \
  --yes
```

Reducing `--moon-interval` has the biggest impact on birth chart accuracy because the Moon
moves ~0.5° per hour. Reducing `--planet-interval` below 24h is only useful for research —
slow outer planets (Saturn, Jupiter) move < 0.1° per day.

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
