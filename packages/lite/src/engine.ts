/**
 * LiteEngine - Pure JavaScript astronomical calculation engine
 * 
 * Uses astronomy-engine for calculations. This is the fastest tier
 * and is used as the default for most calculations.
 */

import * as Astronomy from 'astronomy-engine';
import type {
    ICalculationEngine,
    Planet,
    GeoLocation,
    SunTimes,
    MoonPhase,
    LagnaInfo,
    CalculationOptions,
} from '@af/sweph-core';
import {
    CalculationTier,
    EngineFeatures,
    FeatureNotSupportedError,
} from '@af/sweph-core';

// Vedic planet mapping: astronomy-engine Body -> our Planet id
const PLANET_MAPPING: Array<{ body: Astronomy.Body; id: string; name: string }> = [
    { body: Astronomy.Body.Sun, id: 'sun', name: 'Sun' },
    { body: Astronomy.Body.Moon, id: 'moon', name: 'Moon' },
    { body: Astronomy.Body.Mercury, id: 'mercury', name: 'Mercury' },
    { body: Astronomy.Body.Venus, id: 'venus', name: 'Venus' },
    { body: Astronomy.Body.Mars, id: 'mars', name: 'Mars' },
    { body: Astronomy.Body.Jupiter, id: 'jupiter', name: 'Jupiter' },
    { body: Astronomy.Body.Saturn, id: 'saturn', name: 'Saturn' },
];

// Ayanamsa approximation constants (Lahiri ayanamsa at J2000.0 and rate)
const LAHIRI_AYANAMSA_J2000 = 23.85; // degrees at J2000.0 (Jan 1, 2000)
const AYANAMSA_RATE = 50.29 / 3600; // degrees per year (precession rate)

/**
 * Calculate approximate Lahiri ayanamsa for a given date
 * This is an approximation - for exact values, use WASM or Native tier
 */
