# Swiss Ephemeris: Sidereal Mode

To calculate sidereal positions (Vedic astrology), you must set the sidereal mode and use the `SEFLG_SIDEREAL` flag.

## `swe_set_sid_mode()`

```c
void swe_set_sid_mode(
    int32 sid_mode, 
    double t0, 
    double ayan_t0
);
```

### Predefined Modes (`sid_mode`)
- `SE_SIDM_LAHIRI` (1)
- `SE_SIDM_FAGAN_BRADLEY` (0)
- `SE_SIDM_RAMAN` (3)
- `SE_SIDM_KRISHNAMURTI` (5)
- `SE_SIDM_BHA_VAIP_KHAS` (21) - B.V. Raman

## `swe_get_ayanamsa()`

Returns the ayanamsa correction value for a given Julian Day.

```c
double swe_get_ayanamsa(double tjd_ut);
```

### Usage Pattern
1. Call `swe_set_sid_mode(1, 0, 0)` once.
2. Call `swe_calc_ut(..., iflag | SEFLG_SIDEREAL, ...)` for all planets.
3. The resulting longitude will be sidereal.
