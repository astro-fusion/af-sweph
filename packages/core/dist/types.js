"use strict";
/**
 * @af/sweph-core - Shared Types and Interfaces
 *
 * Platform-agnostic type definitions for Swiss Ephemeris calculations.
 * Used by @af/sweph, @af/sweph-wasm, and @af/sweph-react-native.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.HouseSystem = exports.AyanamsaType = exports.PlanetId = void 0;
// ============================================================================
// Enums and Planet IDs
// ============================================================================
/**
 * Swiss Ephemeris planet identifiers
 */
var PlanetId;
(function (PlanetId) {
    PlanetId[PlanetId["SUN"] = 0] = "SUN";
    PlanetId[PlanetId["MOON"] = 1] = "MOON";
    PlanetId[PlanetId["MERCURY"] = 2] = "MERCURY";
    PlanetId[PlanetId["VENUS"] = 3] = "VENUS";
    PlanetId[PlanetId["MARS"] = 4] = "MARS";
    PlanetId[PlanetId["JUPITER"] = 5] = "JUPITER";
    PlanetId[PlanetId["SATURN"] = 6] = "SATURN";
    PlanetId[PlanetId["URANUS"] = 7] = "URANUS";
    PlanetId[PlanetId["NEPTUNE"] = 8] = "NEPTUNE";
    PlanetId[PlanetId["PLUTO"] = 9] = "PLUTO";
    PlanetId[PlanetId["MEAN_NODE"] = 10] = "MEAN_NODE";
    PlanetId[PlanetId["TRUE_NODE"] = 11] = "TRUE_NODE";
    PlanetId[PlanetId["MEAN_APOGEE"] = 12] = "MEAN_APOGEE";
    PlanetId[PlanetId["OSCU_APOGEE"] = 13] = "OSCU_APOGEE";
    PlanetId[PlanetId["EARTH"] = 14] = "EARTH";
    PlanetId[PlanetId["CHIRON"] = 15] = "CHIRON";
})(PlanetId || (exports.PlanetId = PlanetId = {}));
/**
 * Ayanamsa types for sidereal calculations
 */
var AyanamsaType;
(function (AyanamsaType) {
    AyanamsaType[AyanamsaType["FAGAN_BRADLEY"] = 0] = "FAGAN_BRADLEY";
    AyanamsaType[AyanamsaType["LAHIRI"] = 1] = "LAHIRI";
    AyanamsaType[AyanamsaType["DELUCE"] = 2] = "DELUCE";
    AyanamsaType[AyanamsaType["RAMAN"] = 3] = "RAMAN";
    AyanamsaType[AyanamsaType["USHASHASHI"] = 4] = "USHASHASHI";
    AyanamsaType[AyanamsaType["KRISHNAMURTI"] = 5] = "KRISHNAMURTI";
    AyanamsaType[AyanamsaType["DJWHAL_KHUL"] = 6] = "DJWHAL_KHUL";
    AyanamsaType[AyanamsaType["YUKTESHWAR"] = 7] = "YUKTESHWAR";
    AyanamsaType[AyanamsaType["JN_BHASIN"] = 8] = "JN_BHASIN";
    AyanamsaType[AyanamsaType["BABYL_KUGLER1"] = 9] = "BABYL_KUGLER1";
    AyanamsaType[AyanamsaType["BABYL_KUGLER2"] = 10] = "BABYL_KUGLER2";
    AyanamsaType[AyanamsaType["BABYL_KUGLER3"] = 11] = "BABYL_KUGLER3";
    AyanamsaType[AyanamsaType["BABYL_HUBER"] = 12] = "BABYL_HUBER";
    AyanamsaType[AyanamsaType["BABYL_ETPSC"] = 13] = "BABYL_ETPSC";
    AyanamsaType[AyanamsaType["ALDEBARAN_15TAU"] = 14] = "ALDEBARAN_15TAU";
    AyanamsaType[AyanamsaType["HIPPARCHOS"] = 15] = "HIPPARCHOS";
    AyanamsaType[AyanamsaType["SASSANIAN"] = 16] = "SASSANIAN";
    AyanamsaType[AyanamsaType["GALCENT_0SAG"] = 17] = "GALCENT_0SAG";
    AyanamsaType[AyanamsaType["J2000"] = 18] = "J2000";
    AyanamsaType[AyanamsaType["J1900"] = 19] = "J1900";
    AyanamsaType[AyanamsaType["B1950"] = 20] = "B1950";
})(AyanamsaType || (exports.AyanamsaType = AyanamsaType = {}));
/**
 * House system identifiers
 */
var HouseSystem;
(function (HouseSystem) {
    HouseSystem["PLACIDUS"] = "P";
    HouseSystem["KOCH"] = "K";
    HouseSystem["PORPHYRIUS"] = "O";
    HouseSystem["REGIOMONTANUS"] = "R";
    HouseSystem["CAMPANUS"] = "C";
    HouseSystem["EQUAL"] = "E";
    HouseSystem["WHOLE_SIGN"] = "W";
    HouseSystem["MERIDIAN"] = "X";
    HouseSystem["ALCABITIUS"] = "B";
    HouseSystem["MORINUS"] = "M";
    HouseSystem["KRUSINSKI"] = "U";
    HouseSystem["SRIPATI"] = "S";
})(HouseSystem || (exports.HouseSystem = HouseSystem = {}));
//# sourceMappingURL=types.js.map