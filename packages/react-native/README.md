# @af/sweph-react-native

React Native Swiss Ephemeris using Turbo Modules and JSI. Native C++ bindings for iOS and Android — no JavaScript bridge overhead, near-native performance.

## When to use this

Use `@af/sweph-react-native` when you need:
- High-accuracy calculations in an Expo bare workflow or React Native CLI app
- Lagna, house cusps, and planet rise/set on mobile
- The same API as the web/Node.js versions (no code changes when sharing logic)

If your RN app cannot use native modules (managed Expo), use `@af/sweph-json` instead — it requires no native linking.

## Installation

```bash
pnpm add @af/sweph-react-native @af/sweph-core
cd ios && pod install  # iOS
```

## Requirements

- React Native >= 0.73 (New Architecture / Turbo Modules)
- Expo SDK >= 50 with bare workflow
- iOS 14+ / Android API 24+

## Usage

```typescript
import { createSweph } from '@af/sweph-react-native';

const sweph = await createSweph();
const date  = new Date('1990-07-15T10:30:00Z');
const loc   = { latitude: 28.6139, longitude: 77.2090 };

// All 9 Vedic planets
const planets = await sweph.calculatePlanets(date, { ayanamsa: 1 });

// Lagna + houses
const lagna = await sweph.calculateLagna(date, loc, { ayanamsa: 1 });

// Sun times
const sun = await sweph.calculateSunTimes(date, loc);

// Moon phase
const moon = await sweph.calculateMoonPhase(date);
```

## Features

| Feature | Supported |
|---|---|
| Planets (9 Vedic) | ✅ Native accuracy |
| Lagna / Ascendant | ✅ |
| House cusps | ✅ |
| Sun times | ✅ |
| Moon phase + rise/set | ✅ |
| Planet rise/set | ✅ |
| Ayanamsa (exact) | ✅ |

## Using as an `ICalculationEngine`

```typescript
import { ReactNativeEngine } from '@af/sweph-react-native';
import type { ICalculationEngine } from '@af/sweph-core';

const engine: ICalculationEngine = new ReactNativeEngine();
await engine.initialize();
const planets = await engine.calculatePlanets(new Date());
```

## Fallback for managed Expo

If native modules are not available, fall back to `@af/sweph-json`:

```typescript
import type { ICalculationEngine } from '@af/sweph-core';

async function getEngine(): Promise<ICalculationEngine> {
  try {
    const { ReactNativeEngine } = await import('@af/sweph-react-native');
    const engine = new ReactNativeEngine();
    await engine.initialize();
    return engine;
  } catch {
    // Managed Expo or native module unavailable
    const { createJsonEngine, NodeFsLoader } = await import('@af/sweph-json');
    return createJsonEngine({ loader: new NodeFsLoader('./assets/ephemeris') });
  }
}
```

## Metro configuration

Add to `metro.config.js` to handle native module resolution:

```javascript
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
config.resolver.assetExts.push('node');

module.exports = config;
```

## Architecture

This package uses JSI (JavaScript Interface) for synchronous native function calls — no async bridge overhead. The C++ Swiss Ephemeris library is compiled and linked at app build time for both iOS (XCFramework) and Android (AAR).

## License

MIT
