const fs = require('fs');
const path = require('path');

// Try to import from local build
let sweph;
try {
    sweph = require('../packages/node/dist/index.js');
} catch (e) {
    console.error('Could not load @af/sweph from packages/node/dist. Please run "pnpm build" first.');
    process.exit(1);
}

// Configuration
const START_YEAR = 1900;
const END_YEAR = 2100;
const OUTPUT_DIR = path.resolve(__dirname, '../ephemeris_data');

// Constants
const SE_SUN = 0;
const SE_MOON = 1;
const SE_MERCURY = 2;
const SE_VENUS = 3;
const SE_MARS = 4;
const SE_JUPITER = 5;
const SE_SATURN = 6;
const SE_URANUS = 7;
const SE_NEPTUNE = 8;
const SE_PLUTO = 9;
const SE_TRUE_NODE = 11; // Rahu

// Flags
// SEFLG_SWIEPH (2) | SEFLG_SPEED (256) | SEFLG_EQUATORIAL (2048)
const FLG_SWIEPH = 2;
const FLG_SPEED = 256;
const FLG_EQUATORIAL = 2048;
const FLG_TROPICAL = FLG_SWIEPH | FLG_SPEED; // No SEFLG_SIDEREAL

// Planet mapping for main.csv
const MAIN_PLANETS = [
    { id: SE_SUN, name: 'sun', col: 'sun' },
    { id: SE_MOON, name: 'moon', col: 'moon' },
    { id: SE_MARS, name: 'mars', col: 'mars' },
    { id: SE_MERCURY, name: 'mercury', col: 'mercury' },
    { id: SE_JUPITER, name: 'jupiter', col: 'jupiter' },
    { id: SE_VENUS, name: 'venus', col: 'venus' },
    { id: SE_SATURN, name: 'saturn', col: 'saturn' },
    { id: SE_URANUS, name: 'uranus', col: 'uranus' },
    { id: SE_NEPTUNE, name: 'neptune', col: 'neptune' },
    { id: SE_PLUTO, name: 'pluto', col: 'pluto' },
    { id: SE_TRUE_NODE, name: 'rahu', col: 'rahu' },
];

/**
 * Format number to fixed decimals
 */
function fmt(num, decimals = 4) {
    return num.toFixed(decimals);
}

/**
 * Get date loop for a year
 */
function getDaysInYear(year) {
    const dates = [];
    const date = new Date(Date.UTC(year, 0, 1, 12, 0, 0)); // Start at noon UTC

    while (date.getUTCFullYear() === year) {
        dates.push(new Date(date));
        date.setUTCDate(date.getUTCDate() + 1);
    }
    return dates;
}

/**
 * Extract data from swe_calc_ut result
 * Handles both array [lng, lat, dist, speed...] 
 * and object { longitude: ..., latitude: ... } or { rectAscension: ... }
 */
function extractData(res) {
    if (!res) return { lng: 0, lat: 0, dist: 0, spd: 0 };

    if (Array.isArray(res)) {
        return { lng: res[0] || 0, lat: res[1] || 0, dist: res[2] || 0, spd: res[3] || 0 };
    }

    if (res.xx) {
        return { lng: res.xx[0] || 0, lat: res.xx[1] || 0, dist: res.xx[2] || 0, spd: res.xx[3] || 0 };
    }

    // Object format (swisseph-v2 special)
    // For equatorial: rectAscension, declination, distance, ...
    // For ecliptic: longitude, latitude, distance, ...
    // Speed might be longitudeSpeed, rectAscensionSpeed, or speed

    const lng = res.longitude !== undefined ? res.longitude : (res.rectAscension !== undefined ? res.rectAscension : 0);
    const lat = res.latitude !== undefined ? res.latitude : (res.declination !== undefined ? res.declination : 0);
    const dist = res.distance || 0;

    // Check speed properties
    let spd = 0;
    if (res.longitudeSpeed !== undefined) spd = res.longitudeSpeed;
    else if (res.rectAscensionSpeed !== undefined) spd = res.rectAscensionSpeed;
    else if (res.speed !== undefined) spd = res.speed;

    return { lng, lat, dist, spd };
}

/**
 * Calculate Equation of Time (minutes)
 * Approx formula or using swe_time_equ if available
 */
function calculateEquationOfTime(lib, jd) {
    // Try to use swe_time_equ if available
    try {
        if (typeof lib.swe_time_equ === 'function') {
            const res = lib.swe_time_equ(jd);
            // swe_time_equ returns value in days. * 1440 for minutes.
            if (typeof res === 'number') return res * 1440.0;
        }
    } catch (e) {
        // Fallback
    }

    // Fallback: E = Apparent Solar Time - mean

    // Get Sun Equatorial
    const sunEqRes = lib.swe_calc_ut(jd, SE_SUN, FLG_SWIEPH | FLG_SPEED | FLG_EQUATORIAL);
    // extractData works for Equatorial (uses rectAscension)
    const sunData = extractData(sunEqRes);
    const alpha = sunData.lng; // RectAscension

    // Mean Longitude of Sun (approx)
    // T = (jd - 2451545.0) / 36525.0
    // L0 = 280.46646 + 36000.76983 * T (degrees)
    const T = (jd - 2451545.0) / 36525.0;
    let L0 = 280.46646 + 36000.76983 * T;
    L0 = L0 % 360;
    if (L0 < 0) L0 += 360;

    // E (minutes) = 4 * (L0 - alpha) (where L0, alpha in degrees)
    let delta = L0 - alpha;
    // Normalize delta to -180 to 180
    while (delta > 180) delta -= 360;
    while (delta < -180) delta += 360;

    return delta * 4;
}

