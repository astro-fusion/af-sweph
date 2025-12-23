# @AstroFusion/sweph

Swiss Ephemeris library for Vedic astrology calculations with pre-built native binaries.

## Features

- 🌟 **Vedic Astrology Focus** - Calculate all 9 Vedic planets (Navagraha)
- 🚀 **Pre-built Binaries** - No native compilation required
- 🌍 **Cross-Platform** - Works on macOS, Linux, and Windows
- 📦 **Simple API** - Clean, TypeScript-first interface
- ⚡ **Fast** - Native Swiss Ephemeris performance

## Installation

```bash
npm install @AstroFusion/sweph
# or
pnpm add @AstroFusion/sweph
# or
yarn add @AstroFusion/sweph
```

## Quick Start

```typescript
import { 
  calculatePlanets, 
  calculateLagna, 
  calculateSunTimes,
  calculateMoonData 
} from '@AstroFusion/sweph';

// Calculate planetary positions
const planets = calculatePlanets(new Date());
console.log(planets);

// Calculate Lagna (Ascendant)
const location = { latitude: 27.7172, longitude: 85.324, timezone: 5.75 };
const lagna = calculateLagna(new Date(), location);
console.log(`Ascendant: ${lagna.rasi} at ${lagna.degree.toFixed(2)}°`);

// Get sunrise/sunset
const sunTimes = calculateSunTimes(new Date(), location);
console.log(`Sunrise: ${sunTimes.sunrise}`);
console.log(`Sunset: ${sunTimes.sunset}`);

// Get moon phase
const moon = calculateMoonData(new Date(), location);
console.log(`Moon Phase: ${moon.phaseName} (${moon.illumination.toFixed(1)}%)`);
```

## API Reference

### Planet Calculations

#### `calculatePlanets(date, options?)`
Calculate positions for all 9 Vedic planets.

```typescript
const planets = calculatePlanets(new Date(), {
  ayanamsa: 1, // Lahiri (default)
  includeSpeed: true
});
```

#### `calculateSinglePlanet(planetId, date, options?)`
Calculate position for a single planet.

### House Calculations

#### `calculateLagna(date, location, options?)`
Calculate Ascendant (Lagna) and house cusps.

```typescript
const lagna = calculateLagna(new Date(), {
  latitude: 27.7172,
  longitude: 85.324,
  timezone: 5.75
});
```

### Sun Calculations

#### `calculateSunTimes(date, location)`
Calculate sunrise, sunset, and twilight times.

#### `calculateSolarNoon(date, location)`
Calculate solar noon (meridian transit).

### Moon Calculations

#### `calculateMoonData(date, location)`
Calculate moonrise, moonset, and phase information.

#### `calculateMoonPhase(date)`
Calculate current moon phase.

#### `calculateNextMoonPhases(date)`
Get dates of upcoming moon phases.

### Utility Functions

#### `getAyanamsa(date, ayanamsaType?)`
Get the ayanamsa value for a date.

#### `setEphemerisPath(path)`
Set custom path to ephemeris data files.

## Ayanamsa Options

```typescript
import { AYANAMSA } from '@AstroFusion/sweph';

// Available ayanamsas
AYANAMSA.LAHIRI          // 1 (default)
AYANAMSA.KRISHNAMURTI    // 5
AYANAMSA.RAMAN           // 3
AYANAMSA.TRUE_CITRA      // 27
// ... and more
```

## House Systems

```typescript
import { HOUSE_SYSTEMS } from '@AstroFusion/sweph';

HOUSE_SYSTEMS.PLACIDUS     // 'P' (default)
HOUSE_SYSTEMS.WHOLE_SIGN   // 'W'
HOUSE_SYSTEMS.EQUAL        // 'E'
HOUSE_SYSTEMS.SRIPATI      // 'S'
// ... and more
```

## Supported Platforms

| Platform | Architecture | Status |
|----------|--------------|--------|
| macOS | ARM64 (M1/M2) | ✅ |
| macOS | x64 (Intel) | ✅ |
| Linux | x64 | ✅ |
| Linux | ARM64 | ✅ |
| Windows | x64 | ✅ |

## License

MIT

## Credits

- [Swiss Ephemeris](https://www.astro.com/swisseph/) by Astrodienst AG
- [swisseph-v2](https://github.com/nickhealthy/swisseph-v2) for Node.js bindings
