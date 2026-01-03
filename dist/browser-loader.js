"use strict";
/**
 * Browser/WASM Loader for @af/sweph
 *
 * This module is COMPLETELY INDEPENDENT from native-loader.ts.
 * It handles loading the WebAssembly module for browser environments.
 *
 * The package.json "browser" field aliases native-loader to this file
 * when bundling for browser targets.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadNativeBinary = loadNativeBinary;
exports.getNativeModuleSync = getNativeModuleSync;
exports.getPlatformInfo = getPlatformInfo;
exports.hasPrebuilds = hasPrebuilds;
exports.getSupportedPlatforms = getSupportedPlatforms;
// Cached WASM module instance
let swephInstance = null;
let wasmModule = null;
let loading = false;
let loadPromise = null;
// Constants from Swiss Ephemeris (duplicated here for independence)
const SE = {
    SE_JUL_CAL: 0,
    SE_GREG_CAL: 1,
    SEFLG_JPLEPH: 1,
    SEFLG_SWIEPH: 2,
    SEFLG_MOSEPH: 4,
    SEFLG_SPEED: 256,
    SEFLG_TOPOCTR: 32 * 1024,
    SEFLG_EQUATORIAL: 2 * 1024,
    SE_CALC_RISE: 1,
    SE_CALC_SET: 2,
    SE_CALC_MTRANSIT: 4,
    SE_CALC_ITRANSIT: 8,
    SE_ECL_NUT: -1
};
/**
 * Dynamically import the WASM module
 * This function loads swisseph.js at runtime
 */
async function loadWasmModule(options) {
    // Dynamic import of the WASM glue code
    // @ts-expect-error - Module is generated at build time
    const createSwephModule = (await Promise.resolve().then(() => __importStar(require('../prebuilds/wasm/swisseph.js')))).default;
    const moduleConfig = {
        locateFile: (path, scriptDirectory) => {
            if (path.endsWith('.wasm') && options?.wasmUrl) {
                return options.wasmUrl;
            }
            return scriptDirectory + path;
        }
    };
    return createSwephModule(moduleConfig);
}
/**
 * Create a wrapper object that matches the node-swisseph API
 */
