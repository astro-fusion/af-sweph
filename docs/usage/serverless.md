# Serverless Deployment Guide

This guide covers deploying `@af/sweph` (native) and `@af/sweph-json` to Vercel, AWS Lambda, and Netlify. It focuses on setup, cold-start strategies, and environment variables.

For production crash modes and debugging, see [docs/SERVERLESS_TROUBLESHOOTING.md](../SERVERLESS_TROUBLESHOOTING.md).

---

## Choose your engine first

Before configuring your deployment, decide which engine to use:

| Engine | Cold start | Accuracy | Deployment risk |
|---|---|---|---|
| `@af/sweph-json` | 5–30ms | ±0.01–0.5° | None — pure JS |
| `@af/sweph` (native) | +200–500ms | Sub-arcsecond | Medium-high (see troubleshooting) |

Recommended: **use `@af/sweph-json` as the primary engine** and lazy-load native only for accuracy-critical requests (professional chart printing, report generation).

---

## Vercel

### JSON engine (recommended for edge and cold-start sensitive routes)

No special configuration needed. The JSON engine is pure JavaScript.

```typescript
// app/api/planets/route.ts
import { createJsonSweph, NodeFsLoader } from '@af/sweph-json';
import path from 'path';

const sweph = createJsonSweph({
  loader: new NodeFsLoader(path.join(process.cwd(), 'ephemeris_data')),
});

export async function GET(request: Request) {
  const planets = await sweph.calculatePlanets(new Date(), { ayanamsa: 1 });
  return Response.json(planets);
}
```

Copy your generated CSV files into `ephemeris_data/` at the project root. They will be included in the Vercel build output automatically.

### Native engine (Next.js)

The native engine requires careful Next.js configuration to survive Vercel's build pipeline. Read [docs/SERVERLESS_TROUBLESHOOTING.md](../SERVERLESS_TROUBLESHOOTING.md) for the four crash modes before proceeding.

Minimum required configuration:

```javascript
// next.config.mjs
const nextConfig = {
  experimental: {
    serverExternalPackages: ['@af/sweph'],
    outputFileTracingIncludes: {
      // Include sweph in routes that need it — use the exact route pattern
      '/api/kundali': ['./node_modules/@af/sweph/**'],
    },
    // Do NOT add @af/sweph to outputFileTracingExcludes['*']
  },
};

export default nextConfig;
```

In your API route, use a dynamic import with `turbopackIgnore` to prevent Turbopack from creating a hashed alias:

```typescript
// app/api/kundali/route.ts
export async function GET(request: Request) {
  const _m = '@af/sweph';
  const mod = await import(/* webpackIgnore: true */ /* turbopackIgnore: true */ _m as string);
  const sweph = await mod.createSweph({ serverlessMode: true });
  const planets = await sweph.calculatePlanets(new Date(), { ayanamsa: 1 });
  return Response.json(planets);
}
```

### Vercel environment variables

```bash
# In Vercel dashboard or vercel.json
NODE_VERSION=20
SWEPH_DISABLE_CACHE=false
```

### Deploy pipeline

If you use the AstroFusion prebuilt deploy script, the sequence is fixed (do not reorder):

```bash
vercel build
node scripts/build/prune-trace.cjs
node scripts/build/verify-sweph-trace.cjs
node scripts/build/patch-web-runtime-module-type.mjs
vercel deploy --prebuilt
```

---

## AWS Lambda

### JSON engine

```typescript
// lambda/handler.ts
import { createJsonSweph, NodeFsLoader } from '@af/sweph-json';
import path from 'path';

// Module-scope: initialized once per container
const sweph = createJsonSweph({
  loader: new NodeFsLoader(path.join(__dirname, 'ephemeris_data')),
});

export const handler = async (event: any) => {
  const planets = await sweph.calculatePlanets(new Date(), { ayanamsa: 1 });
  return {
    statusCode: 200,
    body: JSON.stringify(planets),
  };
};
```

Include the `ephemeris_data/` directory in your Lambda deployment package (ZIP or SAM template).

### Native engine

```typescript
// lambda/handler.ts
let swephInstance: Awaited<ReturnType<typeof import('@af/sweph').createSweph>> | null = null;

export const handler = async (event: any) => {
  // Reuse across warm invocations
  if (!swephInstance) {
    const { createSweph } = await import('@af/sweph');
    swephInstance = await createSweph({ serverlessMode: true });
  }

  const planets = await swephInstance.calculatePlanets(new Date(), { ayanamsa: 1 });
  return {
    statusCode: 200,
    body: JSON.stringify(planets),
  };
};
```

