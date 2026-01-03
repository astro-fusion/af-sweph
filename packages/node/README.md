# @af/sweph-node

Node.js implementation of the Swiss Ephemeris library with pre-built native binaries. Optimized for Serverless/Vercel.

## Installation

```bash
pnpm add @af/sweph-node
```

## Features

- **Vercel Compatible**: Pre-built binaries for `linux-x64` ensure it works in serverless functions without native compilation.
- **High Performance**: Direct C++ bindings to the Swiss Ephemeris library.
- **Async Loader**: Hides native requirements from bundlers like Webpack/Turbo.

## Usage

```typescript
import { createSweph } from '@af/sweph-node';

async function calculate() {
  const sweph = await createSweph();
  const planets = sweph.calculatePlanets(new Date());
  console.log(planets);
}
```
