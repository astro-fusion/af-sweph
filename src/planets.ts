/**
 * Planet Calculations for @AstroFusion/sweph
 */

import type { Planet, CalculationOptions, GeoLocation } from './types';
import { VEDIC_PLANET_ORDER, CALC_FLAGS, RASHIS } from './constants';
import { 
  initializeSweph, 
  getNativeModule, 
  dateToJulian, 
  julianToDate,
  normalizeLongitude, 
  getRashi, 
  getRashiDegree,
  isRetrograde 
} from './utils';

/**
 * Calculate Azimuth and Altitude
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
 * Check if planet is combust based on distance from Sun
 */
function checkCombustion(planetId: string, planetLong: number, sunLong: number): boolean {
  if (planetId === 'Sun' || planetId === 'Rahu' || planetId === 'Ketu') return false;
  
  // Calculate distance
  let diff = Math.abs(planetLong - sunLong);
  if (diff > 180) diff = 360 - diff;
  
  // Combustion limits (approximate standard values)
  const limits: Record<string, number> = {
    'Moon': 12,
    'Mars': 17,
    'Mercury': 14,
    'Jupiter': 11,
    'Venus': 10,
    'Saturn': 15
  };
  
  const limit = limits[planetId] || 10;
  return diff <= limit;
}

/**
 * Calculate positions for all 9 Vedic planets
 * @param date - Date for calculation
 * @param options - Calculation options (ayanamsa, etc.)
 * @returns Array of planet positions
 */
export function calculatePlanets(
  date: Date,
  options: CalculationOptions = {}
): Planet[] {
  initializeSweph();
  const sweph = getNativeModule();
  
  const { ayanamsa = 1, includeSpeed = true, location } = options;
  
  // Set sidereal mode with specified ayanamsa
  sweph.swe_set_sid_mode(ayanamsa, 0, 0);
  
  const jd = dateToJulian(date);
  const planets: Planet[] = [];
  
  // Build calculation flags
  let flags = CALC_FLAGS.SIDEREAL | CALC_FLAGS.SWIEPH;
  if (includeSpeed) flags |= CALC_FLAGS.SPEED;
  
  let rahuLongitude: number | null = null;
  let rahuSpeed: number | null = null;
  let sunLongitude: number | null = null;
  
  // First pass: Calculate positions
  const calculatedPlanets: any[] = [];
  
  for (const planetDef of VEDIC_PLANET_ORDER) {
    if (planetDef.name === 'Ketu') continue;
    
    const result = sweph.swe_calc_ut(jd, planetDef.id, flags);
    
    if (result && typeof result === 'object') {
       let longitude = 0;
       let latitude = 0;
       let distance = 0;
       let speed = 0;
      
       if (Array.isArray(result)) {
         longitude = result[0] || 0;
         latitude = result[1] || 0;
         distance = result[2] || 0;
         speed = result[3] || 0;
       } else if (result.xx && Array.isArray(result.xx)) {
         longitude = result.xx[0] || 0;
         latitude = result.xx[1] || 0;
         distance = result.xx[2] || 0;
         speed = result.xx[3] || 0;
       } else if ('longitude' in result) {
         longitude = result.longitude;
         latitude = result.latitude || 0;
         distance = result.distance || 0;
         speed = result.longitudeSpeed || result.speed || 0;
       }
       
       const normalizedLong = normalizeLongitude(longitude);
       
       if (planetDef.name === 'Sun') {
         sunLongitude = normalizedLong;
       }
       
       if (planetDef.name === 'Rahu') {
         rahuLongitude = normalizedLong;
         rahuSpeed = speed;
       }
       
       calculatedPlanets.push({
         def: planetDef,
         longitude: normalizedLong,
         latitude,
         distance,
         speed
       });
    }
  }
  
  // Process results including Ketu
  for (const p of calculatedPlanets) {
    let azAlt = {};
    if (location) {
      azAlt = calculateAzAlt(sweph, jd, location, { 
        longitude: p.longitude, 
        latitude: p.latitude, 
        distance: p.distance 
      });
    }
    
    const isCombust = sunLongitude !== null 
      ? checkCombustion(p.def.name, p.longitude, sunLongitude) 
      : false;
      
    planets.push({
      id: p.def.name.toLowerCase(),
      name: p.def.name,
      longitude: p.longitude,
      latitude: p.latitude,
      distance: p.distance,
      speed: p.speed,
      rasi: getRashi(p.longitude),
      rasiDegree: getRashiDegree(p.longitude),
      isRetrograde: isRetrograde(p.speed),
      totalDegree: p.longitude,
      ...azAlt,
      isCombust
    });
  }
  
  // Add Ketu
  if (rahuLongitude !== null) {
      const ketuLongitude = normalizeLongitude(rahuLongitude + 180);
      const ketuSpeed = rahuSpeed !== null ? -rahuSpeed : 0;
      
      let azAlt = {};
      if (location) {
        azAlt = calculateAzAlt(sweph, jd, location, {
          longitude: ketuLongitude,
          latitude: 0,
          distance: 0 
        });
      }
      
      planets.push({
        id: 'ketu',
        name: 'Ketu',
        longitude: ketuLongitude,
        latitude: 0,
        distance: 0,
        speed: ketuSpeed,
        rasi: getRashi(ketuLongitude),
        rasiDegree: getRashiDegree(ketuLongitude),
        isRetrograde: true,
        totalDegree: ketuLongitude,
        ...azAlt,
        isCombust: false
      });
  }
  
  return planets;
}

