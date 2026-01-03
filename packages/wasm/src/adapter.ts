/**
 * @af/sweph-wasm - WASM Adapter
 * 
 * Implements ISwephAdapter interface for WebAssembly module.
 */

import type { ISwephAdapter, CalcResult, RiseTransResult, AzAltResult } from '@af/sweph-core';

// Swiss Ephemeris constants
const SE_CONSTANTS = {
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
};

/**
 * WASM module interface (Emscripten generated)
 */
interface WasmModule {
    _malloc(size: number): number;
    _free(ptr: number): void;
    getValue(ptr: number, type: string): number;
    setValue(ptr: number, value: number, type: string): void;
    UTF8ToString(ptr: number): string;
    HEAPU8: Uint8Array;

    _swe_julday(year: number, month: number, day: number, hour: number, gregflag: number): number;
    _swe_calc_ut(tjd_ut: number, ipl: number, iflag: number, xxPtr: number, serrPtr: number): number;
    _swe_set_ephe_path(pathPtr: number): void;
    _swe_set_sid_mode(sid_mode: number, t0: number, ayan_t0: number): void;
    _swe_get_ayanamsa(tjd_et: number): number;
    _swe_get_ayanamsa_ut(tjd_ut: number): number;
    _swe_rise_trans(
        tjd_ut: number, ipl: number, starnamePtr: number, epheflag: number, rsmi: number,
        geoposPtr: number, atpress: number, attemp: number, tretPtr: number, serrPtr: number
    ): number;
    _swe_azalt(
        tjd_ut: number, calc_flag: number, geoposPtr: number, atpress: number, attemp: number,
        xinPtr: number, xazPtr: number
    ): void;
    _swe_version(ptr: number): void;
}

/**
 * WebAssembly adapter implementing ISwephAdapter
 */
export class WasmAdapter implements ISwephAdapter {
    private module: WasmModule;

    // Expose constants
    SEFLG_SWIEPH = SE_CONSTANTS.SEFLG_SWIEPH;
    SEFLG_SPEED = SE_CONSTANTS.SEFLG_SPEED;
    SE_CALC_RISE = SE_CONSTANTS.SE_CALC_RISE;
    SE_CALC_SET = SE_CONSTANTS.SE_CALC_SET;
    SE_CALC_MTRANSIT = SE_CONSTANTS.SE_CALC_MTRANSIT;

    constructor(wasmModule: WasmModule) {
        this.module = wasmModule;
    }

    swe_julday(year: number, month: number, day: number, hour: number, gregflag: number): number {
        return this.module._swe_julday(year, month, day, hour, gregflag);
    }

    swe_calc_ut(tjd_ut: number, ipl: number, iflag: number): CalcResult | { error: string } {
        const serrPtr = this.module._malloc(256);
        const xxPtr = this.module._malloc(6 * 8);

        try {
            const flag = this.module._swe_calc_ut(tjd_ut, ipl, iflag, xxPtr, serrPtr);

            if (flag < 0) {
                return { error: this.module.UTF8ToString(serrPtr) };
            }

            return {
                longitude: this.module.getValue(xxPtr, 'double'),
                latitude: this.module.getValue(xxPtr + 8, 'double'),
                distance: this.module.getValue(xxPtr + 16, 'double'),
                longitudeSpeed: this.module.getValue(xxPtr + 24, 'double'),
                latitudeSpeed: this.module.getValue(xxPtr + 32, 'double'),
                distanceSpeed: this.module.getValue(xxPtr + 40, 'double'),
            };
        } finally {
            this.module._free(serrPtr);
            this.module._free(xxPtr);
        }
    }

    swe_set_ephe_path(path: string): void {
        const encoder = new TextEncoder();
        const bytes = encoder.encode(path + '\0');
        const ptr = this.module._malloc(bytes.length);
        try {
            this.module.HEAPU8.set(bytes, ptr);
            this.module._swe_set_ephe_path(ptr);
        } finally {
            this.module._free(ptr);
        }
    }

    swe_set_sid_mode(sid_mode: number, t0: number, ayan_t0: number): void {
        this.module._swe_set_sid_mode(sid_mode, t0, ayan_t0);
    }

    swe_get_ayanamsa(tjd_et: number): number {
        return this.module._swe_get_ayanamsa(tjd_et);
    }

    swe_get_ayanamsa_ut(tjd_ut: number): number {
        return this.module._swe_get_ayanamsa_ut(tjd_ut);
    }

    swe_rise_trans(
        tjd_ut: number,
        ipl: number,
        starname: string,
        epheflag: number,
        rsmi: number,
        geopos: number[],
        atpress: number,
        attemp: number
    ): RiseTransResult | { error: string } {
        const serrPtr = this.module._malloc(256);
        const tretPtr = this.module._malloc(8 * 8);
        const geoposPtr = this.module._malloc(3 * 8);

        let starnamePtr = 0;
        if (starname) {
            const encoder = new TextEncoder();
            const bytes = encoder.encode(starname + '\0');
            starnamePtr = this.module._malloc(bytes.length);
            this.module.HEAPU8.set(bytes, starnamePtr);
        }

        try {
            for (let i = 0; i < 3; i++) {
                this.module.setValue(geoposPtr + i * 8, geopos[i] || 0, 'double');
            }

            const ret = this.module._swe_rise_trans(
                tjd_ut, ipl, starnamePtr, epheflag, rsmi,
                geoposPtr, atpress, attemp, tretPtr, serrPtr
            );

            if (ret < 0) {
                return { error: this.module.UTF8ToString(serrPtr) };
            }

            return {
                transitTime: this.module.getValue(tretPtr, 'double'),
                flag: ret
            };
        } finally {
            this.module._free(serrPtr);
            this.module._free(tretPtr);
            this.module._free(geoposPtr);
            if (starnamePtr) this.module._free(starnamePtr);
        }
    }

    swe_azalt(
        tjd_ut: number,
        calc_flag: number,
        geopos: number[],
        atpress: number,
        attemp: number,
        xin: number[]
    ): AzAltResult {
        const xazPtr = this.module._malloc(3 * 8);
        const geoposPtr = this.module._malloc(3 * 8);
        const xinPtr = this.module._malloc(3 * 8);

        try {
            for (let i = 0; i < 3; i++) {
                this.module.setValue(geoposPtr + i * 8, geopos[i] || 0, 'double');
                this.module.setValue(xinPtr + i * 8, xin[i] || 0, 'double');
            }

            this.module._swe_azalt(tjd_ut, calc_flag, geoposPtr, atpress, attemp, xinPtr, xazPtr);

            return {
                azimuth: this.module.getValue(xazPtr, 'double'),
                altitude: this.module.getValue(xazPtr + 8, 'double'),
            };
        } finally {
            this.module._free(xazPtr);
            this.module._free(geoposPtr);
            this.module._free(xinPtr);
        }
    }

    swe_version(): string {
        const ptr = this.module._malloc(256);
        try {
            this.module._swe_version(ptr);
            return this.module.UTF8ToString(ptr);
        } finally {
            this.module._free(ptr);
        }
    }
}
