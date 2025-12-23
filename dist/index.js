"use strict";
/**
 * @AstroFusion/sweph - Swiss Ephemeris for Vedic Astrology
 *
 * This is the main entry point for the library.
 * All public APIs are exported from here.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateKundaliPageData = exports.registerAdapter = exports.initializeSweph = exports.createNodeAdapter = exports.createSwephAdapter = exports.createPlanetaryCalculator = exports.createSwephCalculator = exports.VEDIC_PLANET_ORDER = exports.NAKSHATRAS = exports.RASHIS = exports.HOUSE_SYSTEMS = exports.AYANAMSA = exports.PLANETS = exports.julianToDate = exports.dateToJulian = exports.getJulianDay = exports.setEphemerisPath = exports.getAyanamsa = exports.calculateNextMoonPhases = exports.calculateMoonPhase = exports.calculateMoonData = exports.calculateSolarNoon = exports.calculateSunTimes = exports.calculateHouses = exports.calculateLagna = exports.calculatePlanetRiseSetTimes = exports.calculateSinglePlanet = exports.calculatePlanets = void 0;
// Types
__exportStar(require("./types"), exports);
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
var moon_1 = require("./moon");
Object.defineProperty(exports, "calculateMoonData", { enumerable: true, get: function () { return moon_1.calculateMoonData; } });
Object.defineProperty(exports, "calculateMoonPhase", { enumerable: true, get: function () { return moon_1.calculateMoonPhase; } });
Object.defineProperty(exports, "calculateNextMoonPhases", { enumerable: true, get: function () { return moon_1.calculateNextMoonPhases; } });
// Utility functions
var utils_1 = require("./utils");
Object.defineProperty(exports, "getAyanamsa", { enumerable: true, get: function () { return utils_1.getAyanamsa; } });
Object.defineProperty(exports, "setEphemerisPath", { enumerable: true, get: function () { return utils_1.setEphemerisPath; } });
Object.defineProperty(exports, "getJulianDay", { enumerable: true, get: function () { return utils_1.getJulianDay; } });
Object.defineProperty(exports, "dateToJulian", { enumerable: true, get: function () { return utils_1.dateToJulian; } });
Object.defineProperty(exports, "julianToDate", { enumerable: true, get: function () { return utils_1.julianToDate; } });
// Constants
var constants_1 = require("./constants");
Object.defineProperty(exports, "PLANETS", { enumerable: true, get: function () { return constants_1.PLANETS; } });
Object.defineProperty(exports, "AYANAMSA", { enumerable: true, get: function () { return constants_1.AYANAMSA; } });
Object.defineProperty(exports, "HOUSE_SYSTEMS", { enumerable: true, get: function () { return constants_1.HOUSE_SYSTEMS; } });
Object.defineProperty(exports, "RASHIS", { enumerable: true, get: function () { return constants_1.RASHIS; } });
Object.defineProperty(exports, "NAKSHATRAS", { enumerable: true, get: function () { return constants_1.NAKSHATRAS; } });
Object.defineProperty(exports, "VEDIC_PLANET_ORDER", { enumerable: true, get: function () { return constants_1.VEDIC_PLANET_ORDER; } });
// Legacy compatibility exports (for migration from @astrofusion/sweph-*)
var legacy_1 = require("./legacy");
// Factory functions
Object.defineProperty(exports, "createSwephCalculator", { enumerable: true, get: function () { return legacy_1.createSwephCalculator; } });
Object.defineProperty(exports, "createPlanetaryCalculator", { enumerable: true, get: function () { return legacy_1.createPlanetaryCalculator; } });
Object.defineProperty(exports, "createSwephAdapter", { enumerable: true, get: function () { return legacy_1.createSwephAdapter; } });
Object.defineProperty(exports, "createNodeAdapter", { enumerable: true, get: function () { return legacy_1.createNodeAdapter; } });
Object.defineProperty(exports, "initializeSweph", { enumerable: true, get: function () { return legacy_1.initializeSweph; } });
Object.defineProperty(exports, "registerAdapter", { enumerable: true, get: function () { return legacy_1.registerAdapter; } });
Object.defineProperty(exports, "calculateKundaliPageData", { enumerable: true, get: function () { return legacy_1.calculateKundaliPageData; } });
//# sourceMappingURL=index.js.map