# Swiss Ephemeris: House Cusps

## `swe_houses()`

Calculates house cusps, Ascendant (Lagna), and MC.

```c
int swe_houses(
    double tjd_ut,    // Julian day, Universal Time
    double geolat,    // Geographic latitude (degrees)
    double geolon,    // Geographic longitude (degrees)
    int hsys,         // House system (ascii code)
    double *cusps,    // Target array for 13 doubles
    double *ascmc     // Target array for 10 doubles
);
```

### House Systems (`hsys`)
- `P`: Placidus
- `K`: Koch
- `O`: Porphyrius
- `R`: Regiomontanus
- `C`: Campanus
- `A`: Equal House (Ascendant as cusp 1)
- `E`: Equal House (MC as cusp 10)
- `V`: Vehlow
- `X`: Whole Sign (Standard Vedic)

### Result: `cusps`
- `cusps[1]`: 1st House Cusp
- `cusps[2]`: 2nd House Cusp
- ...
- `cusps[12]`: 12th House Cusp

### Result: `ascmc`
- `ascmc[0]`: Ascendant (Lagna)
- `ascmc[1]`: MC
- `ascmc[2]`: ARMC
- `ascmc[3]`: Vertex
- `ascmc[4]`: Equatorial Ascendant
- `ascmc[5]`: Co-Ascendant (Koch)
- `ascmc[6]`: Co-Ascendant (Munkasey)
- `ascmc[7]`: Polar Ascendant (Pullen)

### Important Considerations
- For Vedic astrology, if sidereal mode is set, `swe_houses()` usually still returns tropical values in the standard C library. You may need to subtract the ayanamsa value from the results to get sidereal positions.
- Eastern longitude is POSITIVE.
- Western longitude is NEGATIVE.
- Northern latitude is POSITIVE.
- Southern latitude is NEGATIVE.
