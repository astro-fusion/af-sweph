# @af/sweph-node

Node.js Swiss Ephemeris bindings with pre-built native binaries. Sub-arcsecond accuracy for all 9 Vedic planets, Lagna, house cusps, and precise rise/set times.

## When to use this

Use `@af/sweph-node` when you need:
- Sub-arcsecond planet accuracy (professional astrology charts)
- Exact Lagna and house cusps
- Precise planet rise/set/transit times
- Moon rise/set
- A long-running Node.js server (not serverless cold starts)

For Vercel/Lambda cold-start sensitivity, use `@af/sweph-json` as primary and `@af/sweph-node` as high-accuracy escalation.

## Installation

```bash
pnpm add @af/sweph-node @af/sweph-core
# npm install @af/sweph-node @af/sweph-core
```

## Pre-built binaries

The package ships pre-built `.node` binaries — no compilation needed:

| Platform | Node.js versions |
|---|---|
| `linux-x64` | 18, 20, 22 |
| `linux-arm64` | 18, 20, 22 |
| `darwin-arm64` | 18, 20, 22 |
| `darwin-x64` | 18, 20, 22 |
| `win32-x64` | 18, 20, 22 |

## Usage

```typescript
import { createSweph } from '@af/sweph-node';

const sweph = await createSweph();
const date  = new Date('1990-07-15T10:30:00Z');
const loc   = { latitude: 28.6139, longitude: 77.2090, timezone: 5.5 };

// All 9 Vedic planets — sub-arcsecond accuracy
const planets = await sweph.calculatePlanets(date, { ayanamsa: 1 }); // Lahiri

// Lagna + 12 house cusps
const lagna = await sweph.calculateLagna(date, loc, { ayanamsa: 1 });
console.log(lagna.longitude);    // e.g. 118.24 (sidereal degrees)
console.log(lagna.rasi);         // 5 (Leo)
console.log(lagna.houses);       // [118.24, 148.24, ..., 88.24] — 12 cusps

// Sunrise / sunset
const sun = await sweph.calculateSunTimes(date, loc);
console.log(sun.sunrise, sun.sunset);

// Moon phase + rise/set
const moon = await sweph.calculateMoonData(date, loc);
console.log(moon.phaseName, moon.moonrise, moon.moonset);

// Planet rise/set/transit
const marsRise = await sweph.calculateRiseSet(4, date, loc); // 4 = Mars
console.log(marsRise.rise, marsRise.set, marsRise.transit);

// Next moon phases
const phases = await sweph.calculateNextMoonPhases(date);
console.log(phases.fullMoon, phases.newMoon);

// Ayanamsa value
const ayanamsa = sweph.getAyanamsa(date, 1); // 23.8534
```

## Features

| Feature | Supported |
|---|---|
| Planets (9 Vedic) | ✅ Sub-arcsecond |
| Lagna / Ascendant | ✅ Exact |
| House cusps (12) | ✅ Exact |
| Sun times | ✅ |
| Moon phase + rise/set | ✅ |
| Planet rise/set/transit | ✅ |
| Ayanamsa (Lahiri, KP, Raman, …) | ✅ Exact |
| Sun path (azimuth/altitude) | ✅ |

## Using as an `ICalculationEngine`

```typescript
import { NativeEngine } from '@af/sweph-node';
import type { ICalculationEngine } from '@af/sweph-core';

const engine: ICalculationEngine = new NativeEngine();
await engine.initialize();

const planets = await engine.calculatePlanets(new Date());
```

## Serverless usage

For Vercel/Lambda, the main concern is native binary availability. See:
- [docs/SERVERLESS_TROUBLESHOOTING.md](../../docs/SERVERLESS_TROUBLESHOOTING.md) — crash modes and fixes
- [docs/usage/serverless.md](../../docs/usage/serverless.md) — deployment guide

Key points:
- Import dynamically with `/* turbopackIgnore: true */` to prevent Turbopack hashed aliases
- Use `prune-trace.cjs` to fix pnpm symlink paths in the Lambda bundle
- Consider `@af/sweph-json` as primary and escalate to native only for accuracy-critical requests

## Building from source

If no pre-built binary matches your platform:

```bash
cd packages/node
pnpm build:native     # requires node-gyp and C++ compiler
```

To build cross-platform binaries (requires Docker):

```bash
pnpm prebuild:linux        # Linux x64
pnpm prebuild:linux-arm64  # Linux ARM64 (AWS Graviton)
pnpm prebuild:all          # All platforms and Node versions
```

## License

MIT
