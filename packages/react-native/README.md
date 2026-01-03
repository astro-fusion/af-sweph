# @af/sweph-react-native

React Native implementation of the Swiss Ephemeris library using Turbo Modules and JSI.

## Installation

```bash
pnpm add @af/sweph-react-native
```

## Features

- **Turbo Modules**: Leverages the latest React Native architecture for maximum performance.
- **Native Bridges**: Direct JSI bindings to C code on both iOS and Android.
- **No JS Bridge Overhead**: Calculates complex positions with near-native speed.

## Usage

```typescript
import { createSweph } from '@af/sweph-react-native';

async function calculate() {
  const sweph = await createSweph();
  const planets = sweph.calculatePlanets(new Date());
  console.log(planets);
}

calculate();
```
