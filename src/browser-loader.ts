/**
 * Browser/WASM Loader for @af/sweph
 * 
 * This module is COMPLETELY INDEPENDENT from native-loader.ts.
 * It handles loading the WebAssembly module for browser environments.
 * 
 * The package.json "browser" field aliases native-loader to this file
 * when bundling for browser targets.
 */

// Cached WASM module instance
let swephInstance: any = null;
let wasmModule: any = null;
let loading = false;
let loadPromise: Promise<any> | null = null;

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
async function loadWasmModule(options?: { wasmUrl?: string }): Promise<any> {
    // Dynamic import of the WASM glue code
    // @ts-expect-error - Module is generated at build time
    const createSwephModule = (await import('../prebuilds/wasm/swisseph.js')).default;

    const moduleConfig: any = {
        locateFile: (path: string, scriptDirectory: string) => {
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
function createWrapper(Module: any): any {
    return {
        ...SE,

        swe_version: () => {
            const ptr = Module._malloc(256);
            try {
                Module._swe_version(ptr);
                return Module.UTF8ToString(ptr);
            } finally {
                Module._free(ptr);
            }
        },

        swe_julday: (year: number, month: number, day: number, hour: number, gregflag: number) => {
            return Module._swe_julday(year, month, day, hour, gregflag);
        },

        swe_set_ephe_path: (path: string) => {
            const encoder = new TextEncoder();
            const bytes = encoder.encode(path + '\0');
            const ptr = Module._malloc(bytes.length);
            try {
                Module.HEAPU8.set(bytes, ptr);
                Module._swe_set_ephe_path(ptr);
            } finally {
                Module._free(ptr);
            }
        },

        swe_set_sid_mode: (sid_mode: number, t0: number, ayan_t0: number) => {
            Module._swe_set_sid_mode(sid_mode, t0, ayan_t0);
        },

        swe_get_ayanamsa: (tjd_et: number) => {
            return Module._swe_get_ayanamsa(tjd_et);
        },

        swe_get_ayanamsa_ut: (tjd_ut: number) => {
            return Module._swe_get_ayanamsa_ut(tjd_ut);
        },

        swe_calc_ut: (tjd_ut: number, ipl: number, iflag: number) => {
            const serrPtr = Module._malloc(256);
            const xxPtr = Module._malloc(6 * 8); // 6 doubles

            try {
                const flag = Module._swe_calc_ut(tjd_ut, ipl, iflag, xxPtr, serrPtr);

                if (flag < 0) {
                    const error = Module.UTF8ToString(serrPtr);
                    return { error };
                }

                const xx: number[] = [];
                for (let i = 0; i < 6; i++) {
                    xx.push(Module.getValue(xxPtr + i * 8, 'double'));
                }

                return { flag, xx, rc: flag };
            } finally {
                Module._free(serrPtr);
                Module._free(xxPtr);
            }
        },

        swe_rise_trans: (
            tjd_ut: number,
            ipl: number,
            starname: string,
            epheflag: number,
            rsmi: number,
            geopos: number[],
            atpress: number,
            attemp: number
        ) => {
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

                const ret = Module._swe_rise_trans(
                    tjd_ut, ipl, starnamePtr, epheflag, rsmi,
                    geoposPtr, atpress, attemp,
                    tretPtr, serrPtr
                );

                if (ret < 0) {
                    return { error: Module.UTF8ToString(serrPtr) };
                }

                return {
                    transitTime: Module.getValue(tretPtr, 'double'),
                    flag: ret
                };

            } finally {
                Module._free(serrPtr);
                Module._free(tretPtr);
                Module._free(geoposPtr);
                if (starnamePtr) Module._free(starnamePtr);
            }
        },

        swe_azalt: (
            tjd_ut: number,
            calc_flag: number,
            geopos: number[],
            atpress: number,
            attemp: number,
            xin: number[]
        ) => {
            const xazPtr = Module._malloc(3 * 8);
            const geoposPtr = Module._malloc(3 * 8);
            const xinPtr = Module._malloc(3 * 8);

            try {
                for (let i = 0; i < 3; i++) Module.setValue(geoposPtr + i * 8, geopos[i] || 0, 'double');
                for (let i = 0; i < 3; i++) Module.setValue(xinPtr + i * 8, xin[i] || 0, 'double');

                Module._swe_azalt(tjd_ut, calc_flag, geoposPtr, atpress, attemp, xinPtr, xazPtr);

                return {
                    azimuth: Module.getValue(xazPtr, 'double'),
                    altitude: Module.getValue(xazPtr + 8, 'double'),
                };
            } finally {
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
export async function loadNativeBinary(options?: { wasmUrl?: string }): Promise<any> {
    if (swephInstance) return swephInstance;

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
        } catch (error) {
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
export function getNativeModuleSync(): any {
    if (!swephInstance) {
        throw new Error(
            "Swiss Ephemeris WASM module not initialized. " +
            "Call await initializeSweph() before using calculation functions in the browser."
        );
    }
    return swephInstance;
}

/**
 * Platform info for browser (always returns browser info)
 */
export function getPlatformInfo(): {
    platform: string;
    arch: string;
    key: string;
    isSupported: boolean;
    prebuildPaths: string[];
} {
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
export function hasPrebuilds(): boolean {
    return typeof (globalThis as any).WebAssembly !== 'undefined';
}

/**
 * Get supported platforms for browser
 */
export function getSupportedPlatforms(): readonly string[] {
    return ['browser-wasm'];
}
