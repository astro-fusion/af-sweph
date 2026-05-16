# @af/sweph-lite

Lightweight pure-JavaScript astronomical calculations using `astronomy-engine`. No native dependencies, no WASM — works in any JavaScript environment.

## When to use this

Use `@af/sweph-lite` when you need:
- Live calculations (updated every second, not pre-computed)
- A pure-JS dependency with no build step
- Planet positions and sun/moon data without house cusps

Use `@af/sweph-json` instead when you need faster cold starts with pre-computed data (serverless).
Use `@af/sweph-wasm` or `@af/sweph-node` when you need Lagna, exact house cusps, or sub-arcsecond accuracy.

## Installation

```bash
pnpm add @af/sweph-lite @af/sweph-core
# npm install @af/sweph-lite @af/sweph-core
```

## Features

| Feature | Supported |
|---|---|
| Planets (Sun–Ketu, 9 Vedic) | ✅ |
| Sunrise / Sunset / Solar Noon | ✅ |
| Moon phase, illumination, age | ✅ |
| Ayanamsa (Lahiri, approximate) | ✅ |
| Lagna / Ascendant | — (throws `FeatureNotSupportedError`) |
| House cusps | — |
| Planet rise/set | — |

## Usage

```typescript
import { createLiteSweph } from '@af/sweph-lite';

const sweph = await createLiteSweph();
const date = new Date('1990-07-15T10:30:00Z');
const location = { latitude: 28.6139, longitude: 77.2090 };

// All 9 Vedic planets
const planets = await sweph.calculatePlanets(date, { ayanamsa: 1 }); // Lahiri
console.log(planets.find(p => p.name === 'Sun'));
// { id: '0', name: 'Sun', longitude: 118.4, rasi: 5, rasiDegree: 28.4, ... }

// Sun times
const sun = await sweph.calculateSunTimes(date, location);
console.log(sun.sunrise, sun.sunset, sun.solarNoon);

// Moon phase
const moon = await sweph.calculateMoonPhase(date);
console.log(moon.phaseName, moon.illumination); // "Waxing Gibbous", 0.83
```

## Using as an `ICalculationEngine`

```typescript
import { LiteEngine } from '@af/sweph-lite';
import type { ICalculationEngine } from '@af/sweph-core';

const engine: ICalculationEngine = new LiteEngine();
await engine.initialize();

const planets = await engine.calculatePlanets(new Date());
```

## Feature detection

```typescript
import { LiteEngine } from '@af/sweph-lite';
import { EngineFeatures } from '@af/sweph-core';

const engine = new LiteEngine();

engine.supportedFeatures.has(EngineFeatures.PLANETS);   // true
engine.supportedFeatures.has(EngineFeatures.LAGNA);     // false
engine.supportedFeatures.has(EngineFeatures.HOUSES);    // false
```

## Accuracy

Backed by `astronomy-engine` (JPL-aligned):

| Planet | Typical error |
|---|---|
| Sun | < 0.005° |
| Moon | < 0.05° |
| Mars, Jupiter, Saturn | < 0.01° |
| Ayanamsa (Lahiri) | ±0.05° (polynomial approximation) |

## Architecture

`@af/sweph-lite` implements `ICalculationEngine` from `@af/sweph-core` at `CalculationTier.FAST`.

When a feature is not supported (e.g. Lagna), it throws `FeatureNotSupportedError`. In the tiered router this signals automatic escalation to WASM or Native tier.

## License

MIT