function createWrapper(Module) {
    return {
        ...SE,
        swe_version: () => {
            const ptr = Module._malloc(256);
            try {
                Module._swe_version(ptr);
                return Module.UTF8ToString(ptr);
            }
            finally {
                Module._free(ptr);
            }
        },
        swe_julday: (year, month, day, hour, gregflag) => {
            return Module._swe_julday(year, month, day, hour, gregflag);
        },
        swe_set_ephe_path: (path) => {
            const encoder = new TextEncoder();
            const bytes = encoder.encode(path + '\0');
            const ptr = Module._malloc(bytes.length);
            try {
                Module.HEAPU8.set(bytes, ptr);
                Module._swe_set_ephe_path(ptr);
            }
            finally {
                Module._free(ptr);
            }
        },
        swe_set_sid_mode: (sid_mode, t0, ayan_t0) => {
            Module._swe_set_sid_mode(sid_mode, t0, ayan_t0);
        },
        swe_get_ayanamsa: (tjd_et) => {
            return Module._swe_get_ayanamsa(tjd_et);
        },
        swe_get_ayanamsa_ut: (tjd_ut) => {
            return Module._swe_get_ayanamsa_ut(tjd_ut);
        },
        swe_calc_ut: (tjd_ut, ipl, iflag) => {
            const serrPtr = Module._malloc(256);
            const xxPtr = Module._malloc(6 * 8); // 6 doubles
            try {
                const flag = Module._swe_calc_ut(tjd_ut, ipl, iflag, xxPtr, serrPtr);
                if (flag < 0) {
                    const error = Module.UTF8ToString(serrPtr);
                    return { error };
                }
                const xx = [];
                for (let i = 0; i < 6; i++) {
                    xx.push(Module.getValue(xxPtr + i * 8, 'double'));
                }
                return { flag, xx, rc: flag };
            }
            finally {
                Module._free(serrPtr);
                Module._free(xxPtr);
            }
        },
        swe_rise_trans: (tjd_ut, ipl, starname, epheflag, rsmi, geopos, atpress, attemp) => {
            const serrPtr = Module._malloc(256);
            const tretPtr = Module._malloc(8 * 8);
            const geoposPtr = Module._malloc(3 * 8);
            let starnamePtr = 0;
            if (starname) {
                const encoder = new TextEncoder();
                const bytes = encoder.encode(starname + '\0');
                starnamePtr = Module._malloc(bytes.length);
                Module.HEAPU8.set(bytes, starnamePtr);
            }
            try {
                for (let i = 0; i < 3; i++) {
                    Module.setValue(geoposPtr + i * 8, geopos[i] || 0, 'double');
                }
                const ret = Module._swe_rise_trans(tjd_ut, ipl, starnamePtr, epheflag, rsmi, geoposPtr, atpress, attemp, tretPtr, serrPtr);
                if (ret < 0) {
                    return { error: Module.UTF8ToString(serrPtr) };
                }
                return {
                    transitTime: Module.getValue(tretPtr, 'double'),
                    flag: ret
                };
            }
            finally {
                Module._free(serrPtr);
                Module._free(tretPtr);
                Module._free(geoposPtr);
                if (starnamePtr)
                    Module._free(starnamePtr);
            }
        },
        swe_azalt: (tjd_ut, calc_flag, geopos, atpress, attemp, xin) => {
            const xazPtr = Module._malloc(3 * 8);
            const geoposPtr = Module._malloc(3 * 8);
            const xinPtr = Module._malloc(3 * 8);
            try {
                for (let i = 0; i < 3; i++)
                    Module.setValue(geoposPtr + i * 8, geopos[i] || 0, 'double');
                for (let i = 0; i < 3; i++)
                    Module.setValue(xinPtr + i * 8, xin[i] || 0, 'double');
                Module._swe_azalt(tjd_ut, calc_flag, geoposPtr, atpress, attemp, xinPtr, xazPtr);
                return {
                    azimuth: Module.getValue(xazPtr, 'double'),
                    altitude: Module.getValue(xazPtr + 8, 'double'),
                };
            }
            finally {
                Module._free(xazPtr);
                Module._free(geoposPtr);
                Module._free(xinPtr);
            }
        }
    };
}
/**
 * Load and initialize the WASM module
 * This is the browser equivalent of loadNativeBinary from native-loader.ts
 */
async function loadNativeBinary(options) {
    if (swephInstance)
        return swephInstance;
    if (loading && loadPromise) {
        return loadPromise;
    }
    loading = true;
    loadPromise = (async () => {
        try {
            wasmModule = await loadWasmModule(options);
            swephInstance = createWrapper(wasmModule);
            loading = false;
            return swephInstance;
        }
        catch (error) {
            loading = false;
            console.error('Failed to initialize Swiss Ephemeris WASM module:', error);
            throw error;
        }
    })();
    return loadPromise;
}
/**
 * Get native module instance (throws if not loaded)
 * Browser equivalent of getNativeModuleSync
 */
function getNativeModuleSync() {
    if (!swephInstance) {
        throw new Error("Swiss Ephemeris WASM module not initialized. " +
            "Call await initializeSweph() before using calculation functions in the browser.");
    }
    return swephInstance;
}
/**
 * Platform info for browser (always returns browser info)
 */
function getPlatformInfo() {
    return {
        platform: 'browser',
        arch: 'wasm',
        key: 'browser-wasm',
        isSupported: true,
        prebuildPaths: [],
    };
}
/**
 * Check if WASM is available (always true in supported browsers)
 */
function hasPrebuilds() {
    return typeof globalThis.WebAssembly !== 'undefined';
}
/**
 * Get supported platforms for browser
 */
function getSupportedPlatforms() {
    return ['browser-wasm'];
}
//# sourceMappingURL=browser-loader.js.map