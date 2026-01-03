/**
 * Planet Calculations for @AstroFusion/sweph
 */
import type { Planet, CalculationOptions, GeoLocation } from './types';
/**
 * Calculate positions for all 9 Vedic planets (Navagraha)
 * @param date - Date and time for calculation (local time)
 * @param options - Calculation options including ayanamsa, house system, and location
 * @returns Array of planet positions with Vedic astrology details
 * @throws Error if Swiss Ephemeris initialization or calculation fails
 * @example
 * ```typescript
 * // Basic calculation with default Lahiri ayanamsa
 * const planets = calculatePlanets(new Date());
 *
 * // With custom ayanamsa and location for house calculations
 * const planets = calculatePlanets(new Date(), {
 *   ayanamsa: AYANAMSA.KRISHNAMURTI,
 *   location: { latitude: 28.6139, longitude: 77.2090, timezone: 5.5 }
 * });
 *
 * // Get specific planet data
 * const sun = planets.find(p => p.name === 'Sun');
 * console.log(`${sun?.name}: ${sun?.longitude}° in ${RASHIS[sun!.rasi-1].name}`);
 * ```
 */
export declare function calculatePlanets(date: Date, options?: CalculationOptions): Planet[];
/**
 * Calculate position for a single planet or celestial body
 * @param planetId - Swiss Ephemeris planet ID (0=Sun, 1=Moon, 2=Mercury, etc.)
 * @param date - Date and time for calculation (local time)
 * @param options - Calculation options including ayanamsa and location
 * @returns Planet position object or null if calculation fails
 * @throws Error if Swiss Ephemeris is not initialized
 * @example
 * ```typescript
 * // Calculate Moon position
 * const moon = calculateSinglePlanet(PlanetId.MOON, new Date(), {
 *   ayanamsa: AYANAMSA.LAHIRI,
 *   location: { latitude: 27.7172, longitude: 85.324, timezone: 5.75 }
 * });
 *
 * if (moon) {
 *   console.log(`Moon at ${moon.longitude}° (${moon.azimuth}° azimuth, ${moon.altitude}° altitude)`);
 * }
 * ```
 */
export declare function calculateSinglePlanet(planetId: number, date: Date, options?: CalculationOptions): Planet | null;
/**
 * Calculate rise, set, and transit times for a celestial body
 * @param planetId - Swiss Ephemeris planet ID (0=Sun, 1=Moon, 2=Mercury, etc.)
 * @param date - Date for calculation (local time)
 * @param location - Geographic location with latitude, longitude, and timezone
 * @returns Object containing:
 *   - rise: Time when the body rises above horizon (null if it doesn't rise)
 *   - set: Time when the body sets below horizon (null if it doesn't set)
 *   - transit: Time when the body crosses the meridian (solar noon for Sun)
 *   - transitAltitude: Altitude at transit in degrees
 *   - transitDistance: Distance from Earth at transit in AU
 * @throws Error if Swiss Ephemeris calculation fails
 * @example
 * ```typescript
 * const times = calculatePlanetRiseSetTimes(0, new Date(), {
 *   latitude: 40.7128,
 *   longitude: -74.0060,
 *   timezone: -5
 * });
 * console.log(`Sunrise: ${times.rise}`);
 * console.log(`Sunset: ${times.set}`);
 * ```
 */
export declare function calculatePlanetRiseSetTimes(planetId: number, date: Date, location: GeoLocation): {
    rise: Date | null;
    set: Date | null;
    transit: Date | null;
    transitAltitude: number;
    transitDistance: number;
};
//# sourceMappingURL=planets.d.ts.map