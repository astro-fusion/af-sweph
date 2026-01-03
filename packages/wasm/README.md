# @af/sweph-wasm

Browser-based implementation of the Swiss Ephemeris library using WebAssembly.

## Installation

```bash
pnpm add @af/sweph-wasm
```

## Features

- **WebAssembly Power**: Runs the original Swiss Ephemeris C code in the browser.
- **Browser-Ready**: Dynamic loading of `.wasm` binaries.
- **Unified API**: Implements the same interface as the Node and React Native versions.

## Usage

```typescript
import { createSweph } from '@af/sweph-wasm';

async function calculate() {
  const sweph = await createSweph();
  const planets = sweph.calculatePlanets(new Date());
  console.log(planets);
}

calculate();
```
