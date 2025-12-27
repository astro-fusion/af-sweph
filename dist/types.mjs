/**
 * Type Definitions for @AstroFusion/sweph
 *
 * All TypeScript types used across the library.
 */
/**
 * Planet identifiers used in Swiss Ephemeris
 */
export var PlanetId;
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
    PlanetId[PlanetId["CHIRON"] = 15] = "CHIRON";
})(PlanetId || (PlanetId = {}));
/**
 * Ayanamsa systems
 */
export var AyanamsaType;
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
    AyanamsaType[AyanamsaType["BABYLONIAN_KUGLER1"] = 9] = "BABYLONIAN_KUGLER1";
    AyanamsaType[AyanamsaType["BABYLONIAN_KUGLER2"] = 10] = "BABYLONIAN_KUGLER2";
    AyanamsaType[AyanamsaType["BABYLONIAN_KUGLER3"] = 11] = "BABYLONIAN_KUGLER3";
    AyanamsaType[AyanamsaType["BABYLONIAN_HUBER"] = 12] = "BABYLONIAN_HUBER";
    AyanamsaType[AyanamsaType["BABYLONIAN_ETPSC"] = 13] = "BABYLONIAN_ETPSC";
    AyanamsaType[AyanamsaType["ALDEBARAN_15TAU"] = 14] = "ALDEBARAN_15TAU";
    AyanamsaType[AyanamsaType["HIPPARCHOS"] = 15] = "HIPPARCHOS";
    AyanamsaType[AyanamsaType["SASSANIAN"] = 16] = "SASSANIAN";
    AyanamsaType[AyanamsaType["GALCENT_0SAG"] = 17] = "GALCENT_0SAG";
    AyanamsaType[AyanamsaType["J2000"] = 18] = "J2000";
    AyanamsaType[AyanamsaType["J1900"] = 19] = "J1900";
    AyanamsaType[AyanamsaType["B1950"] = 20] = "B1950";
    AyanamsaType[AyanamsaType["TRUE_CITRA"] = 27] = "TRUE_CITRA";
    AyanamsaType[AyanamsaType["TRUE_REVATI"] = 28] = "TRUE_REVATI";
    AyanamsaType[AyanamsaType["TRUE_PUSHYA"] = 29] = "TRUE_PUSHYA";
})(AyanamsaType || (AyanamsaType = {}));
/**
 * House calculation systems
 */
export var HouseSystem;
(function (HouseSystem) {
    HouseSystem["PLACIDUS"] = "P";
    HouseSystem["KOCH"] = "K";
    HouseSystem["REGIOMONTANUS"] = "R";
    HouseSystem["CAMPANUS"] = "C";
    HouseSystem["EQUAL"] = "E";
    HouseSystem["VEHLOW_EQUAL"] = "V";
    HouseSystem["WHOLE_SIGN"] = "W";
    HouseSystem["MERIDIAN"] = "X";
    HouseSystem["HORIZON"] = "H";
    HouseSystem["POLICH_PAGE"] = "T";
    HouseSystem["ALCABITIUS"] = "B";
    HouseSystem["MORINUS"] = "M";
    HouseSystem["PORPHYRIUS"] = "O";
    HouseSystem["SRIPATI"] = "S";
})(HouseSystem || (HouseSystem = {}));
//# sourceMappingURL=types.js.map