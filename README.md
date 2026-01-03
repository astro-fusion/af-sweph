# @af/sweph

The ultimate Swiss Ephemeris library for Vedic Astrology, supporting Node.js, Browser (WASM), and React Native with a unified API.

[![CI](https://github.com/astro-fusion/af-sweph/actions/workflows/ci.yml/badge.svg)](https://github.com/astro-fusion/af-sweph/actions/workflows/ci.yml)
[![Build](https://github.com/astro-fusion/af-sweph/actions/workflows/build.yml/badge.svg)](https://github.com/astro-fusion/af-sweph/actions/workflows/build.yml)

## 🌟 Features

- **✅ Auto-initialization** - Native module loads automatically
- **✅ TypeScript First** - Complete type safety with IntelliSense
- **✅ Vedic Astrology** - Ayanamsa, Rashis, Nakshatras built-in
- **✅ Multi-Platform** - Node.js, Browser (WASM), React Native
- **✅ Vercel Ready** - Pre-built binaries for serverless

## 🚀 Quick Start

### Installation

```bash
# npm
npm install @af/sweph

# pnpm
pnpm add @af/sweph

# Or from GitHub
pnpm add github:astro-fusion/af-sweph
```

### Usage

```typescript
import { createSweph, AYANAMSA } from '@af/sweph';

async function main() {
  // Create instance (auto-initializes native module)
  const sweph = await createSweph();

  // Calculate planetary positions
  const planets = await sweph.calculatePlanets(new Date(), {
    ayanamsa: AYANAMSA.LAHIRI,
    timezone: 5.75, // Nepal
  });

  console.log('Sun:', planets.find(p => p.id === 'sun'));
  console.log('Moon:', planets.find(p => p.id === 'moon'));

  // Calculate Lagna (Ascendant)
  const lagna = await sweph.calculateLagna(
    new Date(),
    { latitude: 27.7, longitude: 85.3, timezone: 5.75 },
    { ayanamsa: AYANAMSA.LAHIRI }
  );

  console.log('Ascendant:', lagna.longitude, 'in', sweph.RASHIS[lagna.rasi]);

  // Calculate Moon Phase
  const moonPhase = await sweph.calculateMoonPhase(new Date());
  console.log('Moon Phase:', moonPhase.phaseName, `(${Math.round(moonPhase.illumination * 100)}%)`);
}

main();
```

---

## 📦 API Reference

### `createSweph(options?): Promise<SwephInstance>`

Creates an auto-initialized Swiss Ephemeris instance.

```typescript
const sweph = await createSweph({
  ephePath: '/path/to/ephemeris', // Optional: custom ephemeris path
  preWarm: true, // Optional: pre-calculate to warm cache
});
```

### SwephInstance Methods

#### Planetary Calculations

```typescript
// All 9 Vedic planets
const planets = await sweph.calculatePlanets(date, {
  ayanamsa: 1, // Lahiri
  timezone: 0, // UTC
});

// Single planet (0=Sun, 1=Moon, 2=Mars, etc.)
const sun = await sweph.calculatePlanet(0, date, { ayanamsa: 1 });

// Rise, Set, Transit times
const riseSet = await sweph.calculateRiseSet(0, date, {
  latitude: 27.7,
  longitude: 85.3,
});
```

#### Lagna & Houses

```typescript
const lagna = await sweph.calculateLagna(
  date,
  { latitude: 27.7, longitude: 85.3 },
  { ayanamsa: 1 }
);

console.log(lagna.longitude); // Ascendant in degrees
console.log(lagna.rasi); // Ascendant sign (1-12)
console.log(lagna.houses); // Array of 12 house cusps
```

#### Sun Calculations

```typescript
// Sunrise, Sunset, Solar Noon
const sunTimes = await sweph.calculateSunTimes(date, location);

// Solar Noon with altitude
const noon = await sweph.calculateSolarNoon(date, location);

// Sun path throughout the day
const path = await sweph.calculateSunPath(date, location);
```

#### Moon Calculations

```typescript
// Moon data (position, rise/set, phase)
const moonData = await sweph.calculateMoonData(date, location);

// Current moon phase
const phase = await sweph.calculateMoonPhase(date);
console.log(phase.phaseName); // "Waxing Crescent", "Full Moon", etc.
console.log(phase.illumination); // 0.0 to 1.0

// Next moon phases
const nextPhases = await sweph.calculateNextMoonPhases(date);
console.log('Next New Moon:', nextPhases.newMoon);
console.log('Next Full Moon:', nextPhases.fullMoon);
```

#### Utilities

```typescript
// Get ayanamsa value
const ayanamsa = sweph.getAyanamsa(date, AYANAMSA.LAHIRI);

// Convert to Julian Day
const jd = sweph.dateToJulian(date);

// Set ephemeris path
sweph.setEphePath('/custom/path/to/ephe');
```

### Constants

```typescript
import { PLANETS, AYANAMSA, RASHIS, NAKSHATRAS } from '@af/sweph';

// Planet IDs
PLANETS.SUN;     // 0
PLANETS.MOON;    // 1
PLANETS.MARS;    // 4
PLANETS.MERCURY; // 2
PLANETS.JUPITER; // 5
PLANETS.VENUS;   // 3
PLANETS.SATURN;  // 6
PLANETS.RAHU;    // 10
PLANETS.KETU;    // 11

// Ayanamsa types
AYANAMSA.LAHIRI;       // 1 (default)
AYANAMSA.KRISHNAMURTI; // 5
AYANAMSA.RAMAN;        // 3

// Rashi names
RASHIS[1];  // "Aries"
RASHIS[4];  // "Cancer"
RASHIS[10]; // "Capricorn"

// Nakshatra names
NAKSHATRAS[1];  // "Ashwini"
NAKSHATRAS[14]; // "Chitra"
NAKSHATRAS[27]; // "Revati"
```

---

## 🏗️ Multi-Platform Architecture

| Package | Environment | Technology |
|---------|-------------|------------|
| `@af/sweph-node` | Node.js | Native C++ bindings |
| `@af/sweph-wasm` | Browser | WebAssembly |
| `@af/sweph-react-native` | Mobile | JSI/Turbo Modules |
| `@af/sweph-core` | All | Shared TypeScript |

---

## 🐛 Troubleshooting

### Module not found on Vercel

Ensure pre-built binaries are installed:
```bash
ls node_modules/@af/sweph/prebuilds/
# Should show: linux-x64/
```

### Native module errors

Set `NODE_VERSION=20` in your environment.

---

## 🤝 Contributing

```bash
git clone https://github.com/astro-fusion/af-sweph
cd af-sweph
pnpm install
pnpm -r build
pnpm -r test
```

## 📄 License

MIT

## ❤️ Credits

- [Swiss Ephemeris](https://www.astro.com/swisseph/) by Astrodienst AG
