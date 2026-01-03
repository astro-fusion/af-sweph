"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ReactNativeAdapter = void 0;
var _NativeSweph = _interopRequireDefault(require("./NativeSweph"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
/**
 * @af/sweph-react-native - Native Adapter
 * 
 * Adapts React Native Turbo Module to ISwephAdapter interface.
 */

class ReactNativeAdapter {
  // Flag constants (duplicated here as RN module might not expose them directly as properties)
  SEFLG_SWIEPH = 2;
  SEFLG_SPEED = 256;
  SE_CALC_RISE = 1;
  SE_CALC_SET = 2;
  SE_CALC_MTRANSIT = 4;
  swe_julday(year, month, day, hour, gregflag) {
    return _NativeSweph.default.swe_julday(year, month, day, hour, gregflag);
  }
  swe_calc_ut(tjd_ut, ipl, iflag) {
    const result = _NativeSweph.default.swe_calc_ut(tjd_ut, ipl, iflag);
    if (result.error) {
      return {
        error: result.error
      };
    }
    return result;
  }
  swe_set_ephe_path(path) {
    _NativeSweph.default.swe_set_ephe_path(path);
  }
  swe_set_sid_mode(sid_mode, t0, ayan_t0) {
    _NativeSweph.default.swe_set_sid_mode(sid_mode, t0, ayan_t0);
  }
  swe_get_ayanamsa(tjd_et) {
    return _NativeSweph.default.swe_get_ayanamsa(tjd_et);
  }
  swe_get_ayanamsa_ut(tjd_ut) {
    return _NativeSweph.default.swe_get_ayanamsa_ut(tjd_ut);
  }
  swe_rise_trans(tjd_ut, ipl, starname, epheflag, rsmi, geopos, atpress, attemp) {
    const result = _NativeSweph.default.swe_rise_trans(tjd_ut, ipl, starname, epheflag, rsmi, geopos, atpress, attemp);
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
    return _NativeSweph.default.swe_azalt(tjd_ut, calc_flag, geopos, atpress, attemp, xin);
  }
  swe_version() {
    return _NativeSweph.default.swe_version();
  }
}
exports.ReactNativeAdapter = ReactNativeAdapter;
//# sourceMappingURL=adapter.js.map