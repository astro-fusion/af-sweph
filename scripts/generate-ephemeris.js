#!/usr/bin/env node
/**
 * @af/sweph Ephemeris Data Generator
 *
 * Generates CSV ephemeris data files used by @af/sweph-json.
 * Requires the native @af/sweph-node package to be built first.
 *
 * Usage:
 *   node scripts/generate-ephemeris.js              # interactive menu
 *   node scripts/generate-ephemeris.js --preset standard --year 2024
 *   node scripts/generate-ephemeris.js --start 1950 --end 2050 --moon-interval 3
 *   node scripts/generate-ephemeris.js --help
 *
 * Presets:
 *   standard  Daily noon planets, Moon 6h, 4 decimal places (~190 KB/year)
 *   fine      Daily noon planets, Moon 3h, 6 decimal places (~280 KB/year)
 *   ultra     Hourly planets, Moon 1h, 8 decimal places     (~4 MB/year)
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const rl   = require('readline');

// ─────────────────────────────────────────────────────────────────────────────
// Swiss Ephemeris loader
// ─────────────────────────────────────────────────────────────────────────────

let sweph;
try {
    sweph = require('../packages/node/dist/index.js');
} catch (e) {
    console.error('\n[ERROR] Could not load @af/sweph-node.');
    console.error('        Run "pnpm build" (or "pnpm -F @af/sweph-node build") first.\n');
    process.exit(1);
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const SE_SUN      = 0;
const SE_MOON     = 1;
const SE_MERCURY  = 2;
const SE_VENUS    = 3;
const SE_MARS     = 4;
const SE_JUPITER  = 5;
const SE_SATURN   = 6;
const SE_URANUS   = 7;
const SE_NEPTUNE  = 8;
const SE_PLUTO    = 9;
const SE_TRUE_NODE = 11; // Rahu

const FLG_SWIEPH     = 2;
const FLG_SPEED      = 256;
const FLG_EQUATORIAL = 2048;
const FLG_TROPICAL   = FLG_SWIEPH | FLG_SPEED;
const FLG_EQ         = FLG_SWIEPH | FLG_SPEED | FLG_EQUATORIAL;

const VEDIC_PLANETS = [
    { id: SE_SUN,       col: 'sun'      },
    { id: SE_MOON,      col: 'moon'     },
    { id: SE_MARS,      col: 'mars'     },
    { id: SE_MERCURY,   col: 'mercury'  },
    { id: SE_JUPITER,   col: 'jupiter'  },
    { id: SE_VENUS,     col: 'venus'    },
    { id: SE_SATURN,    col: 'saturn'   },
    { id: SE_URANUS,    col: 'uranus'   },
    { id: SE_NEPTUNE,   col: 'neptune'  },
    { id: SE_PLUTO,     col: 'pluto'    },
    { id: SE_TRUE_NODE, col: 'rahu'     },
];

const PRESETS = {
    standard: {
        label:        'Standard  — daily noon, Moon 6h,  4 decimal places (~190 KB/year)',
        planetInterval: 24,   // hours between planet snapshots
        moonInterval:   6,    // hours between Moon snapshots
        precision:      4,    // decimal places for longitude/speed
    },
    fine: {
        label:        'Fine      — daily noon, Moon 3h,  6 decimal places (~280 KB/year)',
        planetInterval: 24,
        moonInterval:   3,
        precision:      6,
    },
    ultra: {
        label:        'Ultra     — hourly planets, Moon 1h, 8 decimal places (~4 MB/year)',
        planetInterval: 1,
        moonInterval:   1,
        precision:      8,
    },
};

const OUTPUT_DIR = path.resolve(__dirname, '../ephemeris_data');
const CURRENT_YEAR = new Date().getUTCFullYear();

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function fmt(num, decimals) {
    if (typeof num !== 'number' || isNaN(num)) return '0.' + '0'.repeat(decimals);
    return num.toFixed(decimals);
}

function extractData(res) {
    if (!res) return { lng: 0, lat: 0, dist: 0, spd: 0 };
    if (Array.isArray(res)) return { lng: res[0]||0, lat: res[1]||0, dist: res[2]||0, spd: res[3]||0 };
    if (res.xx) return { lng: res.xx[0]||0, lat: res.xx[1]||0, dist: res.xx[2]||0, spd: res.xx[3]||0 };
    const lng = res.longitude !== undefined ? res.longitude : (res.rectAscension || 0);
    const lat = res.latitude  !== undefined ? res.latitude  : (res.declination   || 0);
    const spd = res.longitudeSpeed !== undefined ? res.longitudeSpeed
              : res.rectAscensionSpeed !== undefined ? res.rectAscensionSpeed
              : (res.speed || 0);
    return { lng, lat, dist: res.distance || 0, spd };
}

function calculateEquationOfTime(lib, jd) {
    try {
        if (typeof lib.swe_time_equ === 'function') {
            const r = lib.swe_time_equ(jd);
            if (typeof r === 'number') return r * 1440.0;
        }
    } catch (_) {}
    const sunEq = extractData(lib.swe_calc_ut(jd, SE_SUN, FLG_EQ));
    const alpha = sunEq.lng;
    const T = (jd - 2451545.0) / 36525.0;
    let L0 = (280.46646 + 36000.76983 * T) % 360;
    if (L0 < 0) L0 += 360;
    let delta = L0 - alpha;
    while (delta >  180) delta -= 360;
    while (delta < -180) delta += 360;
    return delta * 4;
}

function dateRange(year, intervalHours) {
    const dates = [];
    const d = new Date(Date.UTC(year, 0, 1, 12, 0, 0)); // noon Jan 1
    const ms = intervalHours * 3_600_000;
    while (d.getUTCFullYear() === year) {
        dates.push(new Date(d));
        d.setTime(d.getTime() + ms);
    }
    return dates;
}

function moonDateRange(year, intervalHours) {
    const dates = [];
    const d = new Date(Date.UTC(year, 0, 1, 0, 0, 0)); // midnight Jan 1
    const ms = intervalHours * 3_600_000;
    while (d.getUTCFullYear() === year) {
        dates.push(new Date(d));
        d.setTime(d.getTime() + ms);
    }
    return dates;
}

function sizeEstimate(yearCount, cfg) {
    // Rough byte estimates per row
    const mainRowBytes  = 120 + cfg.precision * 22; // ~120 base + extra digits
    const moonRowBytes  = 40  + cfg.precision *  3;
    const mainRows  = (8760 / cfg.planetInterval) * yearCount;
    const moonRows  = (8760 / cfg.moonInterval)  * yearCount;
    const totalKB = Math.round((mainRows * mainRowBytes + moonRows * moonRowBytes) / 1024);
    return totalKB > 1024 ? `${(totalKB / 1024).toFixed(1)} MB` : `${totalKB} KB`;
}

function progress(current, total, label) {
    const pct  = Math.round((current / total) * 100);
    const bar  = '█'.repeat(Math.floor(pct / 5)) + '░'.repeat(20 - Math.floor(pct / 5));
    process.stdout.write(`\r  [${bar}] ${pct}%  ${label}          `);
}

// ─────────────────────────────────────────────────────────────────────────────
// Core generator
// ─────────────────────────────────────────────────────────────────────────────

async function generateYear(lib, year, cfg) {
    const yearDir = path.join(OUTPUT_DIR, year.toString());
    fs.mkdirSync(yearDir, { recursive: true });

    const p = cfg.precision;

    // ── main.csv ─────────────────────────────────────────────────────────────
    const header = ['date', 'ayanamsa', 'sun_declination', 'equation_of_time'];
    VEDIC_PLANETS.forEach(pl => header.push(`${pl.col}_long`, `${pl.col}_speed`));
    header.push('ketu_long', 'ketu_speed');

    const mainRows = [header.join(',')];
    const dates = dateRange(year, cfg.planetInterval);

    for (let i = 0; i < dates.length; i++) {
        const date = dates[i];
        const jd = sweph.dateToJulian(date);
        const row = [];

        // Date label: YYYY-MM-DD (daily) or full ISO (sub-daily)
        if (cfg.planetInterval < 24) {
            row.push(date.toISOString().replace('T', ' ').slice(0, 19));
        } else {
            row.push(date.toISOString().split('T')[0]);
        }

        // Lahiri ayanamsa
        lib.swe_set_sid_mode(1, 0, 0);
        row.push(fmt(lib.swe_get_ayanamsa_ut(jd), p));

        // Sun declination
        const sunEq = extractData(lib.swe_calc_ut(jd, SE_SUN, FLG_EQ));
        row.push(fmt(sunEq.lat, p));

        // Equation of time
        row.push(fmt(calculateEquationOfTime(lib, jd), 2));

        // Planets
        let rahuLong = 0, rahuSpeed = 0;
        for (const pl of VEDIC_PLANETS) {
            const d = extractData(lib.swe_calc_ut(jd, pl.id, FLG_TROPICAL));
            row.push(fmt(d.lng, p));
            row.push(fmt(d.spd, p));
            if (pl.col === 'rahu') { rahuLong = d.lng; rahuSpeed = d.spd; }
        }

        // Ketu = opposite Rahu
        row.push(fmt((rahuLong + 180) % 360, p));
        row.push(fmt(rahuSpeed, p));

        mainRows.push(row.join(','));

        if (i % 30 === 0) progress(i, dates.length, `${year} planets`);
    }

    fs.writeFileSync(path.join(yearDir, 'main.csv'), mainRows.join('\n'));

    // ── moon.csv ─────────────────────────────────────────────────────────────
    const moonHeader = ['timestamp', 'moon_long', 'moon_speed', 'moon_lat'];
    const moonRows = [moonHeader.join(',')];
    const moonDates = moonDateRange(year, cfg.moonInterval);

    for (let i = 0; i < moonDates.length; i++) {
        const date = moonDates[i];
        const jd = sweph.dateToJulian(date);
        const d = extractData(lib.swe_calc_ut(jd, SE_MOON, FLG_TROPICAL));
        moonRows.push([
            date.toISOString().replace('T', ' ').slice(0, 19),
            fmt(d.lng, p),
            fmt(d.spd, p),
            fmt(d.lat, p),
        ].join(','));

        if (i % 100 === 0) progress(i, moonDates.length, `${year} moon`);
    }

    fs.writeFileSync(path.join(yearDir, 'moon.csv'), moonRows.join('\n'));
    process.stdout.write('\r' + ' '.repeat(60) + '\r'); // clear progress line
}

// ─────────────────────────────────────────────────────────────────────────────
// CLI arg parser
// ─────────────────────────────────────────────────────────────────────────────

function parseArgs() {
    const args = process.argv.slice(2);
    const get  = flag => { const i = args.indexOf(flag); return i >= 0 && i+1 < args.length ? args[i+1] : null; };
    const has  = flag => args.includes(flag);

    if (has('--help') || has('-h')) {
        console.log(`
Usage: node scripts/generate-ephemeris.js [options]

Options:
  --preset <name>         standard|fine|ultra  (default: standard)
  --year <YYYY>           single year (overrides --start/--end)
  --start <YYYY>          start year  (default: 1950)
  --end <YYYY>            end year    (default: 2050)
  --moon-interval <h>     Moon snapshot interval in hours (1, 2, 3, 6)
  --planet-interval <h>   Planet snapshot interval in hours (1, 6, 12, 24)
  --precision <n>         Decimal places for longitude (4-8)
  --output <dir>          Output directory (default: ./ephemeris_data)
  --yes                   Skip interactive confirmation
  --help                  Show this help

Presets:
  standard   Daily noon planets, Moon 6h,  4 decimals  (~190 KB/year)
  fine       Daily noon planets, Moon 3h,  6 decimals  (~280 KB/year)
  ultra      Hourly planets,     Moon 1h,  8 decimals  (~4 MB/year)

Examples:
  node scripts/generate-ephemeris.js
  node scripts/generate-ephemeris.js --preset fine --start 2000 --end 2030
  node scripts/generate-ephemeris.js --year 2024 --moon-interval 1 --precision 8
`);
        process.exit(0);
    }

    return {
        preset:         get('--preset'),
        year:           get('--year')           ? parseInt(get('--year'))           : null,
        start:          get('--start')          ? parseInt(get('--start'))          : null,
        end:            get('--end')            ? parseInt(get('--end'))            : null,
        moonInterval:   get('--moon-interval')  ? parseInt(get('--moon-interval'))  : null,
        planetInterval: get('--planet-interval')? parseInt(get('--planet-interval')): null,
        precision:      get('--precision')      ? parseInt(get('--precision'))      : null,
        output:         get('--output'),
        yes:            has('--yes'),
        interactive:    process.argv.length <= 2, // no args → show menu
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// Interactive menu
// ─────────────────────────────────────────────────────────────────────────────

function ask(iface, question) {
    return new Promise(resolve => iface.question(question, resolve));
}

async function interactiveMenu() {
    const iface = rl.createInterface({ input: process.stdin, output: process.stdout });

    console.log('\n╔══════════════════════════════════════════════════════════╗');
    console.log('║        @af/sweph Ephemeris Data Generator               ║');
    console.log('╚══════════════════════════════════════════════════════════╝\n');

    // 1. Preset
    console.log('Select accuracy preset:\n');
    Object.entries(PRESETS).forEach(([key, p], i) =>
        console.log(`  ${i+1}. ${key.padEnd(10)} ${p.label}`)
    );
    console.log('  4. Custom     — set parameters individually\n');

    const presetChoice = (await ask(iface, 'Preset [1]: ')).trim() || '1';
    const presetKeys   = Object.keys(PRESETS);
    let cfg;

    if (presetChoice === '4' || presetChoice.toLowerCase() === 'custom') {
        cfg = { ...PRESETS.standard }; // start from standard defaults
        console.log('\n── Custom parameters (press Enter to use defaults) ──\n');

        const pi = await ask(iface, `  Planet interval in hours [${cfg.planetInterval}]: `);
        if (pi.trim()) cfg.planetInterval = Math.max(1, parseInt(pi) || 24);

        const mi = await ask(iface, `  Moon interval in hours [${cfg.moonInterval}]: `);
        if (mi.trim()) cfg.moonInterval = Math.max(1, parseInt(mi) || 6);

        const pr = await ask(iface, `  Decimal precision [${cfg.precision}]: `);
        if (pr.trim()) cfg.precision = Math.min(10, Math.max(2, parseInt(pr) || 4));
    } else {
        const idx = Math.max(0, Math.min(2, parseInt(presetChoice) - 1));
        cfg = { ...PRESETS[presetKeys[idx]] };
    }

    // 2. Date range
    console.log('\n── Date range ──\n');
    console.log('  1. Single year');
    console.log('  2. Year range');
    console.log('  3. Recommended range for kundali (1950–2050)\n');

    const rangeChoice = (await ask(iface, 'Range [3]: ')).trim() || '3';
    let startYear, endYear;

    if (rangeChoice === '1') {
        const y = (await ask(iface, `  Year [${CURRENT_YEAR}]: `)).trim() || String(CURRENT_YEAR);
        startYear = endYear = parseInt(y);
    } else if (rangeChoice === '2') {
        const s = (await ask(iface, '  Start year [1950]: ')).trim() || '1950';
        const e = (await ask(iface, '  End year   [2050]: ')).trim() || '2050';
        startYear = parseInt(s);
        endYear   = parseInt(e);
    } else {
        startYear = 1950;
        endYear   = 2050;
    }

    // 3. Output dir
    const outDefault = OUTPUT_DIR;
    const outAnswer  = (await ask(iface, `\nOutput directory [${outDefault}]: `)).trim();
    const outDir     = outAnswer || outDefault;

    iface.close();

    // 4. Summary + confirm
    const yearCount = endYear - startYear + 1;
    const estSize   = sizeEstimate(yearCount, cfg);

    console.log('\n══════════════════════════════════════════════════');
    console.log('  Generation plan');
    console.log('══════════════════════════════════════════════════');
    console.log(`  Years:           ${startYear} – ${endYear}  (${yearCount} files)`);
    console.log(`  Planet interval: every ${cfg.planetInterval}h`);
    console.log(`  Moon interval:   every ${cfg.moonInterval}h`);
    console.log(`  Precision:       ${cfg.precision} decimal places`);
    console.log(`  Output:          ${outDir}`);
    console.log(`  Estimated size:  ${estSize}`);
    console.log('══════════════════════════════════════════════════\n');

    const iface2 = rl.createInterface({ input: process.stdin, output: process.stdout });
    const confirm = (await ask(iface2, 'Proceed? [Y/n]: ')).trim().toLowerCase();
    iface2.close();

    if (confirm === 'n' || confirm === 'no') {
        console.log('Cancelled.\n');
        process.exit(0);
    }

    return { cfg, startYear, endYear, outDir };
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
    const argv = parseArgs();

    let cfg, startYear, endYear, outDir;

    if (argv.interactive) {
        ({ cfg, startYear, endYear, outDir } = await interactiveMenu());
    } else {
        // Build config from flags
        const preset = argv.preset && PRESETS[argv.preset] ? argv.preset : 'standard';
        cfg = { ...PRESETS[preset] };

        if (argv.planetInterval) cfg.planetInterval = argv.planetInterval;
        if (argv.moonInterval)   cfg.moonInterval   = argv.moonInterval;
        if (argv.precision)      cfg.precision       = argv.precision;

        if (argv.year) {
            startYear = endYear = argv.year;
        } else {
            startYear = argv.start ?? 1950;
            endYear   = argv.end   ?? 2050;
        }

        outDir = argv.output || OUTPUT_DIR;

        const yearCount = endYear - startYear + 1;
        const estSize   = sizeEstimate(yearCount, cfg);

        console.log('\n@af/sweph Ephemeris Generator');
        console.log(`  Preset:  ${preset}`);
        console.log(`  Years:   ${startYear} – ${endYear}  (${yearCount} year${yearCount > 1 ? 's' : ''})`);
        console.log(`  Moon:    every ${cfg.moonInterval}h | Planets: every ${cfg.planetInterval}h | Precision: ${cfg.precision}dp`);
        console.log(`  Output:  ${outDir}`);
        console.log(`  Size:    ~${estSize}\n`);

        if (!argv.yes) {
            const iface = rl.createInterface({ input: process.stdin, output: process.stdout });
            const confirm = await new Promise(r => iface.question('Proceed? [Y/n]: ', r));
            iface.close();
            if (confirm.trim().toLowerCase() === 'n') { console.log('Cancelled.'); process.exit(0); }
        }
    }

    // Override output dir if specified
    const outputDir = outDir || OUTPUT_DIR;

    console.log('\nInitializing Swiss Ephemeris...');
    await sweph.initializeSweph();
    const lib = sweph.getNativeModule();

    const years = [];
    for (let y = startYear; y <= endYear; y++) years.push(y);
    const total = years.length;

    const startTime = Date.now();
    let done = 0;

    for (const year of years) {
        const targetDir = path.join(outputDir, year.toString());
        fs.mkdirSync(targetDir, { recursive: true });

        // Patch generateYear to use custom output dir
        await generateYearTo(lib, year, cfg, targetDir);
        done++;

        const elapsed  = (Date.now() - startTime) / 1000;
        const eta      = total > 1 ? Math.round((elapsed / done) * (total - done)) : 0;
        const etaStr   = eta > 60 ? `${Math.floor(eta/60)}m ${eta%60}s` : `${eta}s`;
        console.log(`  ✓ ${year}  (${done}/${total}${total > 1 ? ` — ETA ${etaStr}` : ''})`);
    }

    const totalSec = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n✓ Done in ${totalSec}s — files written to: ${outputDir}\n`);
}

async function generateYearTo(lib, year, cfg, yearDir) {
    const p = cfg.precision;

    // ── main.csv ─────────────────────────────────────────────────────────────
    const header = ['date', 'ayanamsa', 'sun_declination', 'equation_of_time'];
    VEDIC_PLANETS.forEach(pl => header.push(`${pl.col}_long`, `${pl.col}_speed`));
    header.push('ketu_long', 'ketu_speed');

    const mainRows = [header.join(',')];
    const dates = dateRange(year, cfg.planetInterval);

    for (let i = 0; i < dates.length; i++) {
        const date = dates[i];
        const jd = sweph.dateToJulian(date);
        const row = [];

        row.push(cfg.planetInterval < 24
            ? date.toISOString().replace('T', ' ').slice(0, 19)
            : date.toISOString().split('T')[0]);

        lib.swe_set_sid_mode(1, 0, 0);
        row.push(fmt(lib.swe_get_ayanamsa_ut(jd), p));

        const sunEq = extractData(lib.swe_calc_ut(jd, SE_SUN, FLG_EQ));
        row.push(fmt(sunEq.lat, p));
        row.push(fmt(calculateEquationOfTime(lib, jd), 2));

        let rahuLong = 0, rahuSpeed = 0;
        for (const pl of VEDIC_PLANETS) {
            const d = extractData(lib.swe_calc_ut(jd, pl.id, FLG_TROPICAL));
            row.push(fmt(d.lng, p));
            row.push(fmt(d.spd, p));
            if (pl.col === 'rahu') { rahuLong = d.lng; rahuSpeed = d.spd; }
        }

        row.push(fmt((rahuLong + 180) % 360, p));
        row.push(fmt(rahuSpeed, p));
        mainRows.push(row.join(','));

        if (i % 50 === 0) progress(i, dates.length, `${year} planets`);
    }
    process.stdout.write('\r' + ' '.repeat(60) + '\r');
    fs.writeFileSync(path.join(yearDir, 'main.csv'), mainRows.join('\n'));

    // ── moon.csv ─────────────────────────────────────────────────────────────
    const moonRows = [['timestamp', 'moon_long', 'moon_speed', 'moon_lat'].join(',')];
    const moonDates = moonDateRange(year, cfg.moonInterval);

    for (let i = 0; i < moonDates.length; i++) {
        const date = moonDates[i];
        const jd = sweph.dateToJulian(date);
        const d = extractData(lib.swe_calc_ut(jd, SE_MOON, FLG_TROPICAL));
        moonRows.push([
            date.toISOString().replace('T', ' ').slice(0, 19),
            fmt(d.lng, p),
            fmt(d.spd, p),
            fmt(d.lat, p),
        ].join(','));

        if (i % 100 === 0) progress(i, moonDates.length, `${year} moon`);
    }
    process.stdout.write('\r' + ' '.repeat(60) + '\r');
    fs.writeFileSync(path.join(yearDir, 'moon.csv'), moonRows.join('\n'));
}

main().catch(err => {
    console.error('\n[FATAL]', err.message || err);
    process.exit(1);
});
