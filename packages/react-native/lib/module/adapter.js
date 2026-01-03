/**
 * @af/sweph-react-native - Native Adapter
 * 
 * Adapts React Native Turbo Module to ISwephAdapter interface.
 */

import NativeSweph from './NativeSweph';
export class ReactNativeAdapter {
  // Flag constants (duplicated here as RN module might not expose them directly as properties)
  SEFLG_SWIEPH = 2;
  SEFLG_SPEED = 256;
  SE_CALC_RISE = 1;
  SE_CALC_SET = 2;
  SE_CALC_MTRANSIT = 4;
  swe_julday(year, month, day, hour, gregflag) {
    return NativeSweph.swe_julday(year, month, day, hour, gregflag);
  }
  swe_calc_ut(tjd_ut, ipl, iflag) {
    const result = NativeSweph.swe_calc_ut(tjd_ut, ipl, iflag);
    if (result.error) {
      return {
        error: result.error
      };
    }
    return result;
  }
  swe_set_ephe_path(path) {
    NativeSweph.swe_set_ephe_path(path);
  }
  swe_set_sid_mode(sid_mode, t0, ayan_t0) {
    NativeSweph.swe_set_sid_mode(sid_mode, t0, ayan_t0);
  }
  swe_get_ayanamsa(tjd_et) {
    return NativeSweph.swe_get_ayanamsa(tjd_et);
  }
  swe_get_ayanamsa_ut(tjd_ut) {
    return NativeSweph.swe_get_ayanamsa_ut(tjd_ut);
  }
  swe_rise_trans(tjd_ut, ipl, starname, epheflag, rsmi, geopos, atpress, attemp) {
    const result = NativeSweph.swe_rise_trans(tjd_ut, ipl, starname, epheflag, rsmi, geopos, atpress, attemp);
    if (result.error) {
      return {
        error: result.error
      };
    }
    return {
      transitTime: result.transitTime,
      flag: result.flag
    };
  }
  swe_azalt(tjd_ut, calc_flag, geopos, atpress, attemp, xin) {
    return NativeSweph.swe_azalt(tjd_ut, calc_flag, geopos, atpress, attemp, xin);
  }
  swe_version() {
    return NativeSweph.swe_version();
  }
}
//# sourceMappingURL=adapter.js.map