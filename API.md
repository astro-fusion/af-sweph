# @AstroFusion/sweph API Reference

This document provides comprehensive API documentation for the @AstroFusion/sweph library.

## Table of Contents

- [Core Functions](#core-functions)
- [Planet Calculations](#planet-calculations)
- [House Calculations](#house-calculations)
- [Solar Calculations](#solar-calculations)
- [Lunar Calculations](#lunar-calculations)
- [Rise/Set Calculations](#riseset-calculations)
- [Utility Functions](#utility-functions)
- [Legacy Functions](#legacy-functions)
- [Types](#types)

## Core Functions

### `calculatePlanets(date, options?)`

Calculate positions for all 9 Vedic planets.

**Signature:**
```typescript
function calculatePlanets(
  date: Date,
  options?: CalculationOptions
): Planet[]
```

**Parameters:**
- `date: Date` - Date and time for calculation (local time)
- `options?: CalculationOptions` - Optional calculation options

**Returns:** `Planet[]` - Array of planet position objects

**Options:**
```typescript
interface CalculationOptions {
  ayanamsa?: number;        // Ayanamsa system (default: 1 = Lahiri)
  houseSystem?: string;     // House calculation system (default: 'P' = Placidus)
  includeSpeed?: boolean;   // Include retrograde/speed calculations (default: true)
  location?: GeoLocation;   // Location for horizontal coordinates
}
```

---

### `calculateSinglePlanet(planetId, date, options?)`

Calculate position for a single celestial body.

**Signature:**
```typescript
function calculateSinglePlanet(
  planetId: number,
  date: Date,
  options?: CalculationOptions
): Planet | null
```

**Parameters:**
- `planetId: number` - Swiss Ephemeris planet ID (0-9 for planets, 10-15 for points)
- `date: Date` - Date and time for calculation (local time)
- `options?: CalculationOptions` - Optional calculation options

**Returns:** `Planet | null` - Planet position object or null if calculation fails

---

### `calculatePlanetRiseSetTimes(planetId, date, location)`

Calculate rise, set, and transit times for any celestial body.

**Signature:**
```typescript
function calculatePlanetRiseSetTimes(
  planetId: number,
  date: Date,
  location: GeoLocation
): {
  rise: Date | null;
  set: Date | null;
  transit: Date | null;
  transitAltitude: number;
  transitDistance: number;
}
```

**Parameters:**
- `planetId: number` - Swiss Ephemeris planet ID
- `date: Date` - Date for calculation (local time)
- `location: GeoLocation` - Geographic location

**Returns:** Object containing rise/set/transit times and transit details

## House Calculations

### `calculateLagna(date, location, options?)`

Calculate Ascendant (Lagna) and house cusps.

**Signature:**
```typescript
function calculateLagna(
  date: Date,
  location: GeoLocation,
  options?: CalculationOptions
): LagnaInfo
```

**Parameters:**
- `date: Date` - Birth date and time (local time)
- `location: GeoLocation` - Birth location coordinates
- `options?: CalculationOptions` - Calculation options

**Returns:** `LagnaInfo` - Ascendant and house cusp information

---

### `calculateHouses(date, location, options?)`

Calculate house cusps only.

**Signature:**
```typescript
function calculateHouses(
  date: Date,
  location: GeoLocation,
  options?: CalculationOptions
): number[]
```

**Parameters:**
- `date: Date` - Date and time for calculation (local time)
- `location: GeoLocation` - Geographic location
- `options?: CalculationOptions` - Calculation options

**Returns:** `number[]` - Array of 12 house cusp longitudes (0°-360°)

---

### `getHousePosition(planetLongitude, houses)`

Determine which house a planet occupies.

**Signature:**
```typescript
function getHousePosition(
  planetLongitude: number,
  houses: number[]
): number
```

**Parameters:**
- `planetLongitude: number` - Planet's ecliptic longitude (0-360°)
- `houses: number[]` - Array of 12 house cusp longitudes

**Returns:** `number` - House number (1-12)

## Solar Calculations

### `calculateSunTimes(date, location)`

Calculate sunrise, sunset, and twilight times.

**Signature:**
```typescript
function calculateSunTimes(
  date: Date,
  location: GeoLocation
): SunTimes
```

**Parameters:**
- `date: Date` - Date for calculation (local time)
- `location: GeoLocation` - Geographic location

**Returns:** `SunTimes` - Sunrise, sunset, and twilight information

---

### `calculateSolarNoon(date, location)`

Calculate solar noon and sun altitude.

**Signature:**
```typescript
function calculateSolarNoon(
  date: Date,
  location: GeoLocation
): SolarNoonResult
```

**Parameters:**
- `date: Date` - Date for calculation
- `location: GeoLocation` - Geographic location

**Returns:** `SolarNoonResult` - Solar noon time and altitude

---

### `calculateSunPath(date, location)`

Calculate sun's position every hour.

**Signature:**
```typescript
function calculateSunPath(
  date: Date,
  location: GeoLocation
): Array<{
  time: Date;
  azimuth: number;
  altitude: number;
}>
```

**Parameters:**
- `date: Date` - Date for calculation
- `location: GeoLocation` - Geographic location

**Returns:** Array of hourly sun positions

## Lunar Calculations

### `calculateMoonData(date, location)`

Calculate moonrise, moonset, and phase.

**Signature:**
```typescript
function calculateMoonData(
  date: Date,
  location: GeoLocation
): MoonData
```

**Parameters:**
- `date: Date` - Date for calculation (local time)
- `location: GeoLocation` - Geographic location

**Returns:** `MoonData` - Moon rise/set times and phase information

---

### `calculateMoonPhase(date)`

Calculate current moon phase details.

**Signature:**
```typescript
function calculateMoonPhase(date: Date): {
  phase: number;
  illumination: number;
  age: number;
  phaseName: string;
}
```

**Parameters:**
- `date: Date` - Date for moon phase calculation

**Returns:** Object with phase angle, illumination, age, and name

---

### `calculateNextMoonPhases(date)`

Get dates of upcoming moon phases.

**Signature:**
```typescript
function calculateNextMoonPhases(date: Date): NextMoonPhases
```

**Parameters:**
- `date: Date` - Starting date

**Returns:** `NextMoonPhases` - Dates of next lunar phases

## Utility Functions

### `getAyanamsa(date, ayanamsaType?)`

Get ayanamsa correction value.

**Signature:**
```typescript
function getAyanamsa(
  date: Date,
  ayanamsaType?: number
): number
```

**Parameters:**
- `date: Date` - Date for ayanamsa calculation
- `ayanamsaType?: number` - Ayanamsa system (default: 1 = Lahiri)

**Returns:** `number` - Ayanamsa value in degrees

---

### `setEphemerisPath(path)`

Set custom ephemeris data path.

**Signature:**
```typescript
function setEphemerisPath(path: string): void
```

**Parameters:**
- `path: string` - Directory path containing ephemeris files

---

### `dateToJulian(date)`

Convert Date to Julian Day number.

**Signature:**
```typescript
function dateToJulian(date: Date): number
```

**Parameters:**
- `date: Date` - JavaScript Date object

**Returns:** `number` - Julian Day number

---

### `julianToDate(jd, timezoneOffset?)`

Convert Julian Day to Date.

**Signature:**
```typescript
function julianToDate(
  jd: number,
  timezoneOffset?: number
): Date
```

**Parameters:**
- `jd: number` - Julian Day number
- `timezoneOffset?: number` - Timezone offset in hours

**Returns:** `Date` - JavaScript Date object

---

### `normalizeLongitude(longitude)`

Normalize longitude to 0-360° range.

**Signature:**
```typescript
function normalizeLongitude(longitude: number): number
```

**Parameters:**
- `longitude: number` - Longitude value (any number)

**Returns:** `number` - Normalized longitude (0-360°)

---

### `getRashi(longitude)`

Get rashi (zodiac sign) from longitude.

**Signature:**
```typescript
function getRashi(longitude: number): number
```

**Parameters:**
- `longitude: number` - Ecliptic longitude

**Returns:** `number` - Rashi number (1-12)

---

### `getRashiDegree(longitude)`

Get degree within rashi.

**Signature:**
```typescript
function getRashiDegree(longitude: number): number
```

**Parameters:**
- `longitude: number` - Ecliptic longitude

**Returns:** `number` - Degree within rashi (0-30)

---

### `isRetrograde(speed)`

Check if planet is retrograde.

**Signature:**
```typescript
function isRetrograde(speed: number): boolean
```

**Parameters:**
- `speed: number` - Planet's daily motion in degrees

**Returns:** `boolean` - True if retrograde

---

### `getNakshatra(longitude)`

Get nakshatra from longitude.

**Signature:**
```typescript
function getNakshatra(longitude: number): {
  number: number;
  pada: number;
}
```

**Parameters:**
- `longitude: number` - Ecliptic longitude

**Returns:** Object with nakshatra number (1-27) and pada (1-4)

## Legacy Functions

### `createSwephCalculator()`

Create legacy calculator instance.

**Signature:**
```typescript
function createSwephCalculator(): PlanetaryCalculationProvider
```

**Returns:** `PlanetaryCalculationProvider` - Legacy calculator interface

---

### `calculateKundaliPageData(birthDate, location, options?)`

Calculate complete kundali data (legacy).

**Signature:**
```typescript
function calculateKundaliPageData(
  birthDate: Date,
  location: GeoLocation,
  options?: CalculationOptions
): Promise<{
  planets: Planet[];
  lagna: LagnaInfo;
  sunTimes: SunTimes;
  moonData: MoonData;
}>
```

**Parameters:**
- `birthDate: Date` - Birth date and time
- `location: GeoLocation` - Birth location
- `options?: CalculationOptions` - Calculation options

**Returns:** Promise resolving to complete kundali data

## Types

### Core Types

```typescript
interface GeoLocation {
  latitude: number;      // -90 to 90
  longitude: number;     // -180 to 180
  timezone?: number;     // Hours from UTC (e.g., 5.75)
}

interface Planet {
  id: string;            // Planet identifier
  name: string;          // Planet name
  longitude: number;     // Ecliptic longitude (0-360°)
  latitude: number;      // Ecliptic latitude
  distance: number;      // Distance from Earth (AU)
  speed: number;         // Daily motion (negative = retrograde)
  rasi: number;          // Rashi number (1-12)
  rasiDegree: number;    // Degree within rashi (0-30)
  houseNumber?: number;  // House number if calculated
  isRetrograde: boolean; // Retrograde status
  azimuth?: number;      // Horizontal azimuth (0°=North)
  altitude?: number;     // Horizontal altitude
  isCombust?: boolean;   // Too close to Sun
  totalDegree?: number;  // Legacy alias for longitude
}

interface LagnaInfo {
  longitude: number;     // Ascendant longitude
  rasi: number;          // Ascendant rashi (1-12)
  degree: number;        // Degree within rashi (0-30)
  houses: number[];      // 12 house cusps
  ayanamsaValue: number; // Ayanamsa used
  lagna?: number;        // Legacy alias
  lagnaRasi?: number;    // Legacy alias
  lagnaDegree?: number;  // Legacy alias
  julianDay?: number;    // Julian day of calculation
}
```

### Solar Types

```typescript
interface SunTimes {
  sunrise: Date;
  sunset: Date;
  solarNoon: Date;
  dayLength: number;         // Hours
  civilTwilightStart: Date | null;
  civilTwilightEnd: Date | null;
  nauticalTwilightStart: Date | null;
  nauticalTwilightEnd: Date | null;
  astronomicalTwilightStart?: Date | null;
  astronomicalTwilightEnd?: Date | null;
}

interface SolarNoonResult {
  time: Date;           // Solar noon time
  altitude: number;     // Sun altitude at noon
}
```

### Lunar Types

```typescript
interface MoonData {
  moonrise: Date | null;
  moonset: Date | null;
  phase: number;        // Phase angle (0-360°)
  illumination: number; // Percentage illuminated (0-100)
  age: number;          // Days since new moon (0-29.5)
  phaseName: string;    // Phase name
}

interface NextMoonPhases {
  newMoon: Date;
  firstQuarter: Date;
  fullMoon: Date;
  lastQuarter: Date;
}
```

### Configuration Types

```typescript
interface CalculationOptions {
  ayanamsa?: number;      // Ayanamsa system
  houseSystem?: string;   // House calculation system
  includeSpeed?: boolean; // Include speed calculations
  location?: GeoLocation; // Location for topocentric calculations
}

enum PlanetId {
  SUN = 0,
  MOON = 1,
  MERCURY = 2,
  VENUS = 3,
  MARS = 4,
  JUPITER = 5,
  SATURN = 6,
  URANUS = 7,
  NEPTUNE = 8,
  PLUTO = 9,
  MEAN_NODE = 10,     // Rahu (mean)
  TRUE_NODE = 11,     // Rahu (true)
  MEAN_APOGEE = 12,   // Lilith
  CHIRON = 15
}

enum AyanamsaType {
  FAGAN_BRADLEY = 0,
  LAHIRI = 1,
  DELUCE = 2,
  RAMAN = 3,
  USHASHASHI = 4,
  KRISHNAMURTI = 5,
  DJWHAL_KHUL = 6,
  YUKTESHWAR = 7,
  JN_BHASIN = 8,
  // ... and more
}

enum HouseSystem {
  PLACIDUS = 'P',
  KOCH = 'K',
  REGIOMONTANUS = 'R',
  CAMPANUS = 'C',
  EQUAL = 'E',
  VEHLOW_EQUAL = 'V',
  WHOLE_SIGN = 'W',
  MERIDIAN = 'X',
  HORIZON = 'H',
  POLICH_PAGE = 'T',
  ALCABITIUS = 'B',
  MORINUS = 'M',
  PORPHYRIUS = 'O',
  SRIPATI = 'S'
}
```

## Error Handling

All calculation functions may throw errors in the following cases:

- **Module Loading**: Swiss Ephemeris native module not found
- **Ephemeris Files**: Required data files not found
- **Invalid Parameters**: Incorrect location coordinates or dates
- **Calculation Errors**: Swiss Ephemeris internal errors

Always wrap calculations in try-catch blocks:

```typescript
try {
  const planets = calculatePlanets(new Date());
  // Process results
} catch (error) {
  console.error('Calculation failed:', error.message);
  // Handle error
}
```
