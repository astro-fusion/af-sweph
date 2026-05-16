# @af/sweph-core

Shared types, interfaces, constants, and pure-JS utilities for the `@af/sweph` ecosystem.

No native dependencies — works in any JavaScript environment: Node.js, browser, React Native, serverless, and edge functions.

## Installation

```bash
pnpm add @af/sweph-core
# npm install @af/sweph-core
```

## What's in this package

### `ICalculationEngine` — the unified interface

Every calculation tier implements this single interface. Write code against it and swap tiers without changing your logic:

```typescript
import type { ICalculationEngine, CalculationOptions, GeoLocation } from '@af/sweph-core';

async function computeChart(
  engine: ICalculationEngine,
  date: Date,
  location: GeoLocation
) {
  const [planets, lagna] = await Promise.all([
    engine.calculatePlanets(date, { ayanamsa: 1 }),
    engine.calculateLagna(date, location, { ayanamsa: 1 }),
  ]);
  return { planets, lagna };
}

// Works with @af/sweph-json, @af/sweph-lite, @af/sweph-wasm, or @af/sweph-node
```

### Types

```typescript
import type {
  Planet,        // { id, name, longitude, rasi, rasiDegree, speed, isRetrograde, ... }
  LagnaInfo,     // { longitude, rasi, rasiDegree, nakshatra, houses? }
  GeoLocation,   // { latitude, longitude, altitude?, timezone? }
  SunTimes,      // { sunrise, sunset, solarNoon, dayLength }
  MoonPhase,     // { phase, illumination, age, phaseName }
  CalculationOptions,   // { ayanamsa?, location?, houseSystem? }
  TieredResult,         // { data: T, meta: TierMetadata }
} from '@af/sweph-core';
```

### Enums

```typescript
import {
  CalculationTier, // CACHE=0, FAST=1, WASM=2, NATIVE=3
  AyanamsaType,    // LAHIRI=1, RAMAN=3, KRISHNAMURTI=5, YUKTESHWAR=7, ...
  PlanetId,        // SUN=0, MOON=1, MERCURY=2, VENUS=3, MARS=4, ...
  HouseSystem,     // PLACIDUS='P', WHOLE_SIGN='W', EQUAL='E', ...
} from '@af/sweph-core';
```

### `EngineFeatures` — capability checking

```typescript
import { EngineFeatures } from '@af/sweph-core';

// Check before calling optional methods
if (engine.supportedFeatures.has(EngineFeatures.LAGNA)) {
  const lagna = await engine.calculateLagna(date, location);
}
```

| Feature | `@af/sweph-json` | `@af/sweph-lite` | `@af/sweph-wasm` | `@af/sweph-node` |
|---|:---:|:---:|:---:|:---:|
| `planets` | ✅ | ✅ | ✅ | ✅ |
| `sun_times` | ✅ | ✅ | ✅ | ✅ |
| `moon_phase` | ✅ | ✅ | ✅ | ✅ |
| `ayanamsa` | ✅ | ✅ (approx) | ✅ | ✅ |
| `lagna` | ✅ (approx) | — | ✅ | ✅ |
| `houses` | — | — | ✅ | ✅ |
| `moon_times` | — | — | ✅ | ✅ |
| `planet_rise_set` | — | — | — | ✅ |
| `ayanamsa_exact` | — | — | ✅ | ✅ |

### Constants

```typescript
import { PLANETS, AYANAMSA, RASHIS, NAKSHATRAS } from '@af/sweph-core';

PLANETS.SUN.id;        // 0
PLANETS.MOON.id;       // 1
PLANETS.RAHU.id;       // 10
PLANETS.KETU.id;       // 11

AYANAMSA.LAHIRI;        // 1
AYANAMSA.KRISHNAMURTI;  // 5

RASHIS[1];    // "Aries"
RASHIS[12];   // "Pisces"

NAKSHATRAS[1];    // "Ashwini"
NAKSHATRAS[27];   // "Revati"
```

### Pure utilities

```typescript
import { normalizeLongitude, getRashi } from '@af/sweph-core';

normalizeLongitude(370);    // → 10
normalizeLongitude(-10);    // → 350
getRashi(45.5);             // → 2 (Taurus, 30°–60°)
```

## Implementing your own engine

Extend `ICalculationEngine` to create a custom data source:

```typescript
import type { ICalculationEngine, Planet, CalculationOptions, CalculationTier } from '@af/sweph-core';
import { EngineFeatures } from '@af/sweph-core';

export class MyCustomEngine implements ICalculationEngine {
  readonly tier = 1 as CalculationTier;
  readonly name = 'MyEngine';
  readonly supportedFeatures = new Set([EngineFeatures.PLANETS]);

  async isAvailable() { return true; }
  async initialize() { /* load resources */ }
  dispose() { /* cleanup */ }

  async calculatePlanets(date: Date, options?: CalculationOptions): Promise<Planet[]> {
    // your implementation
    return [];
  }

  // ... other methods
}
```

## License

MIT
