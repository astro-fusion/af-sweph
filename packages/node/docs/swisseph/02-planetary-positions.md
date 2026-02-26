# Swiss Ephemeris: Planetary Positions

## `swe_calc_ut()` and `swe_calc()`

These functions calculate the position of a celestial body.

### Call Parameters
```c
int32 swe_calc_ut(
    double tjd_ut,    // Julian day, Universal Time
    int32 ipl,        // Body number
    int32 iflag,      // Calculation flags
    double *xx,       // Target array (6 doubles)
    char *serr        // Error message buffer
);
```

### Body Numbers (`ipl`)
- `SE_SUN` (0)
- `SE_MOON` (1)
- `SE_MERCURY` (2)
- `SE_VENUS` (3)
- `SE_MARS` (4)
- `SE_JUPITER` (5)
- `SE_SATURN` (6)
- `SE_URANUS` (7)
- `SE_NEPTUNE` (8)
- `SE_PLUTO` (9)
- `SE_MEAN_NODE` (10) - Traditional Rahu
- `SE_TRUE_NODE` (11) - True Rahu

### Calculation Flags (`iflag`)
- `SEFLG_JPLEPH` (1): Use JPL ephemeris
- `SEFLG_SWIEPH` (2): Use Swiss Ephemeris
- `SEFLG_MOSEPH` (4): Use Moshier ephemeris
- `SEFLG_SIDEREAL` (65536): Sidereal positions
- `SEFLG_SPEED` (256): Calculate daily motion (speed)

### Result Array (`xx`)
- `xx[0]`: Longitude
- `xx[1]`: Latitude
- `xx[2]`: Distance (AU)
- `xx[3]`: Speed in longitude (deg/day)
- `xx[4]`: Speed in latitude (deg/day)
- `xx[5]`: Speed in distance (AU/day)
