/**
 * @af/sweph-react-native - Native Adapter
 * 
 * Adapts React Native Turbo Module to ISwephAdapter interface.
 */

import type { ISwephAdapter, CalcResult, RiseTransResult, AzAltResult } from '@af/sweph-core';
import NativeSweph from './NativeSweph';

export class ReactNativeAdapter implements ISwephAdapter {
    // Flag constants (duplicated here as RN module might not expose them directly as properties)
    SEFLG_SWIEPH = 2;
    SEFLG_SPEED = 256;
    SE_CALC_RISE = 1;
    SE_CALC_SET = 2;
    SE_CALC_MTRANSIT = 4;

    swe_julday(year: number, month: number, day: number, hour: number, gregflag: number): number {
        return NativeSweph.swe_julday(year, month, day, hour, gregflag);
    }

    swe_calc_ut(tjd_ut: number, ipl: number, iflag: number): CalcResult | { error: string } {
        const result = NativeSweph.swe_calc_ut(tjd_ut, ipl, iflag);
        if (result.error) {
            return { error: result.error };
        }
        return result;
    }

    swe_set_ephe_path(path: string): void {
        NativeSweph.swe_set_ephe_path(path);
    }

    swe_set_sid_mode(sid_mode: number, t0: number, ayan_t0: number): void {
        NativeSweph.swe_set_sid_mode(sid_mode, t0, ayan_t0);
    }

    swe_get_ayanamsa(tjd_et: number): number {
        return NativeSweph.swe_get_ayanamsa(tjd_et);
    }

    swe_get_ayanamsa_ut(tjd_ut: number): number {
        return NativeSweph.swe_get_ayanamsa_ut(tjd_ut);
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
        const result = NativeSweph.swe_rise_trans(
            tjd_ut, ipl, starname, epheflag, rsmi, geopos, atpress, attemp
        );

        if (result.error) {
            return { error: result.error };
        }

        return {
            transitTime: result.transitTime,
            flag: result.flag
        };
    }

    swe_azalt(
        tjd_ut: number,
        calc_flag: number,
        geopos: number[],
        atpress: number,
        attemp: number,
        xin: number[]
    ): AzAltResult {
        return NativeSweph.swe_azalt(tjd_ut, calc_flag, geopos, atpress, attemp, xin);
    }

    swe_version(): string {
        return NativeSweph.swe_version();
    }
}
