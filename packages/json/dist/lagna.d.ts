/**
 * Fast Lagna (Ascendant) calculator — pure JS, no native dependencies.
 *
 * Algorithm:
 *   1. Convert date/time to Julian Day
 *   2. Calculate Greenwich Mean Sidereal Time (GMST)
 *   3. Add longitude offset to get Local Sidereal Time (LST)
 *   4. LST = RAMC (Right Ascension of Midheaven Cusp / 10th house)
 *   5. Compute Obliquity of Ecliptic (IAU formula)
 *   6. Solve for the Ascendant longitude on the ecliptic
 *   7. Subtract ayanamsa for sidereal result
 *
 * Accuracy: within ~0.5° of SWEPH for latitudes ±60°. Not suitable for
 * extreme latitudes (>65°) or house cusp calculations.
 */
export interface LagnaResult {
    longitude: number;
    rasi: number;
    rasiDegree: number;
    nakshatra: number;
}
/**
 * Calculate Lagna (sidereal Ascendant) for a given date and location.
 *
 * @param date          Local birth date/time as a UTC Date object
 * @param latitude      Geographic latitude in decimal degrees (+N / -S)
 * @param longitude     Geographic longitude in decimal degrees (+E / -W)
 * @param ayanamsaType  Ayanamsa system (default: LAHIRI)
 */
export declare function getFastLagna(date: Date, latitude: number, longitude: number, ayanamsaType?: number): LagnaResult;
//# sourceMappingURL=lagna.d.ts.map