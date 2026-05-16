"use strict";
/**
 * JsonSwephInstance — drop-in compatible with the SwephInstance v2 API.
 *
 * createJsonSweph() returns this object. Callers can use it anywhere a
 * SwephInstance is expected without loading native binaries.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsonSwephInstance = void 0;
const ayanamsa_1 = require("./ayanamsa");
/**
 * The full JSON-based SwephInstance.
 * All methods are async and never throw for missing data — they return
 * empty/null values and log warnings instead.
 */
class JsonSwephInstance {
    engine;
    type = 'json';
    constructor(engine) {
        this.engine = engine;
    }
    // =========================================================================
    // Planetary calculations
    // =========================================================================
    async calculatePlanets(date, options) {
        return this.engine.calculatePlanets(date, { ayanamsa: options?.ayanamsa });
    }
    async calculatePlanet(planetId, date, options) {
        const all = await this.calculatePlanets(date, options);
        return all.find((p) => p.id === String(planetId)) ?? null;
    }
    async calculateRiseSet(_planetId, _date, _location, _options) {
        // Rise/set for individual planets requires SWEPH precision.
        // JSON engine does not support this — return null to signal callers to escalate.
        return { rise: null, set: null, transit: null };
    }
    // =========================================================================
    // Lagna & houses
    // =========================================================================
    async calculateLagna(date, location, options) {
        return this.engine.calculateLagna(date, { latitude: location.latitude, longitude: location.longitude }, { ayanamsa: options?.ayanamsa });
    }
    // =========================================================================
    // Sun calculations
    // =========================================================================
    async calculateSunTimes(date, location) {
        return this.engine.calculateSunTimes(date, {
            latitude: location.latitude,
            longitude: location.longitude,
        });
    }
    async calculateSolarNoon(date, location) {
        const times = await this.calculateSunTimes(date, location);
        return { time: times.solarNoon, altitude: 0 };
    }
    async calculateSunPath(_date, _location, _intervalMinutes) {
        // Full sun path requires azimuth/altitude — not supported by JSON engine.
        return [];
    }
    // =========================================================================
    // Moon calculations
    // =========================================================================
    async calculateMoonData(date, _location) {
        const phase = await this.engine.calculateMoonPhase(date);
        return {
            illumination: phase.illumination,
            age: phase.age,
            phase: phase.phase,
            phaseName: phase.phaseName,
            distance: 0,
            moonrise: null,
            moonset: null,
            transit: null,
        };
    }
    async calculateMoonPhase(date) {
        return this.engine.calculateMoonPhase(date);
    }
    async calculateNextMoonPhases(date) {
        // Walk forward day by day looking for phase crossings — good enough for
        // display purposes, not sub-minute accurate like SWEPH.
        const phase = await this.calculateMoonPhase(date);
        let newMoon;
        let fullMoon;
        let nextNewMoon;
        let prevPhase = phase.phase;
        for (let i = 1; i <= 45; i++) {
            const d = new Date(date.getTime() + i * 86_400_000);
            const p = await this.calculateMoonPhase(d);
            const cur = p.phase;
            if (!fullMoon && prevPhase < 180 && cur >= 180)
                fullMoon = d;
            if (!newMoon && prevPhase > 10 && cur < 10)
                newMoon = d;
            if (newMoon && !nextNewMoon && i > 15 && prevPhase > 10 && cur < 10)
                nextNewMoon = d;
            prevPhase = cur;
            if (newMoon && fullMoon)
                break;
        }
        return { newMoon, fullMoon, nextNewMoon };
    }
    // =========================================================================
    // Utility
    // =========================================================================
    getAyanamsa(date, ayanamsaType) {
        return (0, ayanamsa_1.getAyanamsa)(date, ayanamsaType ?? ayanamsa_1.AYANAMSA_TYPE.LAHIRI);
    }
    dateToJulian(date) {
        return (0, ayanamsa_1.dateToJD)(date);
    }
    setEphePath(_path) {
        // No-op — JSON engine has no ephemeris files to locate
    }
    clearCaches() {
        // Module-level caches are cleared by reloading the module.
        // In practice this is a no-op — Lambda containers are ephemeral anyway.
    }
    setCaching(_enabled) {
        // Caching is always on for the JSON engine (it's the whole point).
    }
}
exports.JsonSwephInstance = JsonSwephInstance;
//# sourceMappingURL=instance.js.map