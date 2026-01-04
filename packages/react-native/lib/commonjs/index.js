"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var _exportNames = {
  createSweph: true,
  initializeSweph: true,
  ReactNativeAdapter: true
};
Object.defineProperty(exports, "ReactNativeAdapter", {
  enumerable: true,
  get: function () {
    return _adapter.ReactNativeAdapter;
  }
});
exports.createSweph = createSweph;
exports.initializeSweph = initializeSweph;
var _adapter = require("./adapter");
var _swephCore = require("@af/sweph-core");
Object.keys(_swephCore).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
  if (key in exports && exports[key] === _swephCore[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _swephCore[key];
    }
  });
});
/**
 * @af/sweph-react-native
 * 
 * React Native Turbo Module for Swiss Ephemeris.
 */

/**
 * Options for initializing the React Native module
 */

/**
 * Create and initialize a Swiss Ephemeris instance for React Native
 */
async function createSweph(options) {
  const adapter = new _adapter.ReactNativeAdapter();

  // Initialize path if provided, otherwise assume native module handles default
  if (options?.ephePath) {
    adapter.swe_set_ephe_path(options.ephePath);
  }

  // Helper functions (same logic as WASM/Node)
  function dateToJulian(date) {
    return adapter.swe_julday(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate(), date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600, 1);
  }
  function julianToDate(jd, timezoneOffset = 0) {
    const utcMs = (jd - _swephCore.JULIAN_UNIX_EPOCH) * 86400000;
    return new Date(utcMs + timezoneOffset * 60 * 60 * 1000);
  }
  function getMoonPhaseName(phase) {
    const normalized = (0, _swephCore.normalizeLongitude)(phase);
    const phaseIndex = Math.floor((normalized + 22.5) / 45) % 8;
    const phases = ['New Moon', 'Waxing Crescent', 'First Quarter', 'Waxing Gibbous', 'Full Moon', 'Waning Gibbous', 'Last Quarter', 'Waning Crescent'];
    return phases[phaseIndex] ?? 'New Moon';
  }
  function calculateMoonData(date, _location) {
    const jd = dateToJulian(date);

    // Use stored constants or hardcoded values if adapter properties accessed in async context
    // Here we use standard flags
    const SEFLG_SWIEPH = 2;
    const sunResult = adapter.swe_calc_ut(jd, _swephCore.PLANETS.SUN.id, SEFLG_SWIEPH);
    const moonResult = adapter.swe_calc_ut(jd, _swephCore.PLANETS.MOON.id, SEFLG_SWIEPH);
    if ('error' in sunResult || 'error' in moonResult) {
      throw new Error('Failed to calculate moon data');
    }
    const phase = (0, _swephCore.normalizeLongitude)(moonResult.longitude - sunResult.longitude);
    const illumination = (1 - Math.cos(phase * Math.PI / 180)) / 2 * 100;
    const age = phase / 360 * 29.53;
    return {
      illumination,
      age,
      phase,
      phaseName: getMoonPhaseName(phase),
      distance: moonResult.distance * 149597870.7
    };
  }
  return {
    adapter,
    platform: 'react-native',
    calculatePlanets(date, calcOptions) {
      const jd = dateToJulian(date);
      const planets = [];
      const planetList = calcOptions?.includeOuterPlanets ? [..._swephCore.VEDIC_PLANET_ORDER, ..._swephCore.OUTER_PLANETS] : _swephCore.VEDIC_PLANET_ORDER;
      if (calcOptions?.ayanamsa !== undefined) {
        adapter.swe_set_sid_mode(calcOptions.ayanamsa, 0, 0);
      }

      // Local constants
      const SEFLG_SWIEPH = 2;
      const SEFLG_SPEED = 256;
      for (const planetDef of planetList) {
        if (planetDef.id === -1) {
          const rahu = planets.find(p => p.name === 'Rahu');
          if (rahu) {
            const ketuLong = (0, _swephCore.normalizeLongitude)(rahu.longitude + 180);
            planets.push({
              id: 'ketu',
              name: 'Ketu',
              longitude: ketuLong,
              latitude: -rahu.latitude,
              distance: rahu.distance,
              speed: rahu.speed,
              rasi: (0, _swephCore.getRashi)(ketuLong),
              rasiDegree: (0, _swephCore.getRashiDegree)(ketuLong),
              isRetrograde: (0, _swephCore.isRetrograde)(rahu.speed),
              totalDegree: ketuLong
            });
          }
          continue;
        }
        const result = adapter.swe_calc_ut(jd, planetDef.id, SEFLG_SWIEPH | SEFLG_SPEED);
        if ('error' in result) {
          throw new Error(`Failed to calculate ${planetDef.name}: ${result.error}`);
        }
        planets.push({
          id: planetDef.name.toLowerCase(),
          name: planetDef.name,
          longitude: result.longitude,
          latitude: result.latitude,
          distance: result.distance,
          speed: result.longitudeSpeed,
          rasi: (0, _swephCore.getRashi)(result.longitude),
          rasiDegree: (0, _swephCore.getRashiDegree)(result.longitude),
          isRetrograde: (0, _swephCore.isRetrograde)(result.longitudeSpeed),
          totalDegree: result.longitude
        });
      }
      return planets;
    },
    calculateSunTimes(_date, _location) {
      return {
        sunrise: null,
        sunset: null,
        solarNoon: new Date(),
        dayLength: 12
      };
    },
    calculateMoonData,
    calculateMoonPhase(date) {
      const data = calculateMoonData(date, {
        latitude: 0,
        longitude: 0
      });
      return {
        phase: data.phase,
        illumination: data.illumination,
        age: data.age,
        phaseName: data.phaseName
      };
    },
    calculatePlanetRiseSetTimes(_planetId, _date, _location) {
      return {
        rise: null,
        set: null,
        transit: null,
        transitAltitude: 0,
        transitDistance: 0
      };
    },
    getAyanamsa(date, ayanamsaType = 1) {
      const jd = dateToJulian(date);
      adapter.swe_set_sid_mode(ayanamsaType, 0, 0);
      return adapter.swe_get_ayanamsa(jd);
    },
    dateToJulian,
    julianToDate
  };
}

/**
 * Initialize (Same as createSweph for API compatibility)
 */
async function initializeSweph(options) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _instance = await createSweph(options);
}
//# sourceMappingURL=index.js.map