async function main() {
    // Parse args
    const args = process.argv.slice(2);
    let targetYear = null;
    if (args.includes('--year')) {
        const idx = args.indexOf('--year');
        if (idx + 1 < args.length) {
            targetYear = parseInt(args[idx + 1], 10);
        }
    }

    console.log('Initializing Swiss Ephemeris...');
    await sweph.initializeSweph();
    const lib = sweph.getNativeModule();

    const years = targetYear ? [targetYear] : [];
    if (!targetYear) {
        for (let y = START_YEAR; y <= END_YEAR; y++) {
            years.push(y);
        }
    }

    console.log(`Generating ephemeris for years: ${years[0]} - ${years[years.length - 1]}`);

    for (const year of years) {
        const yearDir = path.join(OUTPUT_DIR, year.toString());
        if (!fs.existsSync(yearDir)) {
            fs.mkdirSync(yearDir, { recursive: true });
        }

        console.log(`Processing ${year}...`);

        // --- 1. main.csv (Daily Noon UTC) ---
        const mainRows = [];
        // Header
        const mainHeader = ['date', 'ayanamsa', 'sun_declination', 'equation_of_time'];
        MAIN_PLANETS.forEach(p => {
            mainHeader.push(`${p.col}_long`, `${p.col}_speed`);
        });
        // Add Ketu
        mainHeader.push('ketu_long', 'ketu_speed');

        mainRows.push(mainHeader.join(','));

        const dailyDates = getDaysInYear(year);

        for (const date of dailyDates) {
            const jd = sweph.dateToJulian(date);
            const row = [];

            // Format Date YYYY-MM-DD
            row.push(date.toISOString().split('T')[0]);

            // Ayanamsa (Lahiri)
            lib.swe_set_sid_mode(1, 0, 0); // 1 = Lahiri
            const ayanamsa = lib.swe_get_ayanamsa_ut(jd);
            row.push(fmt(ayanamsa));

            // Sun Declination & Eq Time
            // Get Sun Equatorial
            const sunEqRes = lib.swe_calc_ut(jd, SE_SUN, FLG_SWIEPH | FLG_SPEED | FLG_EQUATORIAL);
            const sunData = extractData(sunEqRes);
            const declination = sunData.lat; // Declination is latitude in equatorial
            row.push(fmt(declination));

            // Equation of Time
            const eqTime = calculateEquationOfTime(lib, jd);
            row.push(fmt(eqTime, 2));

            // Planets
            let rahuLong = 0;
            let rahuSpeed = 0;

            for (const p of MAIN_PLANETS) {
                const res = lib.swe_calc_ut(jd, p.id, FLG_TROPICAL);
                const data = extractData(res);
                const lng = data.lng;
                const spd = data.spd;

                row.push(fmt(lng));
                row.push(fmt(spd));

                if (p.name === 'rahu') {
                    rahuLong = lng;
                    rahuSpeed = spd;
                }
            }

            // Ketu (Opposite Rahu)
            let ketuLong = (rahuLong + 180.0) % 360.0;
            const ketuSpeed = rahuSpeed;

            row.push(fmt(ketuLong));
            row.push(fmt(ketuSpeed));

            mainRows.push(row.join(','));
        }

        fs.writeFileSync(path.join(yearDir, 'main.csv'), mainRows.join('\n'));


        // --- 2. moon.csv (6-hourly) ---
        const moonRows = [];
        moonRows.push(['timestamp', 'moon_long', 'moon_speed', 'moon_lat'].join(','));

        // Generate 6-hourly timestamps
        // Start 00:00 UTC Jan 1
        const moonDate = new Date(Date.UTC(year, 0, 1, 0, 0, 0));
        while (moonDate.getUTCFullYear() === year) {
            const jd = sweph.dateToJulian(moonDate);
            const moonRes = lib.swe_calc_ut(jd, SE_MOON, FLG_TROPICAL);
            const mData = extractData(moonRes);

            const lng = mData.lng;
            const lat = mData.lat;
            const spd = mData.spd;

            moonRows.push([
                moonDate.toISOString(),
                fmt(lng, 5),
                fmt(spd, 5),
                fmt(lat, 5)
            ].join(','));

            // Add 6 hours
            moonDate.setUTCHours(moonDate.getUTCHours() + 6);
        }

        fs.writeFileSync(path.join(yearDir, 'moon.csv'), moonRows.join('\n'));
    }

    console.log('Generation complete!');
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
