# @af/sweph-core

Shared types, interfaces, constants, and pure JavaScript utilities for the `@af/sweph` library.

## Installation

```bash
pnpm add @af/sweph-core
```

## Features

- **Types**: Unified interfaces like `ISwephInstance`, `Planet`, `GeoLocation`.
- **Constants**: Swiss Ephemeris IDs for planets, Ayanamsas, and House Systems.
- **Pure Utils**: Astro math that doesn't require native bindings (e.g., `normalizeLongitude`, `getRashi`).

## Usage

```typescript
import { PLANETS, normalizeLongitude } from '@af/sweph-core';

console.log(PLANETS.SUN.id); // 0
console.log(normalizeLongitude(370)); // 10
```
