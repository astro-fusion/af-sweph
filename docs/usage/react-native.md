# React Native Usage Guide

`@af/sweph-react-native` provides planetary calculations in React Native via the JSI Turbo Module. For environments where native modules are not available (Expo managed workflow, CI), use `@af/sweph-json` instead.

---

## Choosing the right package

| Situation | Use |
|---|---|
| Expo bare workflow (can run native builds) | `@af/sweph-react-native` |
| Expo managed workflow (no custom native code) | `@af/sweph-json` |
| React Native CLI (full control) | `@af/sweph-react-native` |
| React Native + no native module setup | `@af/sweph-json` |
| CI / Detox / Jest | `@af/sweph-json` |

---

## Install — `@af/sweph-react-native`

```bash
pnpm add @af/sweph-react-native @af/sweph-core
```

For React Native CLI projects, run the native install:

```bash
cd ios && pod install
```

No additional Metro configuration is required. The Turbo Module is auto-linked on React Native 0.71+.

### Expo bare workflow

```bash
pnpm add @af/sweph-react-native @af/sweph-core
npx expo prebuild          # regenerates ios/ and android/ directories
cd ios && pod install
```

### Expo managed workflow

The React Native JSI module requires native code, which cannot be added in the managed workflow. Use `@af/sweph-json` instead — it has zero native dependencies and works in managed workflow without any config plugin.

```bash
pnpm add @af/sweph-json @af/sweph-core
```

---

## Usage — `@af/sweph-react-native`

```typescript
import { createSweph } from '@af/sweph-react-native';

const sweph = await createSweph({
  ephePath: undefined, // optional: override bundled ephemeris data path
});

const date = new Date();
const location = { latitude: 28.6139, longitude: 77.2090 };

// Planetary positions
const planets = sweph.calculatePlanets(date, { ayanamsa: 1 }); // Lahiri
const sun = planets.find(p => p.id === 'sun');
console.log(`Sun: ${sun?.longitude.toFixed(2)}° in ${sun?.rasi} (sign)`);

// Moon phase
const phase = sweph.calculateMoonPhase(date);
console.log(`${phase.phaseName} — ${(phase.illumination).toFixed(0)}% illuminated`);

// Ayanamsa
const ayanamsa = sweph.getAyanamsa(date, 1);
console.log(`Lahiri ayanamsa: ${ayanamsa.toFixed(4)}°`);
```

---

## Usage — `@af/sweph-json` (managed workflow / no native)

```typescript
import { createJsonSweph } from '@af/sweph-json';
import mainCsv2024 from './assets/ephemeris/2024/main.csv';
import moonCsv2024 from './assets/ephemeris/2024/moon.csv';

const sweph = createJsonSweph({
  preloadedData:     { 2024: mainCsv2024 },
  preloadedMoonData: { 2024: moonCsv2024 },
});

const planets = await sweph.calculatePlanets(new Date(), { ayanamsa: 1 });
const lagna   = await sweph.calculateLagna(new Date(), { latitude: 28.6, longitude: 77.2 });
```

Bundle the CSV files as static assets. With Metro, raw text imports work out of the box:

```javascript
// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
config.resolver.assetExts.push('csv');  // allow CSV as bundled asset

module.exports = config;
```

Then import as a string:

```typescript
// React Native asset import returns the asset URI, not the file content.
// Read the file via Expo FileSystem or bundle it as a JS string.

// Option 1: Import as raw string (requires metro transform configuration)
import mainCsv from './assets/ephemeris/2024/main.csv';

// Option 2: Use Expo FileSystem to read from the bundle directory
import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';

async function loadEphemeris(year: number): Promise<string> {
  const asset = Asset.fromModule(require(`./assets/ephemeris/${year}/main.csv`));
  await asset.downloadAsync();
  return FileSystem.readAsStringAsync(asset.localUri!);
}
```

---

## Supported features

| Feature | `@af/sweph-react-native` | `@af/sweph-json` |
|---|:---:|:---:|
| Planet positions | Yes | Yes |
| Lagna (ascendant) | No* | Approximate |
| House cusps | No | No |
| Sunrise / Sunset | No** | Yes |
| Moon phase | Yes | Yes |
| Moon rise/set | No | No |
| Ayanamsa (exact) | Yes | Approximate |

\* The React Native adapter does not implement `swe_houses` yet. Use `@af/sweph-wasm` in a DOM component (via `use-dom`) or a server-side API call for house calculations.

\*\* The `calculateSunTimes` stub in `@af/sweph-react-native` returns null values. Use `@af/sweph-json` for sunrise/sunset in React Native.

---

## TypeScript

All types come from `@af/sweph-core`:

```typescript
import type { Planet, MoonPhase, GeoLocation } from '@af/sweph-react-native';
// or
import type { Planet, MoonPhase, GeoLocation } from '@af/sweph-core';
```

---

## Generating ephemeris data for offline use

If you need data for multiple years bundled with the app:

```bash
# From the repository root
pnpm generate              # current year
pnpm generate:year -- 2025 # specific year
```

Output lands in `ephemeris_data/<year>/main.csv` and `moon.csv`. Copy these into your React Native `assets/` directory.

See [docs/usage/json-engine.md](json-engine.md) for the full data format specification and loader options.
