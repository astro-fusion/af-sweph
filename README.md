# @af/sweph

Swiss Ephemeris for Vedic Astrology — a tiered, multi-platform library that runs in Node.js, browsers (WebAssembly), React Native, and serverless/edge environments. Every package implements the same `ICalculationEngine` interface, so you can swap tiers without changing your calculation code.

[![CI](https://github.com/astro-fusion/af-sweph/actions/workflows/ci.yml/badge.svg)](https://github.com/astro-fusion/af-sweph/actions/workflows/ci.yml)
[![Build](https://github.com/astro-fusion/af-sweph/actions/workflows/build.yml/badge.svg)](https://github.com/astro-fusion/af-sweph/actions/workflows/build.yml)

---

## Which package should I use?

| Environment | Recommended | Accuracy | Cold start | Native deps |
|---|---|---|---|---|
| Serverless / edge (Vercel, Lambda, Workers) | `@af/sweph-json` | ±0.01–0.5° | 5–30ms | None |
| CI / testing | `@af/sweph-json` | ±0.01–0.5° | 5–30ms | None |
| Browser (Next.js, Vite, plain HTML) | `@af/sweph-wasm` | High | ~100ms | None (WASM) |
| React Native / Expo | `@af/sweph-react-native` | High | ~100ms | JSI Turbo Module |
| Node.js server (long-running) | `@af/sweph` or `@af/sweph-node` | Sub-arcsecond | ~200ms | C++ bindings |
| Node.js with JSON fallback | `@af/sweph/json` export | ±0.01–0.5° | 5–30ms | None |

---

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                        Your code                             │
│            ICalculationEngine / SwephInstance                │
└───────────┬─────────────┬───────────────┬────────────────────┘
            │             │               │              │
    ┌───────▼──────┐ ┌───▼────┐ ┌────────▼──┐ ┌────────▼──────┐
    │  @af/sweph   │ │  LITE  │ │   WASM    │ │   JSON         │
    │  -node       │ │  ~50ms │ │  ~100ms   │ │  <1ms warm     │
    │  ~200ms      │ │  pure  │ │  browser  │ │  zero native   │
    │  C++ native  │ │  JS    │ │  SwEph    │ │  precomputed   │
    └──────────────┘ └────────┘ └───────────┘ └────────────────┘
            │             │               │              │
    ┌───────▼─────────────▼───────────────▼──────────────▼─────┐
    │                  @af/sweph-core                           │
    │    ICalculationEngine · ISwephAdapter · Planet · etc.     │
    └───────────────────────────────────────────────────────────┘
```

Tiers ranked fastest to most accurate:

| Tier | Package | Typical latency | Accuracy |
|---|---|---|---|
| 0: JSON | `@af/sweph-json` | <1ms warm, 5–30ms cold | ±0.01–0.5° |
| 1: Lite | `@af/sweph-lite` | ~50ms | Good (astronomy-engine) |
| 2: WASM | `@af/sweph-wasm` | ~100ms | High (SwEph WASM) |
| 3: Native | `@af/sweph-node` | ~200ms | Sub-arcsecond |

---

## Installation

### Full package (Node.js, includes all sub-packages)

```bash
# pnpm
pnpm add @af/sweph

# npm
npm install @af/sweph

# yarn
yarn add @af/sweph
```

### Individual packages

```bash
pnpm add @af/sweph-json @af/sweph-core   # JSON engine only (serverless, edge, RN)
pnpm add @af/sweph-wasm @af/sweph-core   # Browser WASM
pnpm add @af/sweph-lite @af/sweph-core   # Pure JS
pnpm add @af/sweph-node @af/sweph-core   # Node.js native
pnpm add @af/sweph-react-native @af/sweph-core  # React Native
```

### From GitHub

```bash
pnpm add github:astro-fusion/af-sweph
```

---

## Quick start

All examples compute the same data — swap the import to change tiers.

### JSON engine (serverless, edge, offline)

```typescript
import { createJsonSweph, NodeFsLoader } from '@af/sweph-json';

const sweph = createJsonSweph({
  loader: new NodeFsLoader('./ephemeris_data'),
});

const date = new Date('1990-07-15T10:30:00Z');
const location = { latitude: 28.6139, longitude: 77.2090 }; // New Delhi

const planets = await sweph.calculatePlanets(date, { ayanamsa: 1 }); // Lahiri
const lagna  = await sweph.calculateLagna(date, location, { ayanamsa: 1 });
const moon   = await sweph.calculateMoonPhase(date);

console.log(planets.find(p => p.id === 'sun')?.longitude);  // e.g. 118.4
console.log(lagna.rasi);                                     // 1–12
console.log(moon.phaseName);                                 // "Waxing Gibbous"
```

### Lite engine (pure JS, no build step)

```typescript
import { createLiteSweph } from '@af/sweph-lite';

const sweph = await createLiteSweph();

const planets = await sweph.calculatePlanets(new Date(), { ayanamsa: 1 });
const moon    = await sweph.calculateMoonPhase(new Date());
const sun     = await sweph.calculateSunTimes(new Date(), { latitude: 28.6, longitude: 77.2 });
```

### WASM engine (browser)

```typescript
import { createSweph } from '@af/sweph-wasm';

const sweph = await createSweph();

const planets = sweph.calculatePlanets(new Date(), { ayanamsa: 1 });
const lagna   = sweph.calculateLagna(new Date(), { latitude: 28.6, longitude: 77.2 });
```

### Node.js native engine (highest accuracy)

```typescript
import { createSweph, AYANAMSA } from '@af/sweph';

const sweph = await createSweph();

const planets = await sweph.calculatePlanets(new Date(), {
  ayanamsa: AYANAMSA.LAHIRI,
  timezone: 5.75, // Nepal
});

const lagna = await sweph.calculateLagna(
  new Date(),
  { latitude: 27.7, longitude: 85.3, timezone: 5.75 },
  { ayanamsa: AYANAMSA.LAHIRI }
);

console.log(lagna.longitude);           // Ascendant in degrees
console.log(lagna.houses?.length);      // 12
```
### React Native engine (JSI Turbo Module)

```typescript
import { createSweph } from '@af/sweph-react-native';

const sweph = await createSweph(); // uses bundled Swiss Ephemeris data

const date = new Date('1990-07-15T10:30:00Z');
const location = { latitude: 28.6139, longitude: 77.2090 }; // New Delhi

const planets = await sweph.calculatePlanets(date, { ayanamsa: 1 }); // Lahiri
const lagna  = await sweph.calculateLagna(date, location, { ayanamsa: 1 });
const moon   = await sweph.calculateMoonPhase(date);

console.log(planets.find(p => p.id === 'sun')?.longitude);  // e.g. 118.4
console.log(lagna?.rasi);                                     // 1–12
console.log(moon.phaseName);                                 // "Waxing Gibbous"
```

Note: For Expo managed workflow, use `@af/sweph-json` instead.

---

## Unified interface: engine-agnostic code

Write once, run on any tier:

```typescript
import type { ICalculationEngine } from '@af/sweph-core';

async function getSunPosition(engine: ICalculationEngine, date: Date) {
  const planets = await engine.calculatePlanets(date, { ayanamsa: 1 });
  return planets.find(p => p.id === 'sun');
}

// Works with any engine
import { createJsonEngine } from '@af/sweph-json';
import { LiteEngine } from '@af/sweph-lite';

const jsonEngine = createJsonEngine({ loader: myLoader });
const liteEngine = new LiteEngine();
await liteEngine.initialize();

const sunJson = await getSunPosition(jsonEngine, new Date());
const sunLite = await getSunPosition(liteEngine, new Date());
```

Feature availability differs by engine — see [docs/architecture/OVERVIEW.md](docs/architecture/OVERVIEW.md) for the feature matrix.

---

## Package exports

The root `@af/sweph` package exposes sub-path exports:

| Import | Content |
|---|---|
| `@af/sweph` or `@af/sweph/node` | Native C++ Node.js engine |
| `@af/sweph/wasm` | Browser WASM engine |
| `@af/sweph/lite` | Pure JS engine |
| `@af/sweph/json` | Zero-native JSON engine |
| `@af/sweph/core` | Shared types and interfaces only |

---

## Documentation

| Guide | Description |
|---|---|
| [docs/architecture/OVERVIEW.md](docs/architecture/OVERVIEW.md) | Tier system, feature matrix, engine-agnostic patterns |
| [docs/usage/nodejs.md](docs/usage/nodejs.md) | Node.js native engine — full API reference |
| [docs/usage/browser-wasm.md](docs/usage/browser-wasm.md) | Browser WASM — Next.js, Vite, CDN |
| [docs/usage/react-native.md](docs/usage/react-native.md) | React Native / Expo setup |
| [docs/usage/json-engine.md](docs/usage/json-engine.md) | JSON engine deep dive — data generation, bundling |
| [docs/usage/serverless.md](docs/usage/serverless.md) | Vercel, Lambda, Netlify deployment |
| [docs/SERVERLESS_TROUBLESHOOTING.md](docs/SERVERLESS_TROUBLESHOOTING.md) | Production crash modes and fixes |
| [docs/NEXTJS_VERCEL.md](docs/NEXTJS_VERCEL.md) | Next.js + Vercel configuration guide |

---

## Contributing

```bash
git clone https://github.com/astro-fusion/af-sweph
cd af-sweph
pnpm install
pnpm -r build
pnpm -r test
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for code style, PR process, and branch conventions.

---

## License

MIT — see [LICENSE](LICENSE).

Built on [Swiss Ephemeris](https://www.astro.com/swisseph/) by Astrodienst AG.
