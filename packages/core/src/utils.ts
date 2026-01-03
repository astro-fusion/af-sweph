/**
 * @af/sweph-core - Pure Utility Functions
 * 
 * Platform-agnostic calculation utilities.
 * These functions have no dependencies on native modules.
 */

import { JULIAN_UNIX_EPOCH } from './constants';

/**
 * Normalize ecliptic longitude to 0-360° range
 */
export function normalizeLongitude(longitude: number): number {
    let norm = longitude % 360;
    if (norm < 0) norm += 360;
    return norm;
}

/**
 * Get rashi (zodiac sign) from longitude
 * @returns Rashi number 1-12
 */
export function getRashi(longitude: number): number {
    return Math.floor(normalizeLongitude(longitude) / 30) + 1;
}

/**
 * Get degree within rashi from longitude
 * @returns Degree 0-30
 */
export function getRashiDegree(longitude: number): number {
    return normalizeLongitude(longitude) % 30;
}

/**
 * Calculate if a planet is retrograde based on speed
 */
export function isRetrograde(speed: number): boolean {
    return speed < 0;
}

/**
 * Calculate nakshatra (lunar mansion) from ecliptic longitude
 * @returns Object containing nakshatra number (1-27) and pada (1-4)
 */
export function getNakshatra(longitude: number): { number: number; pada: number } {
    const norm = normalizeLongitude(longitude);
    const nakshatraSpan = 360 / 27;
    const padaSpan = nakshatraSpan / 4;

    const nakshatraNumber = Math.floor(norm / nakshatraSpan) + 1;
    const positionInNakshatra = norm % nakshatraSpan;
    const pada = Math.floor(positionInNakshatra / padaSpan) + 1;

    return { number: nakshatraNumber, pada };
}

/**
 * Convert Julian Day number to JavaScript Date (pure JS, no native dependency)
 */
export function julianToDate(jd: number, timezoneOffset: number = 0): Date {
    const utcMs = (jd - JULIAN_UNIX_EPOCH) * 86400000;
    return new Date(utcMs + timezoneOffset * 60 * 60 * 1000);
}

/**
 * Get moon phase name from phase angle (0-360)
 */
export function getMoonPhaseName(phaseAngle: number): string {
    const normalized = normalizeLongitude(phaseAngle);
    const phaseIndex = Math.floor((normalized + 22.5) / 45) % 8;
    const phases = [
        'New Moon',
        'Waxing Crescent',
        'First Quarter',
        'Waxing Gibbous',
        'Full Moon',
        'Waning Gibbous',
        'Last Quarter',
        'Waning Crescent',
    ];
    return phases[phaseIndex] ?? 'New Moon';
}

/**
 * Calculate degrees, minutes, seconds from decimal degrees
 */
export function degreesToDMS(degrees: number): { degrees: number; minutes: number; seconds: number } {
    const d = Math.floor(Math.abs(degrees));
    const m = Math.floor((Math.abs(degrees) - d) * 60);
    const s = Math.round(((Math.abs(degrees) - d) * 60 - m) * 60);
    return { degrees: d * Math.sign(degrees), minutes: m, seconds: s };
}

/**
 * Format longitude to string (e.g., "15°30'45" Aries")
 */
export function formatLongitude(longitude: number): string {
    const dms = degreesToDMS(getRashiDegree(longitude));
    const rashiNames = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
        'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
    const rashi = rashiNames[getRashi(longitude) - 1];
    return `${dms.degrees}°${dms.minutes}'${dms.seconds}" ${rashi}`;
}
