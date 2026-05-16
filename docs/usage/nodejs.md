# Node.js Usage Guide

This guide covers `@af/sweph` and `@af/sweph-node` — the native C++ Swiss Ephemeris bindings for Node.js.

---

## Install

```bash
# Full package (recommended — includes pre-built binaries)
pnpm add @af/sweph

# Node-specific package only
pnpm add @af/sweph-node @af/sweph-core
```

Pre-built binaries are bundled for:
- `linux-x64` (Vercel, AWS Lambda, most Linux servers)
- `linux-arm64` (AWS Graviton, ARM64 Linux)
- `darwin-arm64` (macOS M-series)
- `darwin-x64` (macOS Intel)
- `win32-x64`

Supported Node.js versions: 18, 20, 22.

---

## Initialization

```typescript
import { createSweph, AYANAMSA } from '@af/sweph';

// Basic
const sweph = await createSweph();

// With options
const sweph = await createSweph({
  ephePath: '/path/to/ephe',    // directory containing .se1 files (optional)
  preWarm: true,                // run initial calculations to warm cache
  enableCaching: true,          // cache repeated calculations (default: true)
  serverlessMode: true,         // reduces initialization overhead
});
```

### `SwephInitOptions`

| Option | Type | Default | Description |
|---|---|---|---|
| `ephePath` | `string` | bundled | Path to `.se1` ephemeris data files |
| `preWarm` | `boolean` | `false` | Run warm-up calculations on init |
| `enableCaching` | `boolean` | `true` | Cache results for repeated date/location pairs |
| `serverlessMode` | `boolean` | auto-detected | Reduce overhead for short-lived processes |
| `wasmUrl` | `string` | — | Not used by native engine; passed through to WASM if swapped |

---

## API reference

All methods on `SwephInstance` are async and return Promises.

### `calculatePlanets(date, options?)`

Returns all 9 Vedic planets: Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn, Rahu (Mean Node), and Ketu.

```typescript
const planets = await sweph.calculatePlanets(new Date(), {
  ayanamsa: AYANAMSA.LAHIRI,  // default is Lahiri (1)
  timezone: 5.75,              // hours offset from UTC, used for rise/set
});

const sun = planets.find(p => p.id === 'sun');
console.log(sun.longitude);   // tropical longitude in degrees
console.log(sun.rasi);        // zodiac sign 1–12
console.log(sun.rasiDegree);  // degree within the sign (0–30)
console.log(sun.isRetrograde); // boolean
```

### `calculatePlanet(planetId, date, options?)`

```typescript
import { PLANETS } from '@af/sweph';

const moon = await sweph.calculatePlanet(PLANETS.MOON, new Date());
// Returns Planet | null
```

Planet IDs:

| Constant | Value | Body |
|---|---|---|
| `PLANETS.SUN` | 0 | Sun |
| `PLANETS.MOON` | 1 | Moon |
| `PLANETS.MERCURY` | 2 | Mercury |
| `PLANETS.VENUS` | 3 | Venus |
| `PLANETS.MARS` | 4 | Mars |
| `PLANETS.JUPITER` | 5 | Jupiter |
| `PLANETS.SATURN` | 6 | Saturn |
| `PLANETS.RAHU` | 10 | Mean Node (Rahu) |
| `PLANETS.KETU` | 11 | Descending Node (Ketu) |

### `calculateLagna(date, location, options?)`

Calculates the Ascendant (Lagna) and all 12 house cusps.

```typescript
const lagna = await sweph.calculateLagna(
  new Date('1990-07-15T10:30:00Z'),
  { latitude: 27.7, longitude: 85.3, timezone: 5.75 },
  { ayanamsa: AYANAMSA.LAHIRI }
);

console.log(lagna.longitude);    // Ascendant longitude in degrees
console.log(lagna.rasi);         // sign number 1–12
console.log(lagna.rasiDegree);   // degree within sign
console.log(lagna.nakshatra);    // nakshatra number 1–27
console.log(lagna.houses);       // Array<number> — 12 house cusp longitudes
```

### `calculateRiseSet(planetId, date, location, options?)`

```typescript
const riseSet = await sweph.calculateRiseSet(
  PLANETS.SUN,
  new Date(),
  { latitude: 27.7, longitude: 85.3 },
  { timezone: 5.75 }
);

console.log(riseSet.rise);     // Date | null
console.log(riseSet.set);      // Date | null
console.log(riseSet.transit);  // Date | null
```

### `calculateSunTimes(date, location)`

```typescript
const sun = await sweph.calculateSunTimes(new Date(), {
  latitude: 27.7,
  longitude: 85.3,
  timezone: 5.75,
});

console.log(sun.sunrise);              // Date | null
console.log(sun.sunset);              // Date | null
console.log(sun.solarNoon);           // Date
console.log(sun.dayLength);           // hours
console.log(sun.civilTwilightStart);  // Date | null
```

### `calculateSolarNoon(date, location)`

