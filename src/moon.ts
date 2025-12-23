/**
 * Moon Calculations for @AstroFusion/sweph
 */

import type { MoonData, NextMoonPhases, GeoLocation } from './types';
import { PlanetId } from './types';
import { MOON_PHASES, LUNAR_MONTH_DAYS } from './constants';
import { 
  initializeSweph, 
  getNativeModule, 
  dateToJulian, 
  julianToDate 
} from './utils';

/**
 * Calculate moon data including rise/set and phase
 * @param date - Date for calculation
 * @param location - Geographic location
 * @returns Moon data including rise, set, phase, illumination
 */
export function calculateMoonData(
  date: Date,
  location: GeoLocation
): MoonData {
  initializeSweph();
  const sweph = getNativeModule();
  
  const timezone = location.timezone ?? 0;
  
  // Convert to UTC midnight
  const utcDate = new Date(date.getTime() - timezone * 60 * 60 * 1000);
  utcDate.setUTCHours(0, 0, 0, 0);
  const jd = dateToJulian(utcDate);
  
  const geopos = [location.longitude, location.latitude, 0];
  const CALC_RISE = sweph.SE_CALC_RISE || 1;
  const CALC_SET = sweph.SE_CALC_SET || 2;
  
  // Calculate moonrise
  const moonriseResult = sweph.swe_rise_trans(
    jd,
    PlanetId.MOON,
    0,
    CALC_RISE,
    geopos,
    0,
    0
  );
  
  // Calculate moonset
  const moonsetResult = sweph.swe_rise_trans(
    jd,
    PlanetId.MOON,
    0,
    CALC_SET,
    geopos,
    0,
    0
  );
  
  const moonrise = moonriseResult?.dret?.[0]
    ? julianToDate(moonriseResult.dret[0], timezone)
    : null;
  const moonset = moonsetResult?.dret?.[0]
    ? julianToDate(moonsetResult.dret[0], timezone)
    : null;
  
  // Calculate moon phase using sun-moon elongation
  const { phase, illumination, age, phaseName } = calculateMoonPhase(date);
  
  return {
    moonrise,
    moonset,
    phase,
    illumination,
    age,
    phaseName,
  };
}

/**
 * Calculate current moon phase
 * @param date - Date for calculation
 * @returns Moon phase information
 */
export function calculateMoonPhase(
  date: Date
): { phase: number; illumination: number; age: number; phaseName: string } {
  initializeSweph();
  const sweph = getNativeModule();
  
  const jd = dateToJulian(date);
  
  // Calculate sun and moon positions (tropical)
  const sunResult = sweph.swe_calc_ut(jd, PlanetId.SUN, 0);
  const moonResult = sweph.swe_calc_ut(jd, PlanetId.MOON, 0);
  
  let sunLong = 0;
  let moonLong = 0;
  
  if (Array.isArray(sunResult)) {
    sunLong = sunResult[0] || 0;
  } else if (sunResult?.xx) {
    sunLong = sunResult.xx[0] || 0;
  }
  
  if (Array.isArray(moonResult)) {
    moonLong = moonResult[0] || 0;
  } else if (moonResult?.xx) {
    moonLong = moonResult.xx[0] || 0;
  }
  
  // Phase angle is Moon - Sun (0-360)
  let phase = moonLong - sunLong;
  if (phase < 0) phase += 360;
  
  // Illumination percentage (0% at new moon, 100% at full moon)
  const illumination = ((1 - Math.cos(phase * Math.PI / 180)) / 2) * 100;
  
  // Moon age in days (0 = new moon)
  const age = phase / (360 / LUNAR_MONTH_DAYS);
  
  // Determine phase name
  const phaseIndex = Math.floor(phase / 45);
  const phaseName = MOON_PHASES[phaseIndex] || MOON_PHASES[0]!;
  
  return { phase, illumination, age, phaseName };
}

/**
 * Calculate dates of next moon phases
 * @param date - Starting date
 * @returns Dates of upcoming moon phases
 */
export function calculateNextMoonPhases(date: Date): NextMoonPhases {
  initializeSweph();
  const sweph = getNativeModule();
  
  const jd = dateToJulian(date);
  
  // Get current phase
  const { phase: currentPhase } = calculateMoonPhase(date);
  
  // Calculate days until each phase
  // New Moon = 0°, First Quarter = 90°, Full Moon = 180°, Last Quarter = 270°
  const phases = [
    { name: 'newMoon', angle: 0 },
    { name: 'firstQuarter', angle: 90 },
    { name: 'fullMoon', angle: 180 },
    { name: 'lastQuarter', angle: 270 },
  ];
  
  const result: Record<string, Date> = {};
  
  for (const phase of phases) {
    // Calculate degrees until this phase
    let degreesUntil = phase.angle - currentPhase;
    if (degreesUntil <= 0) degreesUntil += 360;
    
    // Convert to days (360° = ~29.53 days)
    const daysUntil = degreesUntil / (360 / LUNAR_MONTH_DAYS);
    
    // Calculate the date
    const phaseDate = new Date(date.getTime() + daysUntil * 24 * 60 * 60 * 1000);
    result[phase.name] = phaseDate;
  }
  
  return {
    newMoon: result.newMoon!,
    firstQuarter: result.firstQuarter!,
    fullMoon: result.fullMoon!,
    lastQuarter: result.lastQuarter!,
  };
}
