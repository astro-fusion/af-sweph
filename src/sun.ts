/**
 * Sun Calculations for @AstroFusion/sweph
 */

import type { SunTimes, SolarNoonResult, GeoLocation } from './types';
import { PlanetId } from './types';
import { 
  initializeSweph, 
  getNativeModule, 
  dateToJulian, 
  julianToDate 
} from './utils';

/**
 * Calculate sunrise, sunset, and twilight times
 * @param date - Date for calculation
 * @param location - Geographic location
 * @returns Sun times including sunrise, sunset, twilights
 */
export function calculateSunTimes(
  date: Date,
  location: GeoLocation
): SunTimes {
  initializeSweph();
  const sweph = getNativeModule();
  
  const timezone = location.timezone ?? 0;
  
  // Convert to UTC midnight
  const utcDate = new Date(date.getTime() - timezone * 60 * 60 * 1000);
  utcDate.setUTCHours(0, 0, 0, 0);
  const jd = dateToJulian(utcDate);
  
  // Calculation flags for rise/set
  const CALC_RISE = sweph.SE_CALC_RISE || 1;
  const CALC_SET = sweph.SE_CALC_SET || 2;
  const SEFLG_SWIEPH = sweph.SEFLG_SWIEPH || 2; // Swiss Ephemeris flag
  
  // Helper to call swe_rise_trans with fallback for different signatures
  const callRiseTrans = (id: number, flag: number) => {
    try {
      // Try flat arguments first (swisseph-v2 style)
      return sweph.swe_rise_trans(
        jd, id, '', SEFLG_SWIEPH, flag,
        location.longitude, location.latitude, 0,
        0, 0
      );
    } catch (error: any) {
      if (error && error.message && error.message.includes('Wrong type of arguments')) {
        // Try array argument for geopos (standard swisseph style)
        return sweph.swe_rise_trans(
          jd, id, '', SEFLG_SWIEPH, flag,
          [location.longitude, location.latitude, 0],
          0, 0
        );
      }
      throw error;
    }
  };

  // Calculate sunrise
  const sunriseResult = callRiseTrans(PlanetId.SUN, CALC_RISE);
  
  // Calculate sunset
  const sunsetResult = callRiseTrans(PlanetId.SUN, CALC_SET);
  
  // Extract Julian day results - swe_rise_trans returns { transitTime, name } or { error }
  const sunriseJd = sunriseResult?.transitTime || sunriseResult?.dret?.[0] || jd + 0.25;
  const sunsetJd = sunsetResult?.transitTime || sunsetResult?.dret?.[0] || jd + 0.75;
  
  // Convert to dates
  const sunrise = julianToDate(sunriseJd, timezone);
  const sunset = julianToDate(sunsetJd, timezone);
  
  // Calculate day length
  const dayLengthMs = sunset.getTime() - sunrise.getTime();
  const dayLength = dayLengthMs / (1000 * 60 * 60); // hours
  
  // Calculate solar noon (midpoint between sunrise and sunset)
  const solarNoon = new Date(sunrise.getTime() + dayLengthMs / 2);
  
  // Calculate civil twilight (sun 6° below horizon)
  const civilTwilightStart = calculateTwilightTime(jd, location, 6, true, timezone);
  const civilTwilightEnd = calculateTwilightTime(jd, location, 6, false, timezone);
  
  // Calculate nautical twilight (sun 12° below horizon)
  const nauticalTwilightStart = calculateTwilightTime(jd, location, 12, true, timezone);
  const nauticalTwilightEnd = calculateTwilightTime(jd, location, 12, false, timezone);
  
  return {
    sunrise,
    sunset,
    solarNoon,
    dayLength,
    civilTwilightStart,
    civilTwilightEnd,
    nauticalTwilightStart,
    nauticalTwilightEnd,
  };
}

/**
 * Calculate twilight time for a specific depression angle
 * @param jd - Julian day at midnight
 * @param location - Geographic location
 * @param depression - Depression angle in degrees (6=civil, 12=nautical, 18=astronomical)
 * @param isRise - true for morning twilight, false for evening
 * @param timezone - Timezone offset in hours
 * @returns Twilight time or null if doesn't occur
 */
