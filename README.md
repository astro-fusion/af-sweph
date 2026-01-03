# @AstroFusion/sweph

Swiss Ephemeris library for Vedic astrology calculations with pre-built native binaries.

**✅ Vercel Compatible** - Works in serverless environments without native compilation.

## Features

- 🌟 **Vedic Astrology Focus** - Calculate all 9 Vedic planets (Navagraha)
- 🚀 **Pre-built Binaries** - No native compilation required
- ☁️ **Vercel Ready** - Works in serverless environments out of the box
- 📦 **Pre-compiled Distribution** - Ready-to-use dist files included
- 🌍 **Cross-Platform** - Works on macOS (Intel & ARM), Linux, and Windows
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

## Direct Usage (Pre-compiled)

For projects that need the pre-compiled distribution files directly:

```typescript
// Import from dist files (already compiled and included in repo)
import { calculatePlanets } from './path/to/astrofusion-sweph/dist/index.js';
import type { Planet } from './path/to/astrofusion-sweph/dist/types.d.ts';

// All distribution files are committed to git for direct usage
// No build step required for consuming projects
```

## API Reference

### Core Calculations

#### `calculatePlanets(date, options?)`
Calculate positions for all 9 Vedic planets (Navagraha).

```typescript
import { calculatePlanets, AYANAMSA, HOUSE_SYSTEMS } from '@AstroFusion/sweph';

const planets = calculatePlanets(new Date('1990-01-15T14:30:00'), {
  ayanamsa: AYANAMSA.LAHIRI, // or AYANAMSA.KRISHNAMURTI
  houseSystem: HOUSE_SYSTEMS.PLACIDUS,
  includeSpeed: true,
  location: {
    latitude: 27.7172,  // Kathmandu, Nepal
    longitude: 85.324,
    timezone: 5.75
  }
});

// Access planet data
const sun = planets.find(p => p.name === 'Sun');
if (sun) {
  console.log(`${sun.name}: ${sun.longitude}° in ${RASHIS[sun.rasi-1]?.name}`);
  console.log(`Retrograde: ${sun.isRetrograde}, Combust: ${sun.isCombust}`);
}
```

**Returns:** Array of `Planet` objects with ecliptic and horizontal coordinates.

#### `calculateSinglePlanet(planetId, date, options?)`
Calculate position for a specific celestial body.

```typescript
import { calculateSinglePlanet, PlanetId } from '@AstroFusion/sweph';

const mars = calculateSinglePlanet(PlanetId.MARS, new Date(), {
  ayanamsa: AYANAMSA.LAHIRI,
  location: { latitude: 40.7128, longitude: -74.0060, timezone: -5 }
});

if (mars) {
  console.log(`Mars: ${mars.longitude}° (${mars.azimuth}° azimuth)`);
}
```

**Parameters:**
- `planetId`: Swiss Ephemeris planet ID (0-9 for planets, 10-15 for points)
- `date`: Date for calculation
- `options`: Calculation options

### House Calculations

#### `calculateLagna(date, location, options?)`
Calculate Ascendant (Lagna) and all 12 house cusps for Vedic chart.

