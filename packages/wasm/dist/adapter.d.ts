/**
 * @af/sweph-wasm - WASM Adapter
 *
 * Implements ISwephAdapter interface for WebAssembly module.
 */
import type { ISwephAdapter, CalcResult, RiseTransResult, AzAltResult } from '@af/sweph-core';
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
    _swe_rise_trans(tjd_ut: number, ipl: number, starnamePtr: number, epheflag: number, rsmi: number, geoposPtr: number, atpress: number, attemp: number, tretPtr: number, serrPtr: number): number;
    _swe_azalt(tjd_ut: number, calc_flag: number, geoposPtr: number, atpress: number, attemp: number, xinPtr: number, xazPtr: number): void;
    _swe_version(ptr: number): void;
}
/**
 * WebAssembly adapter implementing ISwephAdapter
 */
export declare class WasmAdapter implements ISwephAdapter {
    private module;
    SEFLG_SWIEPH: number;
    SEFLG_SPEED: number;
    SE_CALC_RISE: number;
    SE_CALC_SET: number;
    SE_CALC_MTRANSIT: number;
    constructor(wasmModule: WasmModule);
    swe_julday(year: number, month: number, day: number, hour: number, gregflag: number): number;
    swe_calc_ut(tjd_ut: number, ipl: number, iflag: number): CalcResult | {
        error: string;
    };
    swe_set_ephe_path(path: string): void;
    swe_set_sid_mode(sid_mode: number, t0: number, ayan_t0: number): void;
    swe_get_ayanamsa(tjd_et: number): number;
    swe_get_ayanamsa_ut(tjd_ut: number): number;
    swe_rise_trans(tjd_ut: number, ipl: number, starname: string, epheflag: number, rsmi: number, geopos: number[], atpress: number, attemp: number): RiseTransResult | {
        error: string;
    };
    swe_azalt(tjd_ut: number, calc_flag: number, geopos: number[], atpress: number, attemp: number, xin: number[]): AzAltResult;
    swe_version(): string;
}
export {};
//# sourceMappingURL=adapter.d.ts.map