function calculateTwilightTime(
  jd: number,
  location: GeoLocation,
  depression: number,
  isRise: boolean,
  timezone: number
): Date | null {
  try {
    const sweph = getNativeModule();
    
    const SEFLG_SWIEPH = sweph.SEFLG_SWIEPH || 2;
    const flags = isRise 
      ? (sweph.SE_CALC_RISE || 1)
      : (sweph.SE_CALC_SET || 2);
    
    // Helper to call swe_rise_trans with fallback for different signatures
    const callRiseTrans = (id: number, rsmi: number) => {
      try {
        // Try flat arguments first
        return sweph.swe_rise_trans(
          jd, id, '', SEFLG_SWIEPH, rsmi,
          location.longitude, location.latitude, 0,
          0, 0
        );
      } catch (error: any) {
        if (error && error.message && error.message.includes('Wrong type of arguments')) {
          // Try array argument
          return sweph.swe_rise_trans(
            jd, id, '', SEFLG_SWIEPH, rsmi,
            [location.longitude, location.latitude, 0],
            0, 0
          );
        }
        throw error;
      }
    };

    // Use civil twilight flag with custom depression
    const result = callRiseTrans(PlanetId.SUN, flags | (sweph.SE_BIT_CIVIL_TWILIGHT || 0x100));
    
    // swe_rise_trans returns { transitTime, name } or { error }
    const transitTime = result?.transitTime || result?.dret?.[0];
    if (transitTime) {
      return julianToDate(transitTime, timezone);
    }
  } catch {
    // Twilight calculation failed
  }
  
  return null;
}

/**
 * Calculate solar noon (meridian transit)
 * @param date - Date for calculation
 * @param location - Geographic location
 * @returns Solar noon time and sun altitude
 */
export function calculateSolarNoon(
  date: Date,
  location: GeoLocation
): SolarNoonResult {
  const sunTimes = calculateSunTimes(date, location);
  
  // Calculate sun altitude at noon
  const sweph = getNativeModule();
  const timezone = location.timezone ?? 0;
  
  // Convert solar noon to UTC
  const noonUtc = new Date(sunTimes.solarNoon.getTime() - timezone * 60 * 60 * 1000);
  const jd = dateToJulian(noonUtc);
  
  // Calculate sun position at noon
  const result = sweph.swe_calc_ut(jd, PlanetId.SUN, sweph.SEFLG_EQUATORIAL || 0x0800);
  
  let declination = 0;
  if (Array.isArray(result)) {
    declination = result[1] || 0;
  } else if (result?.xx) {
    declination = result.xx[1] || 0;
  }
  
  // Calculate altitude at meridian transit
  // altitude = 90° - |latitude - declination|
  const altitude = 90 - Math.abs(location.latitude - declination);
  
  return {
    time: sunTimes.solarNoon,
    altitude: Math.max(0, altitude),
  };
}

/**
 * Calculate Azimuth and Altitude (Helper)
 */
function calculateAzAlt(
  sweph: any,
  jd: number,
  location: GeoLocation,
  planetPos: { longitude: number; latitude: number; distance: number }
): { azimuth: number; altitude: number } {
  // swe_azalt expects: tjd_ut, calc_flag, geopos, atpress, attemp, xin
  // xin: array of 3 doubles: longitude, latitude, distance
  const geopos = [location.longitude, location.latitude, 0];
  const xin = [planetPos.longitude, planetPos.latitude, planetPos.distance];
  
  const result = sweph.swe_azalt(
    jd,
    sweph.SE_EQU2HOR, // Flag to convert equatorial to horizontal
    geopos,
    0, // Pressure (0 = default 1013.25 mbar)
    10, // Temperature (10C)
    xin
  );
  
  return {
    azimuth: result.azimuth || result[0] || 0,
    altitude: result.altitude || result[1] || 0
  };
}

/**
 * Calculate daily sun path (position every hour)
 * @param date - Date for calculation
 * @param location - Geographic location
 * @returns Array of sun positions
 */
export function calculateSunPath(
  date: Date,
  location: GeoLocation
): { time: Date; azimuth: number; altitude: number }[] {
  initializeSweph();
  const sweph = getNativeModule();
  
  const timezone = location.timezone ?? 0;
  
  // Start from midnight
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const path: { time: Date; azimuth: number; altitude: number }[] = [];
  
  // Calculate for every hour of the day (0 to 23)
  for (let i = 0; i < 24; i++) {
    const time = new Date(startOfDay.getTime() + i * 60 * 60 * 1000);
    
    // Convert to UTC for calculation
    const utcTime = new Date(time.getTime() - timezone * 60 * 60 * 1000);
    const jd = dateToJulian(utcTime);
    
    // Calculate Sun position
    // SEFLG_EQUATORIAL | SEFLG_SPEED
    const flags = (sweph.SEFLG_EQUATORIAL || 0x0800) | (sweph.SEFLG_SPEED || 0x100);
    
    const result = sweph.swe_calc_ut(jd, PlanetId.SUN, flags);
    
    if (result) {
        let longitude = 0;
        let latitude = 0;
        let distance = 0;
        
        if (Array.isArray(result)) {
            longitude = result[0] || 0;
            latitude = result[1] || 0;
            distance = result[2] || 0;
        } else if (result.xx) {
            longitude = result.xx[0] || 0;
            latitude = result.xx[1] || 0;
            distance = result.xx[2] || 0;
        }
        
        const azAlt = calculateAzAlt(sweph, jd, location, { longitude, latitude, distance });
        
        path.push({
            time,
            azimuth: azAlt.azimuth,
            altitude: azAlt.altitude
        });
    }
  }
  
  return path;
}