function calculateAyanamsa(date: Date, type: number = 1): number {
    // J2000.0 epoch: January 1, 2000, 12:00 TT
    const j2000 = new Date('2000-01-01T12:00:00Z');
    const yearsSinceJ2000 = (date.getTime() - j2000.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
    
    // Base ayanamsa values for different systems
    const baseAyanamsa: Record<number, number> = {
        0: 24.04, // Fagan-Bradley
        1: LAHIRI_AYANAMSA_J2000, // Lahiri (default)
        3: 22.38, // Raman
        5: 23.45, // Krishnamurti
    };
    
    const base = baseAyanamsa[type] ?? LAHIRI_AYANAMSA_J2000;
    return base + (yearsSinceJ2000 * AYANAMSA_RATE);
}

/**
 * Convert tropical longitude to sidereal longitude
 */
function tropicalToSidereal(tropicalLongitude: number, ayanamsa: number): number {
    let sidereal = tropicalLongitude - ayanamsa;
    if (sidereal < 0) sidereal += 360;
    if (sidereal >= 360) sidereal -= 360;
    return sidereal;
}

/**
 * Get rashi (zodiac sign) number from longitude (1-12)
 */
function getRashi(longitude: number): number {
    return Math.floor(longitude / 30) + 1;
}

/**
 * Get degree within rashi
 */
function getRashiDegree(longitude: number): number {
    return longitude % 30;
}

/**
 * LiteEngine - Implements ICalculationEngine using astronomy-engine
 */
export class LiteEngine implements ICalculationEngine {
    readonly tier = CalculationTier.FAST;
    readonly name = 'lite';
    
    readonly supportedFeatures = new Set([
        EngineFeatures.PLANETS,
        EngineFeatures.SUN_TIMES,
        EngineFeatures.MOON_PHASE,
        EngineFeatures.AYANAMSA, // approximated
    ]);
    
    private initialized = false;

    async isAvailable(): Promise<boolean> {
        // Pure JS - always available
        return true;
    }

    async initialize(): Promise<void> {
        // No initialization needed for pure JS
        this.initialized = true;
    }

    dispose(): void {
        this.initialized = false;
    }

    /**
     * Calculate planetary positions using astronomy-engine
     */
    async calculatePlanets(date: Date, options?: CalculationOptions): Promise<Planet[]> {
        const ayanamsa = calculateAyanamsa(date, options?.ayanamsa ?? 1);
        const planets: Planet[] = [];
        
        // Create observer for geocentric calculations
        const observer = new Astronomy.Observer(0, 0, 0);
        
        for (const mapping of PLANET_MAPPING) {
            try {
                // Get geocentric equatorial coordinates
                const equator = Astronomy.Equator(
                    mapping.body,
                    date,
                    observer,
                    true,   // equdate (of date)
                    true    // aberration correction
                );
                
                // Convert to ecliptic longitude
                const ecliptic = Astronomy.Ecliptic(equator.vec);
                const tropicalLongitude = ecliptic.elon;
                const siderealLongitude = tropicalToSidereal(tropicalLongitude, ayanamsa);
                
                // Calculate speed (daily motion)
                const tomorrow = new Date(date.getTime() + 24 * 60 * 60 * 1000);
                const equatorTomorrow = Astronomy.Equator(mapping.body, tomorrow, observer, true, true);
                const eclipticTomorrow = Astronomy.Ecliptic(equatorTomorrow.vec);
                const speed = eclipticTomorrow.elon - tropicalLongitude;
                
                planets.push({
                    id: mapping.id,
                    name: mapping.name,
                    longitude: siderealLongitude,
                    latitude: ecliptic.elat,
                    distance: equator.dist,
                    speed: speed,
                    rasi: getRashi(siderealLongitude),
                    rasiDegree: getRashiDegree(siderealLongitude),
                    isRetrograde: speed < 0,
                    totalDegree: siderealLongitude,
                });
            } catch (_error) {
                // Failed to calculate planet - skip
            }
        }
        
        // Calculate Rahu (Mean North Node)
        try {
            const moonNode = Astronomy.SearchMoonNode(date);
            if (moonNode) {
                // Approximate Rahu longitude from moon node search
                // This is a simplification - for exact values use SWEPH
                const moonEquator = Astronomy.Equator(Astronomy.Body.Moon, date, observer, true, true);
                const moonEcliptic = Astronomy.Ecliptic(moonEquator.vec);
                
                // Rahu is approximately opposite to the node crossing point
                // This is an approximation for the mean node
                const rahuLongitude = tropicalToSidereal(moonEcliptic.elon + 180, ayanamsa);
                
                planets.push({
                    id: 'rahu',
                    name: 'Rahu',
                    longitude: rahuLongitude,
                    latitude: 0,
                    distance: 1,
                    speed: -0.053, // Rahu always retrograde
                    rasi: getRashi(rahuLongitude),
                    rasiDegree: getRashiDegree(rahuLongitude),
                    isRetrograde: true,
                    totalDegree: rahuLongitude,
                });
                
                // Ketu is exactly opposite to Rahu
                const ketuLongitude = (rahuLongitude + 180) % 360;
                planets.push({
                    id: 'ketu',
                    name: 'Ketu',
                    longitude: ketuLongitude,
                    latitude: 0,
                    distance: 1,
                    speed: -0.053,
                    rasi: getRashi(ketuLongitude),
                    rasiDegree: getRashiDegree(ketuLongitude),
                    isRetrograde: true,
                    totalDegree: ketuLongitude,
                });
            }
        } catch (_error) {
            // Failed to calculate Rahu/Ketu - skip
        }
        
        return planets;
    }

    /**
     * Calculate Lagna - NOT SUPPORTED by LiteEngine
     * This will throw FeatureNotSupportedError, causing the router to escalate
     */
    async calculateLagna(
        _date: Date, 
        _location: GeoLocation, 
        _options?: CalculationOptions
    ): Promise<LagnaInfo> {
        throw new FeatureNotSupportedError(EngineFeatures.LAGNA, this.tier);
    }

    /**
     * Calculate sun times using astronomy-engine
     */
    async calculateSunTimes(date: Date, location: GeoLocation): Promise<SunTimes> {
        const observer = new Astronomy.Observer(
            location.latitude,
            location.longitude,
            location.altitude ?? 0
        );
        
        // Get sunrise
        let sunrise: Date | null = null;
        let sunset: Date | null = null;
        let solarNoon: Date = date;
        
        try {
            const sunriseResult = Astronomy.SearchRiseSet(
                Astronomy.Body.Sun,
                observer,
                +1,  // +1 = Rise
                date,
                1 // search within 1 day
            );
            if (sunriseResult) {
                sunrise = sunriseResult.date;
            }
        } catch {
            // Polar regions may not have sunrise
        }
        
        try {
            const sunsetResult = Astronomy.SearchRiseSet(
                Astronomy.Body.Sun,
                observer,
                -1,  // -1 = Set
                date,
                1
            );
            if (sunsetResult) {
                sunset = sunsetResult.date;
            }
        } catch {
            // Polar regions may not have sunset
        }
        
        // Calculate solar noon (when sun crosses meridian)
        try {
            const hourAngle = Astronomy.HourAngle(Astronomy.Body.Sun, date, observer);
            // Solar noon is when hour angle is 0
            const hoursToNoon = -hourAngle;
            solarNoon = new Date(date.getTime() + hoursToNoon * 60 * 60 * 1000);
        } catch {
            solarNoon = date;
        }
        
        // Calculate day length
        let dayLength = 12; // default
        if (sunrise && sunset) {
            dayLength = (sunset.getTime() - sunrise.getTime()) / (1000 * 60 * 60);
        }
        
        return {
            sunrise,
            sunset,
            solarNoon,
            dayLength,
        };
    }

    /**
     * Calculate moon phase using astronomy-engine
     */
    async calculateMoonPhase(date: Date): Promise<MoonPhase> {
        const phase = Astronomy.MoonPhase(date);
        
        // Calculate illumination
        const illumination = (1 - Math.cos(phase * Math.PI / 180)) / 2;
        
        // Calculate age (days since new moon)
        const age = (phase / 360) * 29.53; // synodic month
        
        // Determine phase name
        let phaseName: string;
        if (phase < 22.5) {
            phaseName = 'New Moon';
        } else if (phase < 67.5) {
            phaseName = 'Waxing Crescent';
        } else if (phase < 112.5) {
            phaseName = 'First Quarter';
        } else if (phase < 157.5) {
            phaseName = 'Waxing Gibbous';
        } else if (phase < 202.5) {
            phaseName = 'Full Moon';
        } else if (phase < 247.5) {
            phaseName = 'Waning Gibbous';
        } else if (phase < 292.5) {
            phaseName = 'Last Quarter';
        } else if (phase < 337.5) {
            phaseName = 'Waning Crescent';
        } else {
            phaseName = 'New Moon';
        }
        
        return {
            phase,
            illumination: illumination * 100,
            age,
            phaseName,
        };
    }

    /**
     * Get approximate ayanamsa value
     */
    getAyanamsa(date: Date, type: number = 1): number {
        return calculateAyanamsa(date, type);
    }
}
