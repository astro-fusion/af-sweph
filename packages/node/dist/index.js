"use strict";
/**
 * @AstroFusion/sweph - Swiss Ephemeris for Vedic Astrology
 *
 * This is the main entry point for the library.
 *
 * ## v2 API (Recommended)
 * ```typescript
 * import { createSweph } from '@af/sweph';
 *
 * const sweph = await createSweph();
 * const planets = await sweph.calculatePlanets(new Date(), { ayanamsa: 1 });
 * ```
 *
 * ## Legacy API (Deprecated)
 * ```typescript
 * import { initializeSweph, createSwephAdapter } from '@af/sweph';
 *
 * await initializeSweph();
 * const adapter = await createSwephAdapter();
 * ```
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateKundaliPageData = exports.registerAdapter = exports.createNodeAdapter = exports.createSwephAdapter = exports.createPlanetaryCalculator = exports.createSwephCalculator = exports.HouseSystem = exports.AyanamsaType = exports.PlanetId = exports.VEDIC_PLANET_ORDER = exports.NAKSHATRAS = exports.RASHIS = exports.HOUSE_SYSTEMS = exports.AYANAMSA = exports.PLANETS = exports.getSupportedPlatforms = exports.hasPrebuilds = exports.getPlatformInfo = exports.initializeSweph = exports.getNativeModule = exports.julianToDate = exports.dateToJulian = exports.getJulianDay = exports.setEphemerisPath = exports.getAyanamsa = exports.calculateNextMoonPhases = exports.calculateMoonPhase = exports.calculateMoonData = exports.calculateSunPath = exports.calculateSolarNoon = exports.calculateSunTimes = exports.calculateHouses = exports.calculateLagna = exports.calculatePlanetRiseSetTimes = exports.calculateSinglePlanet = exports.calculatePlanets = exports.createSweph = void 0;
// =============================================================================
// v2 API (Recommended)
// =============================================================================
var v2_1 = require("./v2");
// Factory
Object.defineProperty(exports, "createSweph", { enumerable: true, get: function () { return v2_1.createSweph; } });
// =============================================================================
// Direct Calculation Functions (Advanced usage)
// =============================================================================
// Core calculation functions
var planets_1 = require("./planets");
Object.defineProperty(exports, "calculatePlanets", { enumerable: true, get: function () { return planets_1.calculatePlanets; } });
Object.defineProperty(exports, "calculateSinglePlanet", { enumerable: true, get: function () { return planets_1.calculateSinglePlanet; } });
Object.defineProperty(exports, "calculatePlanetRiseSetTimes", { enumerable: true, get: function () { return planets_1.calculatePlanetRiseSetTimes; } });
var houses_1 = require("./houses");
Object.defineProperty(exports, "calculateLagna", { enumerable: true, get: function () { return houses_1.calculateLagna; } });
Object.defineProperty(exports, "calculateHouses", { enumerable: true, get: function () { return houses_1.calculateHouses; } });
var sun_1 = require("./sun");
Object.defineProperty(exports, "calculateSunTimes", { enumerable: true, get: function () { return sun_1.calculateSunTimes; } });
Object.defineProperty(exports, "calculateSolarNoon", { enumerable: true, get: function () { return sun_1.calculateSolarNoon; } });
Object.defineProperty(exports, "calculateSunPath", { enumerable: true, get: function () { return sun_1.calculateSunPath; } });
var moon_1 = require("./moon");
Object.defineProperty(exports, "calculateMoonData", { enumerable: true, get: function () { return moon_1.calculateMoonData; } });
Object.defineProperty(exports, "calculateMoonPhase", { enumerable: true, get: function () { return moon_1.calculateMoonPhase; } });
Object.defineProperty(exports, "calculateNextMoonPhases", { enumerable: true, get: function () { return moon_1.calculateNextMoonPhases; } });
// =============================================================================
// Utility Functions
// =============================================================================
var utils_1 = require("./utils");
Object.defineProperty(exports, "getAyanamsa", { enumerable: true, get: function () { return utils_1.getAyanamsa; } });
Object.defineProperty(exports, "setEphemerisPath", { enumerable: true, get: function () { return utils_1.setEphemerisPath; } });
Object.defineProperty(exports, "getJulianDay", { enumerable: true, get: function () { return utils_1.getJulianDay; } });
Object.defineProperty(exports, "dateToJulian", { enumerable: true, get: function () { return utils_1.dateToJulian; } });
Object.defineProperty(exports, "julianToDate", { enumerable: true, get: function () { return utils_1.julianToDate; } });
Object.defineProperty(exports, "getNativeModule", { enumerable: true, get: function () { return utils_1.getNativeModule; } });
Object.defineProperty(exports, "initializeSweph", { enumerable: true, get: function () { return utils_1.initializeSweph; } });
// Platform utilities (for debugging deployment issues)
var native_loader_1 = require("./native-loader");
Object.defineProperty(exports, "getPlatformInfo", { enumerable: true, get: function () { return native_loader_1.getPlatformInfo; } });
Object.defineProperty(exports, "hasPrebuilds", { enumerable: true, get: function () { return native_loader_1.hasPrebuilds; } });
Object.defineProperty(exports, "getSupportedPlatforms", { enumerable: true, get: function () { return native_loader_1.getSupportedPlatforms; } });
// =============================================================================
// Constants
// =============================================================================
var constants_1 = require("./constants");
Object.defineProperty(exports, "PLANETS", { enumerable: true, get: function () { return constants_1.PLANETS; } });
Object.defineProperty(exports, "AYANAMSA", { enumerable: true, get: function () { return constants_1.AYANAMSA; } });
Object.defineProperty(exports, "HOUSE_SYSTEMS", { enumerable: true, get: function () { return constants_1.HOUSE_SYSTEMS; } });
Object.defineProperty(exports, "RASHIS", { enumerable: true, get: function () { return constants_1.RASHIS; } });
Object.defineProperty(exports, "NAKSHATRAS", { enumerable: true, get: function () { return constants_1.NAKSHATRAS; } });
Object.defineProperty(exports, "VEDIC_PLANET_ORDER", { enumerable: true, get: function () { return constants_1.VEDIC_PLANET_ORDER; } });
var types_1 = require("./types");
Object.defineProperty(exports, "PlanetId", { enumerable: true, get: function () { return types_1.PlanetId; } });
Object.defineProperty(exports, "AyanamsaType", { enumerable: true, get: function () { return types_1.AyanamsaType; } });
Object.defineProperty(exports, "HouseSystem", { enumerable: true, get: function () { return types_1.HouseSystem; } });
// =============================================================================
// Legacy API (Deprecated - for backwards compatibility)
// =============================================================================
var legacy_1 = require("./legacy");
// Factory functions
/** @deprecated Use createSweph() instead */
Object.defineProperty(exports, "createSwephCalculator", { enumerable: true, get: function () { return legacy_1.createSwephCalculator; } });
/** @deprecated Use createSweph() instead */
Object.defineProperty(exports, "createPlanetaryCalculator", { enumerable: true, get: function () { return legacy_1.createPlanetaryCalculator; } });
/** @deprecated Use createSweph() instead */
Object.defineProperty(exports, "createSwephAdapter", { enumerable: true, get: function () { return legacy_1.createSwephAdapter; } });
/** @deprecated Use createSweph() instead */
Object.defineProperty(exports, "createNodeAdapter", { enumerable: true, get: function () { return legacy_1.createNodeAdapter; } });
/** @deprecated No longer needed - createSweph() auto-initializes */
Object.defineProperty(exports, "registerAdapter", { enumerable: true, get: function () { return legacy_1.registerAdapter; } });
/** @deprecated Use individual calculation methods */
Object.defineProperty(exports, "calculateKundaliPageData", { enumerable: true, get: function () { return legacy_1.calculateKundaliPageData; } });
//# sourceMappingURL=index.js.map