/**
 * @af/sweph-react-native - Native Adapter
 *
 * Adapts React Native Turbo Module to ISwephAdapter interface.
 */
import type { ISwephAdapter, CalcResult, RiseTransResult, AzAltResult } from '@af/sweph-core';
export declare class ReactNativeAdapter implements ISwephAdapter {
    SEFLG_SWIEPH: number;
    SEFLG_SPEED: number;
    SE_CALC_RISE: number;
    SE_CALC_SET: number;
    SE_CALC_MTRANSIT: number;
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
//# sourceMappingURL=adapter.d.ts.map