```typescript
import { calculateLagna, HOUSE_SYSTEMS, AYANAMSA } from '@AstroFusion/sweph';

const lagna = calculateLagna(new Date('1990-01-15T14:30:00'), {
  latitude: 27.7172,
  longitude: 85.324,
  timezone: 5.75
}, {
  ayanamsa: AYANAMSA.LAHIRI,
  houseSystem: HOUSE_SYSTEMS.WHOLE_SIGN
});

console.log(`Ascendant: ${lagna.rasi}°${lagna.degree.toFixed(2)}' in ${RASHIS[lagna.rasi-1]?.name}`);
console.log(`Midheaven (MC): ${lagna.houses[9]?.toFixed(2)}°`);
```

**Returns:** `LagnaInfo` object with ascendant details and house cusps array.

#### `calculateHouses(date, location, options?)`
Calculate house cusps only (convenience function).

```typescript
const birthDate = new Date('1990-01-15T14:30:00');
const location = { latitude: 27.7172, longitude: 85.324, timezone: 5.75 };
const houses = calculateHouses(birthDate, location);
console.log(`1st House: ${houses[0]}°, 7th House: ${houses[6]}°`);
```

#### `getHousePosition(planetLongitude, houses)`
Determine which house a planet occupies.

```typescript
const lagna = calculateLagna(birthDate, location);
const planets = calculatePlanets(birthDate);
const sunHouse = getHousePosition(planets[0].longitude, lagna.houses);
console.log(`Sun is in house ${sunHouse}`);
```

### Solar Calculations

#### `calculateSunTimes(date, location)`
Calculate sunrise, sunset, and twilight times.

```typescript
const sunTimes = calculateSunTimes(new Date(), {
  latitude: 51.5074,  // London
  longitude: -0.1278,
  timezone: 0
});

console.log(`Sunrise: ${sunTimes.sunrise?.toLocaleTimeString()}`);
console.log(`Sunset: ${sunTimes.sunset?.toLocaleTimeString()}`);
console.log(`Day length: ${sunTimes.dayLength.toFixed(1)} hours`);
console.log(`Civil twilight: ${sunTimes.civilTwilightStart} - ${sunTimes.civilTwilightEnd}`);
```

#### `calculateSolarNoon(date, location)`
Calculate solar noon and sun's altitude at meridian.

```typescript
const solarNoon = calculateSolarNoon(new Date(), location);
console.log(`Solar noon: ${solarNoon.time.toLocaleTimeString()}`);
console.log(`Sun altitude: ${solarNoon.altitude.toFixed(1)}°`);
```

#### `calculateSunPath(date, location)`
Get sun's position every hour throughout the day.

```typescript
const sunPath = calculateSunPath(new Date(), location);
sunPath.forEach(pos => {
  console.log(`${pos.time.getHours()}:00 - Altitude: ${pos.altitude.toFixed(1)}°, Azimuth: ${pos.azimuth.toFixed(1)}°`);
});
```

### Lunar Calculations

#### `calculateMoonData(date, location)`
Calculate moonrise, moonset, phase, and illumination.

```typescript
const moonData = calculateMoonData(new Date(), location);
console.log(`Moonrise: ${moonData.moonrise?.toLocaleTimeString()}`);
console.log(`Phase: ${moonData.phaseName} (${moonData.illumination.toFixed(1)}%)`);
console.log(`Moon age: ${moonData.age.toFixed(1)} days`);
```

#### `calculateMoonPhase(date)`
Calculate current moon phase details.

```typescript
const phase = calculateMoonPhase(new Date());
console.log(`Phase angle: ${phase.phase.toFixed(1)}°`);
console.log(`Illumination: ${phase.illumination.toFixed(1)}%`);
console.log(`Age: ${phase.age.toFixed(1)} days since new moon`);
```

#### `calculateNextMoonPhases(date)`
Get dates of upcoming lunar phases.

```typescript
const phases = calculateNextMoonPhases(new Date());
console.log(`Next Full Moon: ${phases.fullMoon.toDateString()}`);
console.log(`Next New Moon: ${phases.newMoon.toDateString()}`);
```

### Rise/Set Times

#### `calculatePlanetRiseSetTimes(planetId, date, location)`
Calculate rise, set, and transit times for any celestial body.

```typescript
const moonTimes = calculatePlanetRiseSetTimes(1, new Date(), location); // 1 = Moon
console.log(`Moonrise: ${moonTimes.rise?.toLocaleTimeString()}`);
console.log(`Moonset: ${moonTimes.set?.toLocaleTimeString()}`);
console.log(`Transit: ${moonTimes.transit?.toLocaleTimeString()}`);
```

### Utility Functions

#### `getAyanamsa(date, ayanamsaType?)`
Get the ayanamsa correction value.

```typescript
import { getAyanamsa, AYANAMSA } from '@AstroFusion/sweph';

