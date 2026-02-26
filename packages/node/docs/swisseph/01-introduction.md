# Swiss Ephemeris: Introduction & Setup

To compute a celestial body or point with SWISSEPH, you have to do the following steps.

## 1. Set Ephemeris Path
Before calling any calculation function, you must set the directory path of the ephemeris files:

```c
swe_set_ephe_path("/path/to/ephe");
```

Even if you use the Moshier ephemeris (by passing `NULL`), calling this is recommended for internal initialization.

## 2. Compute Julian Day
From the birth date, compute the Julian day number (UT):

```c
jul_day_UT = swe_julday(year, month, day, hour, gregflag);
```
- `gregflag`: `SE_GREG_CAL` (1) for Gregorian calendar.

## 3. Calculation
Compute a planet or other body:

```c
ret_flag = swe_calc_ut(jul_day_UT, planet_no, flag, lon_lat_rad, err_msg);
```

Or a fixed star:

```c
ret_flag = swe_fixstar_ut(star_nam, jul_day_UT, flag, lon_lat_rad, err_msg);
```

## 4. Cleanup
At the end of computations, close files and free memory:

```c
swe_close();
```