Requirements:
- Node.js runtime 18.x, 20.x, or 22.x
- Lambda architecture: x86_64 or arm64 (Graviton) — matching prebuild must exist
- Memory: 256MB minimum recommended (native binary + ephemeris data)

---

## Netlify Functions

### JSON engine

```typescript
// netlify/functions/planets.ts
import { createJsonSweph, NodeFsLoader } from '@af/sweph-json';
import path from 'path';

// Module-scope initialization
const sweph = createJsonSweph({
  loader: new NodeFsLoader(path.join(process.cwd(), 'ephemeris_data')),
});

export async function handler() {
  const planets = await sweph.calculatePlanets(new Date(), { ayanamsa: 1 });
  return {
    statusCode: 200,
    body: JSON.stringify(planets),
  };
}
```

### Native engine

```typescript
// netlify/functions/planets.ts
import { createSweph } from '@af/sweph';

let instance: Awaited<ReturnType<typeof createSweph>> | null = null;

export async function handler() {
  if (!instance) {
    instance = await createSweph({ serverlessMode: true, enableCaching: true });
  }

  const planets = await instance.calculatePlanets(new Date(), { ayanamsa: 1 });
  return {
    statusCode: 200,
    body: JSON.stringify(planets),
  };
}
```

---

## Cold-start strategies

### JSON-first, native on demand

The most effective pattern: serve all requests from the JSON engine (cold start <30ms), escalate to native only for explicit high-accuracy requests.

```typescript
import { createJsonSweph, NodeFsLoader } from '@af/sweph-json';
import path from 'path';

const jsonSweph = createJsonSweph({
  loader: new NodeFsLoader(path.join(process.cwd(), 'ephemeris_data')),
});

export async function POST(request: Request) {
  const { date, location, highAccuracy } = await request.json();
  const parsedDate = new Date(date);

  if (highAccuracy) {
    const _m = '@af/sweph';
    const mod = await import(/* webpackIgnore: true */ /* turbopackIgnore: true */ _m as string);
    const native = await mod.createSweph({ serverlessMode: true });
    const planets = await native.calculatePlanets(parsedDate, { ayanamsa: 1 });
    const lagna   = await native.calculateLagna(parsedDate, location, { ayanamsa: 1 });
    return Response.json({ planets, lagna, engine: 'native' });
  }

  const planets = await jsonSweph.calculatePlanets(parsedDate, { ayanamsa: 1 });
  const lagna   = await jsonSweph.calculateLagna(parsedDate, location, { ayanamsa: 1 });
  return Response.json({ planets, lagna, engine: 'json' });
}
```

### Module-scope singleton (reduce per-request initialization)

For native, always initialize at module scope to reuse across warm container invocations:

```typescript
// Initialize outside the handler — runs once per container lifetime
const swephPromise = (async () => {
  const { createSweph } = await import('@af/sweph');
  return createSweph({ serverlessMode: true, enableCaching: true });
})();

export async function GET() {
  const sweph = await swephPromise;
  const planets = await sweph.calculatePlanets(new Date());
  return Response.json(planets);
}
```

### Pre-warm

If your function has a predictable first request, use `preWarm: true` to run initial calculations at init time rather than on the first user request:

```typescript
const sweph = await createSweph({ preWarm: true, serverlessMode: true });
```

This trades slightly slower cold start for faster first-request latency.

---

## Environment variables

| Variable | Effect |
|---|---|
| `SWEPH_DISABLE_CACHE=true` | Disable in-memory caching (reduces memory in constrained environments) |
| `SWEPH_CACHE_MODULE=false` | Do not cache the native module handle |
| `NODE_VERSION=20` | Required on Vercel to select the right prebuild binary |
| `IS_BUILD_TIME=true` | Set during `vercel build` to prevent native module initialization during the build step |

---

## Function size limits

Vercel enforces a 250MB uncompressed limit per serverless function. The native engine adds approximately 50MB (binaries + ephemeris `.se1` files). Use route-specific `outputFileTracingExcludes` to keep non-astro routes slim — never add `@af/sweph` to the global `'*'` exclude key.

For detailed guidance on bundle size, pnpm symlink issues, and Turbopack hashed aliases, see [docs/SERVERLESS_TROUBLESHOOTING.md](../SERVERLESS_TROUBLESHOOTING.md).