const ayanamsa = getAyanamsa(new Date(), AYANAMSA.LAHIRI);
console.log(`Lahiri ayanamsa: ${ayanamsa.toFixed(4)}°`);
```

#### `setEphemerisPath(path)`
Set custom path to Swiss Ephemeris data files.

```typescript
// Set custom ephemeris path before calculations
setEphemerisPath('/custom/path/to/ephemeris');
```

#### `dateToJulian(date)` / `julianToDate(jd, timezone?)`
Convert between JavaScript Date and Julian Day numbers.

```typescript
import { dateToJulian, julianToDate } from '@AstroFusion/sweph';

const jd = dateToJulian(new Date());
const date = julianToDate(jd + 1); // Tomorrow
```

### Legacy Compatibility

The library includes legacy functions for migration from older @astrofusion/sweph packages:

```typescript
import { createSwephCalculator, calculateKundaliPageData } from '@AstroFusion/sweph';

const birthDate = new Date('1990-01-15T14:30:00');
const timezone = 5.75;
const location = { latitude: 27.7172, longitude: 85.324, timezone: 5.75 };

// Legacy calculator interface
const calculator = createSwephCalculator();
const planets = await calculator.calculateAllPlanetPositions(birthDate, timezone);

// Complete kundali data
const kundaliData = await calculateKundaliPageData(birthDate, location);
```

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

## Advanced Usage

### Creating a Birth Chart (Kundali)

```typescript
import {
  calculatePlanets,
  calculateLagna,
  getHousePosition,
  getNakshatra,
  AYANAMSA,
  HOUSE_SYSTEMS,
  RASHIS,
  NAKSHATRAS
} from '@AstroFusion/sweph';

function createBirthChart(birthDate: Date, location: GeoLocation) {
  // Calculate all components
  const planets = calculatePlanets(birthDate, {
    ayanamsa: AYANAMSA.LAHIRI,
    houseSystem: HOUSE_SYSTEMS.PLACIDUS,
    includeSpeed: true,
    location
  });

  const lagna = calculateLagna(birthDate, location, {
    ayanamsa: AYANAMSA.LAHIRI,
    houseSystem: HOUSE_SYSTEMS.PLACIDUS
  });

  // Create chart data
  const chart = {
    lagna: {
      longitude: lagna.longitude,
      rasi: RASHIS[lagna.rasi - 1],
      degree: lagna.degree
    },
    planets: planets.map(planet => ({
      ...planet,
      house: getHousePosition(planet.longitude, lagna.houses),
      nakshatra: NAKSHATRAS.find(n => n.number === getNakshatra(planet.longitude).number)
    })),
    houses: lagna.houses.map((cusp, index) => ({
      number: index + 1,
      longitude: cusp,
      rasi: RASHIS[Math.floor(cusp / 30)]
    }))
  };

  return chart;
}
```

### Comparing Ayanamsa Systems

```typescript
import { calculatePlanets, AYANAMSA } from '@AstroFusion/sweph';

const birthDate = new Date('1990-01-15T14:30:00');

// Compare different ayanamsa systems
const lahiriPlanets = calculatePlanets(birthDate, { ayanamsa: AYANAMSA.LAHIRI });
const krishnamurtiPlanets = calculatePlanets(birthDate, { ayanamsa: AYANAMSA.KRISHNAMURTI });

const sunLahiri = lahiriPlanets.find(p => p.name === 'Sun');
const sunKP = krishnamurtiPlanets.find(p => p.name === 'Sun');

if (sunLahiri && sunKP) {
  console.log(`Sun position (Lahiri): ${sunLahiri.longitude.toFixed(2)}°`);
  console.log(`Sun position (KP): ${sunKP.longitude.toFixed(2)}°`);
  console.log(`Difference: ${(sunKP.longitude - sunLahiri.longitude).toFixed(2)}°`);
}
```

### Moon Phase Tracking

```typescript
import { calculateMoonPhase, calculateNextMoonPhases } from '@AstroFusion/sweph';

