// src/engine.ts
import * as Astronomy from "astronomy-engine";
import {
  CalculationTier,
  EngineFeatures,
  FeatureNotSupportedError
} from "@af/sweph-core";
var PLANET_MAPPING = [
  { body: Astronomy.Body.Sun, id: "sun", name: "Sun" },
  { body: Astronomy.Body.Moon, id: "moon", name: "Moon" },
  { body: Astronomy.Body.Mercury, id: "mercury", name: "Mercury" },
  { body: Astronomy.Body.Venus, id: "venus", name: "Venus" },
  { body: Astronomy.Body.Mars, id: "mars", name: "Mars" },
  { body: Astronomy.Body.Jupiter, id: "jupiter", name: "Jupiter" },
  { body: Astronomy.Body.Saturn, id: "saturn", name: "Saturn" }
];
var LAHIRI_AYANAMSA_J2000 = 23.85;
var AYANAMSA_RATE = 50.29 / 3600;
function calculateAyanamsa(date, type = 1) {
  const j2000 = /* @__PURE__ */ new Date("2000-01-01T12:00:00Z");
  const yearsSinceJ2000 = (date.getTime() - j2000.getTime()) / (365.25 * 24 * 60 * 60 * 1e3);
  const baseAyanamsa = {
    0: 24.04,
    // Fagan-Bradley
    1: LAHIRI_AYANAMSA_J2000,
    // Lahiri (default)
    3: 22.38,
    // Raman
    5: 23.45
    // Krishnamurti
  };
  const base = baseAyanamsa[type] ?? LAHIRI_AYANAMSA_J2000;
  return base + yearsSinceJ2000 * AYANAMSA_RATE;
}
function tropicalToSidereal(tropicalLongitude, ayanamsa) {
  let sidereal = tropicalLongitude - ayanamsa;
  if (sidereal < 0) sidereal += 360;
  if (sidereal >= 360) sidereal -= 360;
  return sidereal;
}
function getRashi(longitude) {
  return Math.floor(longitude / 30) + 1;
}
function getRashiDegree(longitude) {
  return longitude % 30;
}
var LiteEngine = class {
  constructor() {
    this.tier = CalculationTier.FAST;
    this.name = "lite";
    this.supportedFeatures = /* @__PURE__ */ new Set([
      EngineFeatures.PLANETS,
      EngineFeatures.SUN_TIMES,
      EngineFeatures.MOON_PHASE,
      EngineFeatures.AYANAMSA
      // approximated
    ]);
    this.initialized = false;
  }
  async isAvailable() {
    return true;
  }
  async initialize() {
    this.initialized = true;
  }
  dispose() {
    this.initialized = false;
  }
  /**
   * Calculate planetary positions using astronomy-engine
   */
  async calculatePlanets(date, options) {
    const ayanamsa = calculateAyanamsa(date, options?.ayanamsa ?? 1);
    const planets = [];
    const observer = new Astronomy.Observer(0, 0, 0);
    for (const mapping of PLANET_MAPPING) {
      try {
        const equator = Astronomy.Equator(
          mapping.body,
          date,
          observer,
          true,
          // equdate (of date)
          true
          // aberration correction
        );
        const ecliptic = Astronomy.Ecliptic(equator.vec);
        const tropicalLongitude = ecliptic.elon;
        const siderealLongitude = tropicalToSidereal(tropicalLongitude, ayanamsa);
        const tomorrow = new Date(date.getTime() + 24 * 60 * 60 * 1e3);
        const equatorTomorrow = Astronomy.Equator(mapping.body, tomorrow, observer, true, true);
        const eclipticTomorrow = Astronomy.Ecliptic(equatorTomorrow.vec);
        const speed = eclipticTomorrow.elon - tropicalLongitude;
        planets.push({
          id: mapping.id,
          name: mapping.name,
          longitude: siderealLongitude,
          latitude: ecliptic.elat,
          distance: equator.dist,
          speed,
          rasi: getRashi(siderealLongitude),
          rasiDegree: getRashiDegree(siderealLongitude),
          isRetrograde: speed < 0,
          totalDegree: siderealLongitude
        });
      } catch (_error) {
      }
    }
    try {
      const moonNode = Astronomy.SearchMoonNode(date);
      if (moonNode) {
        const moonEquator = Astronomy.Equator(Astronomy.Body.Moon, date, observer, true, true);
        const moonEcliptic = Astronomy.Ecliptic(moonEquator.vec);
        const rahuLongitude = tropicalToSidereal(moonEcliptic.elon + 180, ayanamsa);
        planets.push({
          id: "rahu",
          name: "Rahu",
          longitude: rahuLongitude,
          latitude: 0,
          distance: 1,
          speed: -0.053,
          // Rahu always retrograde
          rasi: getRashi(rahuLongitude),
          rasiDegree: getRashiDegree(rahuLongitude),
          isRetrograde: true,
          totalDegree: rahuLongitude
        });
        const ketuLongitude = (rahuLongitude + 180) % 360;
        planets.push({
          id: "ketu",
          name: "Ketu",
          longitude: ketuLongitude,
          latitude: 0,
          distance: 1,
          speed: -0.053,
          rasi: getRashi(ketuLongitude),
          rasiDegree: getRashiDegree(ketuLongitude),
          isRetrograde: true,
          totalDegree: ketuLongitude
        });
      }
    } catch (_error) {
    }
    return planets;
  }
  /**
   * Calculate Lagna - NOT SUPPORTED by LiteEngine
   * This will throw FeatureNotSupportedError, causing the router to escalate
   */
  async calculateLagna(_date, _location, _options) {
    throw new FeatureNotSupportedError(EngineFeatures.LAGNA, this.tier);
  }
  /**
   * Calculate sun times using astronomy-engine
   */
  async calculateSunTimes(date, location) {
    const observer = new Astronomy.Observer(
      location.latitude,
      location.longitude,
      location.altitude ?? 0
    );
    let sunrise = null;
    let sunset = null;
    let solarNoon = date;
    try {
      const sunriseResult = Astronomy.SearchRiseSet(
        Astronomy.Body.Sun,
        observer,
        1,
        // +1 = Rise
        date,
        1
        // search within 1 day
      );
      if (sunriseResult) {
        sunrise = sunriseResult.date;
      }
    } catch {
    }
    try {
      const sunsetResult = Astronomy.SearchRiseSet(
        Astronomy.Body.Sun,
        observer,
        -1,
        // -1 = Set
        date,
        1
      );
      if (sunsetResult) {
        sunset = sunsetResult.date;
      }
    } catch {
    }
    try {
      const hourAngle = Astronomy.HourAngle(Astronomy.Body.Sun, date, observer);
      const hoursToNoon = -hourAngle;
      solarNoon = new Date(date.getTime() + hoursToNoon * 60 * 60 * 1e3);
    } catch {
      solarNoon = date;
    }
    let dayLength = 12;
    if (sunrise && sunset) {
      dayLength = (sunset.getTime() - sunrise.getTime()) / (1e3 * 60 * 60);
    }
    return {
      sunrise,
      sunset,
      solarNoon,
      dayLength
    };
  }
  /**
   * Calculate moon phase using astronomy-engine
   */
  async calculateMoonPhase(date) {
    const phase = Astronomy.MoonPhase(date);
    const illumination = (1 - Math.cos(phase * Math.PI / 180)) / 2;
    const age = phase / 360 * 29.53;
    let phaseName;
    if (phase < 22.5) {
      phaseName = "New Moon";
    } else if (phase < 67.5) {
      phaseName = "Waxing Crescent";
    } else if (phase < 112.5) {
      phaseName = "First Quarter";
    } else if (phase < 157.5) {
      phaseName = "Waxing Gibbous";
    } else if (phase < 202.5) {
      phaseName = "Full Moon";
    } else if (phase < 247.5) {
      phaseName = "Waning Gibbous";
    } else if (phase < 292.5) {
      phaseName = "Last Quarter";
    } else if (phase < 337.5) {
      phaseName = "Waning Crescent";
    } else {
      phaseName = "New Moon";
    }
    return {
      phase,
      illumination: illumination * 100,
      age,
      phaseName
    };
  }
  /**
   * Get approximate ayanamsa value
   */
  getAyanamsa(date, type = 1) {
    return calculateAyanamsa(date, type);
  }
};

// src/factory.ts
async function createLiteSweph() {
  const engine = new LiteEngine();
  await engine.initialize();
  return {
    calculatePlanets: (date, options) => engine.calculatePlanets(date, options),
    calculateSunTimes: (date, location) => engine.calculateSunTimes(date, location),
    calculateMoonPhase: (date) => engine.calculateMoonPhase(date),
    getAyanamsa: (date, type) => engine.getAyanamsa(date, type)
  };
}

// src/index.ts
import {
  CalculationTier as CalculationTier2,
  EngineFeatures as EngineFeatures2,
  FeatureNotSupportedError as FeatureNotSupportedError2
} from "@af/sweph-core";
export {
  CalculationTier2 as CalculationTier,
  EngineFeatures2 as EngineFeatures,
  FeatureNotSupportedError2 as FeatureNotSupportedError,
  LiteEngine,
  createLiteSweph
};
