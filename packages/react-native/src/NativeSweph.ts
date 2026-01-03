/**
 * Turbo Module Specification for Swiss Ephemeris
 */

import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
    // Julian Day
    swe_julday(
        year: number,
        month: number,
        day: number,
        hour: number,
        gregflag: number
    ): number;

    // Calculation (Returns dictionary/object)
    swe_calc_ut(
        tjd_ut: number,
        ipl: number,
        iflag: number
    ): {
        longitude: number;
        latitude: number;
        distance: number;
        longitudeSpeed: number;
        latitudeSpeed: number;
        distanceSpeed: number;
        error: string;
    };

    // Settings
    swe_set_ephe_path(path: string): void;
    swe_set_sid_mode(sid_mode: number, t0: number, ayan_t0: number): void;

    // Ayanamsa
    swe_get_ayanamsa(tjd_et: number): number;
    swe_get_ayanamsa_ut(tjd_ut: number): number;

    // Rise/Transit (Returns dictionary/object)
    swe_rise_trans(
        tjd_ut: number,
        ipl: number,
        starname: string,
        epheflag: number,
        rsmi: number,
        geopos: number[], // Array<number> in RN
        atpress: number,
        attemp: number
    ): {
        transitTime: number;
        flag: number;
        error: string;
    };

    // Azimuth/Altitude (Returns dictionary/object)
    swe_azalt(
        tjd_ut: number,
        calc_flag: number,
        geopos: number[],
        atpress: number,
        attemp: number,
        xin: number[]
    ): {
        azimuth: number;
        altitude: number;
    };

    // Version
    swe_version(): string;
}

export default TurboModuleRegistry.getEnforcing<Spec>('RNSweph');