// Current moon phase
const currentPhase = calculateMoonPhase(new Date());
console.log(`Current: ${currentPhase.phaseName} (${currentPhase.illumination.toFixed(1)}%)`);

// Upcoming phases
const nextPhases = calculateNextMoonPhases(new Date());
console.log(`Next Full Moon: ${nextPhases.fullMoon.toLocaleDateString()}`);
console.log(`Next New Moon: ${nextPhases.newMoon.toLocaleDateString()}`);

// Moon phase calendar for next month
function getMoonCalendar(startDate: Date, days: number) {
  const calendar = [];
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const phase = calculateMoonPhase(date);
    calendar.push({
      date: date.toDateString(),
      phase: phase.phaseName,
      illumination: phase.illumination
    });
  }
  return calendar;
}
```

### Solar Events and Day Length

```typescript
import { calculateSunTimes, calculateSunPath } from '@AstroFusion/sweph';

function analyzeDaylight(date: Date, location: GeoLocation) {
  const sunTimes = calculateSunTimes(date, location);
  const sunPath = calculateSunPath(date, location);

  return {
    sunrise: sunTimes.sunrise,
    sunset: sunTimes.sunset,
    dayLength: sunTimes.dayLength,
    maxAltitude: Math.max(...sunPath.map(p => p.altitude)),
    twilight: {
      civil: {
        start: sunTimes.civilTwilightStart,
        end: sunTimes.civilTwilightEnd
      },
      nautical: {
        start: sunTimes.nauticalTwilightStart,
        end: sunTimes.nauticalTwilightEnd
      }
    }
  };
}

// Compare summer vs winter solstice
const summerSolstice = analyzeDaylight(new Date('2024-06-21'), { latitude: 51.5074, longitude: -0.1278, timezone: 0 });
const winterSolstice = analyzeDaylight(new Date('2024-12-21'), { latitude: 51.5074, longitude: -0.1278, timezone: 0 });

console.log(`Summer day length: ${summerSolstice.dayLength.toFixed(1)} hours`);
console.log(`Winter day length: ${winterSolstice.dayLength.toFixed(1)} hours`);
```

## Configuration

### Custom Ephemeris Path

```typescript
import { setEphemerisPath } from '@AstroFusion/sweph';

// Use custom ephemeris files
setEphemerisPath('/path/to/custom/ephemeris');

// Now all calculations will use the custom path
const planets = calculatePlanets(new Date());
```

### Timezone Handling

```typescript
// Always work in local time for input dates
const birthDate = new Date('1990-01-15T14:30:00'); // 2:30 PM local time

const location = {
  latitude: 27.7172,
  longitude: 85.324,
  timezone: 5.75 // Nepal Time (UTC+5:45)
};

// Library handles timezone conversion internally
const planets = calculatePlanets(birthDate, { location });
const lagna = calculateLagna(birthDate, location);
```

## Error Handling

```typescript
import { calculatePlanets, calculateLagna } from '@AstroFusion/sweph';

try {
  const planets = calculatePlanets(new Date(), {
    location: { latitude: 90, longitude: 0, timezone: 0 } // Valid location
  });
} catch (error) {
  console.error('Calculation failed:', error.message);
  // Handle error appropriately
}

// Check for null results (e.g., polar regions where sun doesn't rise/set)
const sunTimes = calculateSunTimes(new Date(), {
  latitude: 80, // Near north pole
  longitude: 0,
  timezone: 0
});

if (!sunTimes.sunrise) {
  console.log('Sun does not rise at this location today (midnight sun)');
}

if (!sunTimes.sunset) {
  console.log('Sun does not set at this location today (polar day)');
}
```

## TypeScript Support

The library is written in TypeScript and provides full type definitions:

```typescript
import type {
  Planet,
  LagnaInfo,
  SunTimes,
  MoonData,
  GeoLocation,
  CalculationOptions
} from '@AstroFusion/sweph';

