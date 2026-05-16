/**
 * Ayanamsa (precession correction) formulas.
 *
 * All formulas use T = Julian centuries from J2000.0 (TT epoch).
 * Results are in degrees.
 *
 * Sources:
 *   - Lahiri: IAU 1956 Indian Astronomical Ephemeris
 *   - Krishnamurti: Krishnamurti Padhdhati (KP)
 *   - Raman: B.V. Raman's ayanamsa
 *   - Yukteshwar: Sri Yukteshwar's "Holy Science" (1894)
 */
/**
 * Convert a Date to Julian Day Number (UTC-based approximation).
 */
export declare function dateToJD(date: Date): number;
/**
 * Swiss Ephemeris sidereal mode IDs (numeric constants).
 * Subset — only what's supported by polynomial formulas here.
 */
export declare const AYANAMSA_TYPE: {
    readonly LAHIRI: 1;
    readonly RAMAN: 3;
    readonly KRISHNAMURTI: 5;
    readonly YUKTESHWAR: 7;
    readonly JN_BHASIN: 8;
};
export type AyanamsaTypeValue = typeof AYANAMSA_TYPE[keyof typeof AYANAMSA_TYPE];
/**
 * Calculate ayanamsa value for a given date.
 *
 * @param date  The date/time
 * @param type  Ayanamsa type constant (default: LAHIRI = 1)
 * @returns     Ayanamsa in degrees
 */
export declare function getAyanamsa(date: Date, type?: number): number;
/**
 * Convert a tropical longitude to sidereal using the specified ayanamsa.
 */
export declare function toSidereal(tropicalLongitude: number, date: Date, ayanamsaType?: number): number;
//# sourceMappingURL=ayanamsa.d.ts.map