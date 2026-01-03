# @af/sweph Monorepo

The ultimate Swiss Ephemeris library for Vedic Astrology, supporting Node.js, Browser (WASM), and React Native with a unified API.

[![CI](https://github.com/astro-fusion/af-sweph/actions/workflows/ci.yml/badge.svg)](https://github.com/astro-fusion/af-sweph/actions/workflows/ci.yml)
[![Build](https://github.com/astro-fusion/af-sweph/actions/workflows/build.yml/badge.svg)](https://github.com/astro-fusion/af-sweph/actions/workflows/build.yml)

## 🌟 Multi-Platform Architecture

This library is architected as a monorepo to provide optimized implementations for every target platform while maintaining a consistent developer experience.

| Package | Environment | Core Technology | Description |
|---------|-------------|-----------------|-------------|
| [`@af/sweph-core`](./packages/core) | All | TypeScript | Shared logic, interfaces, and pure JS utilities. |
| [`@af/sweph-node`](./packages/node) | Node.js | Native C++ | High-performance implementation using native binaries. |
| [`@af/sweph-wasm`](./packages/wasm) | Browser | WebAssembly | Optimized for web with async loading support. |
| [`@af/sweph-react-native`](./packages/react-native) | Mobile | JSI/Turbo Modules | Native iOS and Android implementation. |

---

## 🚀 Quick Start (Unified API)

Regardless of the platform, the API remains consistent via the `ISwephInstance` interface.

### 1. Installation

Pick the package for your target platform:

```bash
# For Node.js / Serverless (Vercel)
pnpm add @af/sweph-node

# For Browser applications
pnpm add @af/sweph-wasm

# For React Native applications
pnpm add @af/sweph-react-native
```

### 2. Usage Example

```typescript
import { createSweph } from '@af/sweph-node'; // Or @af/sweph-wasm / @af/sweph-react-native

async function run() {
  // 1. Initialize the instance
  const sweph = await createSweph();

  // 2. Perform calculations
  const date = new Date();
  const planets = sweph.calculatePlanets(date, {
    ayanamsa: 1, // Lahiri
    location: { latitude: 27.7, longitude: 85.3 }
  });

  console.log(planets);
}
```

---

## 📦 Packages

### [@af/sweph-core](./packages/core)
The backbone of the library. Contains all shared types, constant definitions (Planet IDs, Ayanamsas), and pure JavaScript utilities that don't depend on a native environment.

### [@af/sweph-node](./packages/node)
The successor to the original `@af/sweph`. It includes pre-built binaries for Linux, macOS, and Windows. It is specifically optimized for **Vercel** and other serverless environments, requiring zero native compilation at deploy time.

### [@af/sweph-wasm](./packages/wasm)
A WebAssembly-powered implementation designed for browser environments. It handles the async loading of the `.wasm` binary and provides a type-safe wrapper. Perfect for static sites or client-side calculation needs.

### [@af/sweph-react-native](./packages/react-native)
Utilizes **Turbo Modules** and **JSI** to bridge the Swiss Ephemeris C library directly into React Native. This provides near-native performance on both iOS and Android without crossing the traditional asynchronous bridge.

---

## 🛠 Features

- **✅ Universal Compatibility** - Node, Browser, iOS, and Android.
- **✅ Vercel Ready** - Pre-built binaries for serverless environments.
- **✅ TypeScript First** - Complete type safety for all astrological entities.
- **✅ Vedic Centric** - Native support for Ayanamsas, Rashis, and Nakshatras.
- **✅ Unified Interface** - Write your business logic once, run it anywhere.

## 🤝 Contributing

This is a monorepo managed with `pnpm`.

```bash
# Clone
git clone https://github.com/astro-fusion/af-sweph

# Install
pnpm install

# Build all packages
pnpm -r build

# Run tests
pnpm -r test
```

## 📄 License

MIT

## ❤️ Credits

- [Swiss Ephemeris](https://www.astro.com/swisseph/) by Astrodienst AG.
- [swisseph-v2](https://github.com/nickhealthy/swisseph-v2) for initial Node.js bindings.