// All types are exported for use in your application
function processChart(planets: Planet[], lagna: LagnaInfo) {
  // Type-safe processing
}
```

## Performance Considerations

- **Caching**: For multiple calculations with the same date, consider caching results
- **Batch Processing**: Use `calculatePlanets()` instead of multiple `calculateSinglePlanet()` calls
- **Minimal Options**: Only specify `location` when you need horizontal coordinates

```typescript
// Efficient: single call for all planets
const planets = calculatePlanets(date, { ayanamsa: AYANAMSA.LAHIRI });

// Less efficient: multiple separate calls
const sun = calculateSinglePlanet(0, date);
const moon = calculateSinglePlanet(1, date);
// ... etc
```

## Repository Structure

```
├── dist/              # Pre-compiled JavaScript (committed to git)
├── src/               # TypeScript source code
├── prebuilds/         # Pre-built native binaries (committed to git)
├── ephe/              # Swiss Ephemeris data files (committed to git)
├── native/            # Native addon source
└── build/             # Build configuration
```

**Distribution files are committed to git** to enable direct usage by other projects without requiring a build step.

## Supported Platforms

| Platform | Architecture | Status |
|----------|--------------|--------|
| macOS | ARM64 (M1/M2) | ✅ |
| macOS | x64 (Intel) | ✅ |
| Linux | x64 | ✅ |
| Linux | ARM64 | ✅ |
| Windows | x64 | ✅ |

## Vercel Deployment

This library is designed to work seamlessly on Vercel's serverless environment:

- ✅ **No native compilation** - Pre-built binaries for linux-x64 included
- ✅ **Zero configuration** - Works out of the box
- ✅ **Optimized for serverless** - Fast cold starts with minimal bundle impact

### Usage in Next.js API Routes

```typescript
// app/api/calculate/route.ts
import { calculatePlanets, calculateLagna } from '@af/sweph';

export async function GET() {
  const planets = calculatePlanets(new Date());
  return Response.json({ planets });
}
```

### Debug Platform Info

```typescript
import { getPlatformInfo, hasPrebuilds } from '@af/sweph';

// Check platform detection
console.log(getPlatformInfo());
// { platform: 'linux', arch: 'x64', key: 'linux-x64', isSupported: true, ... }

console.log('Has prebuilds:', hasPrebuilds());
// true
```

## Troubleshooting

### Common Issues

1. **"Failed to load Swiss Ephemeris native module"**
   - Ensure package version is >= 0.2.0 for Vercel compatibility
   - Check that prebuilt binaries are available for your platform
   - For development: `pnpm add swisseph-v2` (optional fallback)

2. **Vercel deployment fails with "Cannot find module swisseph.node"**
   - Upgrade to `@af/sweph@0.2.0` or later
   - Clear Vercel build cache and redeploy
   - Verify `node_modules/@af/sweph/prebuilds/linux-x64/swisseph.node` exists.

3. **"Ephemeris files not found"**
   - Ensure `ephe/` directory exists with `.se1` files
   - Or set custom path: `setEphemerisPath('/path/to/ephe')`

4. **Incorrect times**
   - Verify timezone offset is correct (e.g., 5.5 for IST, -5 for EST)
   - Ensure input dates are in local time

5. **Null rise/set times**
   - Normal for polar regions during certain seasons
   - Moon may not rise/set on some days near equator


## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes with proper TypeScript types
4. Add tests for new functionality
5. Run the test suite: `npm test`
6. Submit a pull request

### Development Setup

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test

# Development with watch mode
npm run test:watch
```

## License

MIT

## Credits

- [Swiss Ephemeris](https://www.astro.com/swisseph/) by Astrodienst AG
- [swisseph-v2](https://github.com/nickhealthy/swisseph-v2) for Node.js bindings
