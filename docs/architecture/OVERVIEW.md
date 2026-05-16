# Architecture Overview

This document describes how `@af/sweph` is structured, how the tier system works, and how to write code that is portable across engines.

---

## Tier system

The library is split into four computation tiers. Higher tiers are more accurate but slower and heavier. The JSON and Lite tiers are fully stateless and pure JavaScript; WASM and Native require additional binaries.

### Tier 0 — JSON

**Package:** `@af/sweph-json`

Reads pre-generated CSV files (one per year) and interpolates planetary positions at runtime. No WASM, no native binaries, no network requests at calculation time.

- Cold start (first request in a Lambda container): 5–30ms (CSV parse + cache population)
- Warm (subsequent requests): <1ms
- Memory overhead: ~2MB per loaded year
- Accuracy: ±0.01–0.5° depending on body (Sun <0.01°, Moon <0.5° with daily data, <0.1° with 6-hourly)
- Lagna accuracy: ~0.3–0.5°

Suitable for: serverless cold-start budgets, Vercel edge functions, React Native without JSI, CI pipelines.

### Tier 1 — Lite

**Package:** `@af/sweph-lite`

Pure JavaScript using the `astronomy-engine` library. Computes planetary positions on demand without pre-generated data. Slower than JSON on warm paths but does not need data files.

- Latency: ~50ms per calculation
- Accuracy: good for planets and Sun/Moon; ayanamsa is approximated
- Lagna: NOT supported — the engine automatically signals `FeatureNotSupportedError`

Suitable for: environments where bundling CSV data is inconvenient, progressive enhancement.

### Tier 2 — WASM

**Package:** `@af/sweph-wasm`

The full Swiss Ephemeris library compiled to WebAssembly. Runs in browsers and any JS runtime that supports WASM. Loads the `.wasm` binary on first call (~100ms) and caches the module for subsequent calls.

- Latency: ~100ms first call (WASM init), ~5–20ms warm
- Accuracy: high (same algorithms as native)
- All features including Lagna and house systems supported

Suitable for: browser apps, Next.js client components, environments that cannot install native modules.

### Tier 3 — Native

**Package:** `@af/sweph-node`

C++ bindings to the Swiss Ephemeris library via Node.js native addons. Pre-built binaries are provided for linux-x64, linux-arm64, darwin-arm64, darwin-x64, and win32-x64.

- Latency: ~200ms including module load; subsequent calls ~5–10ms
- Accuracy: sub-arcsecond (the gold standard for Vedic calculations)
- All features supported

Suitable for: long-running Node.js servers, background jobs, professional chart generation.

---

## How `ICalculationEngine` is implemented

Every engine implements this interface from `@af/sweph-core`:

```typescript
interface ICalculationEngine {
  readonly tier: CalculationTier;        // JSON=0, FAST=1, WASM=2, NATIVE=3
  readonly name: string;
  readonly supportedFeatures: Set<string>;

  isAvailable(): Promise<boolean>;
  initialize(): Promise<void>;
  dispose(): void;

  calculatePlanets(date: Date, options?: CalculationOptions): Promise<Planet[]>;
  calculateLagna(date: Date, location: GeoLocation, options?: CalculationOptions): Promise<LagnaInfo>;
  calculateSunTimes(date: Date, location: GeoLocation): Promise<SunTimes>;
  calculateMoonPhase(date: Date): Promise<MoonPhase>;
  getAyanamsa(date: Date, type?: number): number;
}
```

Each engine declares which features it supports via `supportedFeatures`. If a feature is not in the set and you call the method, the engine throws `FeatureNotSupportedError`. A router layer can catch that and escalate to the next tier.

The `ISwephInstance` interface (from `@af/sweph-core`) is a higher-level wrapper used by the WASM and React Native packages. It adds `adapter`, `platform`, and utility methods (`dateToJulian`, `julianToDate`). The Node.js v2 API (`SwephInstance` from `@af/sweph`) provides the same methods plus `calculateRiseSet`, `calculateSolarNoon`, `calculateSunPath`, `calculateMoonData`, `calculateNextMoonPhases`, `clearCaches`, and `setCaching`.

---

## Feature matrix

| Feature | JSON | Lite | WASM | Node | React Native |
|---|:---:|:---:|:---:|:---:|:---:|
| Planet positions (Sun–Ketu) | Yes | Yes | Yes | Yes | Yes |
| Outer planets (Uranus, Neptune, Pluto) | No | No | Yes | Yes | Yes |
| Lagna / Ascendant | Approximate | No | Yes | Yes | No |
| House cusps (all systems) | No | No | Yes | Yes | No |
| Sunrise / Sunset | Yes | Yes | Yes | Yes | No |
| Solar noon | Yes | No | Yes | Yes | No |
| Sun path (azimuth/altitude) | No | No | No | Yes | No |
| Moon phase | Yes | Yes | Yes | Yes | Yes |
| Moon rise/set | No | No | Yes | Yes | No |
| Next moon phases | Yes | No | No | Yes | No |
| Planet rise/set/transit | No | No | Yes | Yes | No |
| Ayanamsa (exact) | No | No | Yes | Yes | Yes |
| Ayanamsa (approximated) | Yes | Yes | Yes | Yes | Yes |
| Multiple house systems | No | No | Yes | Yes | No |

---

## Writing environment-agnostic code

The recommended pattern is to program against `ICalculationEngine` and inject the engine at the call site.

```typescript
import type { ICalculationEngine, GeoLocation } from '@af/sweph-core';
import { EngineFeatures, FeatureNotSupportedError } from '@af/sweph-core';

async function getChart(engine: ICalculationEngine, date: Date, location: GeoLocation) {
  const planets = await engine.calculatePlanets(date, { ayanamsa: 1 });

  let lagna = null;
  if (engine.supportedFeatures.has(EngineFeatures.LAGNA)) {
    lagna = await engine.calculateLagna(date, location, { ayanamsa: 1 });
  }

  return { planets, lagna };
}
```

If you call a method the engine does not support, it throws `FeatureNotSupportedError`:

```typescript
import { FeatureNotSupportedError } from '@af/sweph-core';

try {
  const lagna = await engine.calculateLagna(date, location);
} catch (e) {
  if (e instanceof FeatureNotSupportedError) {
    // escalate to a higher tier or return null
  }
}
```

---

## When to escalate tiers

Use the lowest tier that satisfies your accuracy requirement:

| Situation | Use |
|---|---|
| Serverless function, any accuracy OK | JSON |
| Serverless function, sub-degree accuracy needed | JSON for fast path; lazy-load native for accuracy-critical requests |
| Browser, house systems required | WASM |
| Browser, only planets + moon | Lite or WASM |
| React Native | JSON (no native setup) or React Native package (JSI) |
| Professional chart printing | Native (Node.js server or background job) |
| CI / test fixtures | JSON |

A common production pattern is JSON-first with native escalation:

```typescript
async function calculateChart(date: Date, location: GeoLocation, highAccuracy = false) {
  if (!highAccuracy) {
    return jsonEngine.calculatePlanets(date, { ayanamsa: 1 });
  }

  // Dynamic import keeps native out of the cold-start path
  const _m = '@af/sweph/node';
  const mod = await import(/* webpackIgnore: true */ /* turbopackIgnore: true */ _m as string);
  const sweph = await mod.createSweph();
  return sweph.calculatePlanets(date, { ayanamsa: 1 });
}
```

See [docs/SERVERLESS_TROUBLESHOOTING.md](../SERVERLESS_TROUBLESHOOTING.md) for why the dynamic import pattern and `turbopackIgnore` comment are both required in Next.js environments.
