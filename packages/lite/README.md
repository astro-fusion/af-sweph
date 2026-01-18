# @af/sweph-lite

Lightweight pure JavaScript astronomical calculations using `astronomy-engine`.

## Features

✅ **Planets** - Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn, Rahu, Ketu  
✅ **Sun Times** - Sunrise, Sunset, Solar Noon  
✅ **Moon Phase** - Current phase, illumination, age  
✅ **Ayanamsa** - Approximated Lahiri ayanamsa  

❌ **House Systems / Lagna** - Not supported (auto-escalates to WASM/Native)

## Usage

```typescript
import { createLiteSweph } from '@af/sweph-lite';

const sweph = await createLiteSweph();
const planets = await sweph.calculatePlanets(new Date(), { ayanamsa: 1 });

console.log('Sun:', planets.find(p => p.id === 'sun'));
```

## Architecture

This package implements the `ICalculationEngine` interface from `@af/sweph-core`. It's designed to be the **default, fastest tier** in the multi-tier SWEPH architecture.

When a feature is not supported (like Lagna/Houses), it throws `FeatureNotSupportedError`, which signals the router to automatically escalate to WASM or Native tier.