```typescript
const noon = await sweph.calculateSolarNoon(new Date(), { latitude: 27.7, longitude: 85.3 });
console.log(noon.time);      // Date
console.log(noon.altitude);  // degrees above horizon
```

### `calculateSunPath(date, location, intervalMinutes?)`

Returns azimuth and altitude at regular intervals throughout the day (default: every 30 minutes).

```typescript
const path = await sweph.calculateSunPath(new Date(), { latitude: 27.7, longitude: 85.3 }, 15);
// path: Array<{ time: Date; azimuth: number; altitude: number }>
```

### `calculateMoonPhase(date)`

```typescript
const phase = await sweph.calculateMoonPhase(new Date());

console.log(phase.phaseName);    // "Waxing Crescent", "Full Moon", etc.
console.log(phase.illumination); // 0.0–1.0
console.log(phase.phase);        // phase angle in degrees (0–360)
console.log(phase.age);          // age in days (0–29.53)
```

### `calculateMoonData(date, location)`

```typescript
const moon = await sweph.calculateMoonData(new Date(), { latitude: 27.7, longitude: 85.3 });

console.log(moon.moonrise);     // Date | null
console.log(moon.moonset);      // Date | null
console.log(moon.transit);      // Date | null
console.log(moon.illumination); // percentage (0–100)
console.log(moon.distance);     // km
```

### `calculateNextMoonPhases(date)`

```typescript
const phases = await sweph.calculateNextMoonPhases(new Date());

console.log(phases.newMoon);      // Date
console.log(phases.firstQuarter); // Date
console.log(phases.fullMoon);     // Date
console.log(phases.lastQuarter);  // Date
```

### `getAyanamsa(date, ayanamsaType?)`

```typescript
const ayanamsa = sweph.getAyanamsa(new Date(), AYANAMSA.LAHIRI);
// Returns degrees (e.g. 24.19...)
```

Ayanamsa constants:

```typescript
import { AYANAMSA } from '@af/sweph';

AYANAMSA.LAHIRI        // 1 — most common for Vedic
AYANAMSA.RAMAN         // 3
AYANAMSA.KRISHNAMURTI  // 5 — KP system
AYANAMSA.YUKTESHWAR    // 7
AYANAMSA.JN_BHASIN     // 8
```

### `dateToJulian(date)`

```typescript
const jd = sweph.dateToJulian(new Date('2024-01-01T00:00:00Z'));
// Returns Julian Day Number
```

### `setEphePath(path)`

Override the ephemeris data directory after initialization.

```typescript
sweph.setEphePath('/var/task/ephe');
```

### `clearCaches()` / `setCaching(enabled)`

```typescript
sweph.clearCaches();          // clear all cached calculation results
sweph.setCaching(false);      // disable caching (reduces memory in serverless)
```

---

## Constants

```typescript
import { PLANETS, AYANAMSA, RASHIS, NAKSHATRAS } from '@af/sweph';

RASHIS[1];      // "Aries"
RASHIS[4];      // "Cancer"
RASHIS[12];     // "Pisces"

NAKSHATRAS[1];  // "Ashwini"
NAKSHATRAS[14]; // "Chitra"
NAKSHATRAS[27]; // "Revati"
```

---

## TypeScript usage

All types are exported from `@af/sweph` and `@af/sweph-core`:

```typescript
import type {
  Planet,
  LagnaInfo,
  SunTimes,
  MoonPhase,
  MoonData,
  GeoLocation,
  CalculationOptions,
} from '@af/sweph';
```

Or import from core for engine-agnostic code:

```typescript
import type { ICalculationEngine, Planet } from '@af/sweph-core';
```

---

## Handling native module errors

If the native `.node` binary cannot be loaded (wrong Node version, missing prebuild, serverless packaging issue), `createSweph()` throws an error before any calculations run.

Best practice in serverless environments:

```typescript
async function getSweph() {
  const _m = '@af/sweph';
  try {
    const mod = await import(/* webpackIgnore: true */ /* turbopackIgnore: true */ _m as string);
    return await mod.createSweph({ serverlessMode: true });
  } catch {
    // Fall back to zero-native engine
    const { createJsonSweph, UrlLoader } = await import('@af/sweph-json');
    return createJsonSweph({ loader: new UrlLoader(process.env.EPHEMERIS_CDN_URL!) });
  }
}
```

For a full explanation of every serverless crash mode, see [docs/SERVERLESS_TROUBLESHOOTING.md](../SERVERLESS_TROUBLESHOOTING.md).

---

## Building prebuilt binaries

If you need binaries for a platform not included:

```bash
cd packages/node

# All versions (Node 18/20/22) for all platforms (requires Docker)
pnpm prebuild:all

# Single platform
pnpm prebuild:linux
pnpm prebuild:linux-arm64
pnpm copy:darwin-arm64   # local macOS → copies from current build
```

Or trigger the GitHub Actions workflow `Build Prebuilds` to generate all combinations automatically.