/**
 * Calculate position for a single planet
 * @param planetId - Swiss Ephemeris planet ID
 * @param date - Date for calculation
 * @param options - Calculation options
 * @returns Planet position or null if calculation fails
 */
export function calculateSinglePlanet(
  planetId: number,
  date: Date,
  options: CalculationOptions = {}
): Planet | null {
  initializeSweph();
  const sweph = getNativeModule();
  
  const { ayanamsa = 1, includeSpeed = true, location } = options;
  
  sweph.swe_set_sid_mode(ayanamsa, 0, 0);
  
  const jd = dateToJulian(date);
  
  let flags = CALC_FLAGS.SIDEREAL | CALC_FLAGS.SWIEPH;
  if (includeSpeed) flags |= CALC_FLAGS.SPEED;
  
  const result = sweph.swe_calc_ut(jd, planetId, flags);
  
  if (!result || typeof result !== 'object') {
    return null;
  }
  
  let longitude = 0;
  let latitude = 0;
  let distance = 0;
  let speed = 0;
  
  if (Array.isArray(result)) {
    longitude = result[0] || 0;
    latitude = result[1] || 0;
    distance = result[2] || 0;
    speed = result[3] || 0;
  } else if (result.xx && Array.isArray(result.xx)) {
    longitude = result.xx[0] || 0;
    latitude = result.xx[1] || 0;
    distance = result.xx[2] || 0;
    speed = result.xx[3] || 0;
  }
  
  const normalizedLong = normalizeLongitude(longitude);
  
  // Get planet name from sweph
  const planetName = sweph.swe_get_planet_name(planetId) || `Planet ${planetId}`;
  
  // Az/Alt
  let azAlt = {};
  if (location) {
    azAlt = calculateAzAlt(sweph, jd, location, {
      longitude: normalizedLong,
      latitude,
      distance
    });
  }
  
  // Check combustion (requires Sun position if we're not Sun)
  let isCombust = false;
  if (planetId !== 0 && planetName !== 'Rahu' && planetName !== 'Ketu') { // 0 is Sun
     // Calculate Sun position briefly for combustion check
     const sunResult = sweph.swe_calc_ut(jd, 0, flags);
     const sunLong = Array.isArray(sunResult) ? sunResult[0] : (sunResult.xx ? sunResult.xx[0] : 0);
     if (sunLong !== undefined) {
       isCombust = checkCombustion(planetName, normalizedLong, normalizeLongitude(sunLong));
     }
  }
  
  return {
    id: planetId.toString(),
    name: planetName,
    longitude: normalizedLong,
    latitude,
    distance,
    speed,
    rasi: getRashi(normalizedLong),
    rasiDegree: getRashiDegree(normalizedLong),
    isRetrograde: isRetrograde(speed),
    totalDegree: normalizedLong, // Legacy compatibility
    ...azAlt,
    isCombust
  };
}

/**
 * Calculate rise and set times for a planet
 * @param planetId - Swiss Ephemeris planet ID
 * @param date - Date for calculation
 * @param location - Geographic location
 * @returns Rise and set times
 */
export function calculatePlanetRiseSetTimes(
  planetId: number,
  date: Date,
  location: GeoLocation
): { rise: Date | null; set: Date | null } {
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
  
  // Calculate rise
  const riseResult = sweph.swe_rise_trans(
    jd,
    planetId,
    0,
    CALC_RISE,
    geopos,
    0,
    0
  );
  
  // Calculate set
  const setResult = sweph.swe_rise_trans(
    jd,
    planetId,
    0,
    CALC_SET,
    geopos,
    0,
    0
  );
  
  const rise = riseResult?.dret?.[0]
    ? julianToDate(riseResult.dret[0], timezone)
    : null;
    
  const set = setResult?.dret?.[0]
    ? julianToDate(setResult.dret[0], timezone)
    : null;
    
  return { rise, set };
}
