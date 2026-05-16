# Serverless Troubleshooting Guide

How to use `@af/sweph` in Node.js serverless environments (Vercel, AWS Lambda, etc.).

This document captures every crash mode we discovered during production deployments on Vercel/Lambda in 2025–2026. Read this before debugging a runtime crash.

---

## Table of contents

1. [Quick decision tree](#1-quick-decision-tree)
2. [Crash mode A — pnpm symlink path problem](#2-crash-mode-a--pnpm-symlink-path-problem)
3. [Crash mode B — Turbopack hashed alias](#3-crash-mode-b--turbopack-hashed-alias)
4. [Crash mode C — module-load-time static import](#4-crash-mode-c--module-load-time-static-import)
5. [Crash mode D — outputFileTracingExcludes override](#5-crash-mode-d--outputfiletracingexcludes-override)
6. [How to use `turbopackIgnore` and the variable trick](#6-how-to-use-turbopackignore-and-the-variable-trick)
7. [Vercel-specific fixes — prune-trace injection](#7-vercel-specific-fixes--prune-trace-injection)
8. [Zero-native alternative: `@af/sweph-json`](#8-zero-native-alternative-afsweph-json)
9. [Cold start optimisation checklist](#9-cold-start-optimisation-checklist)

---

## 1. Quick decision tree

```
Runtime crash on Vercel/Lambda?
│
├── Error contains "Cannot find package '@af/sweph'" 
│   └── → Crash mode A or D (see §2, §5)
│
├── Error contains "Cannot find module '@af/sweph-[a-f0-9]{16}'"
│   └── → Crash mode B (see §3)
│
├── Error thrown before any try-catch in your handler runs
│   └── → Crash mode C (see §4)
│
└── Page works locally but crashes on Vercel
    └── → Check all four crash modes — they are not mutually exclusive
```

---

## 2. Crash mode A — pnpm symlink path problem

### Symptom

```
Error: Cannot find package '@af/sweph' imported from /var/task/.next/server/...
```

The deploy succeeds. The build log shows sweph files included. But every request crashes.

### Root cause

`outputFileTracingIncludes` follows pnpm symlinks:

```
node_modules/@af/sweph → .pnpm/@af+sweph@0.3.0/node_modules/@af/sweph  (symlink)
```

Next.js NFT (Node File Trace) follows the symlink and records the **real store path**:

```
.vercel/output/functions/.../filePathMap = {
  "/var/task/node_modules/.pnpm/@af+sweph@0.3.0/...": "...",
  //                   ^^^^^ pnpm store path
}
```

The Lambda receives files at `.pnpm/@af+sweph@.../`, but `require('@af/sweph')` looks for `node_modules/@af/sweph/`. The symlink is **not created** in the Lambda. The require fails.

### Fix

In `next.config.mjs`, use `outputFileTracingIncludes` to include the pnpm store path, then in your deploy script inject the files at the correct root path:

```javascript
// next.config.mjs
const config = {
  experimental: {
    outputFileTracingIncludes: {
      '/**/kundali/**': ['./node_modules/@af/sweph/**'],
    },
    // Do NOT add @af/sweph to outputFileTracingExcludes
  },
};
```

Then in your deployment script (after `next build`):

```javascript
// prune-trace.cjs (simplified version of the fix)
function injectSwephAtRootNodeModules(filePathMap) {
  // Find all @af/sweph files recorded at the pnpm store path
  const swephFiles = Object.entries(filePathMap)
    .filter(([_src, dest]) => dest.includes('@af+sweph'));

  for (const [src, _dest] of swephFiles) {
    // Determine the path within the package
    const match = src.match(/@af\+sweph[^/]*\/node_modules\/@af\/sweph\/(.*)/);
    if (!match) continue;
    const relativePath = match[1];
    // Re-add at the canonical path the Lambda expects
    filePathMap[src] = `node_modules/@af/sweph/${relativePath}`;
  }
}
```

### Verification

After running your deploy script, inspect the `.vc-config.json` for any route that uses sweph:

```bash
cat .vercel/output/functions/api/kundali.func/.vc-config.json | \
  python3 -c "import json,sys; d=json.load(sys.stdin); print([v for v in d.get('filePathMap',{}).values() if 'sweph' in v][:5])"
```

**Look at `dest` values (right side of the map).** You must see entries like:

```
node_modules/@af/sweph/index.js       ✅ correct
node_modules/.pnpm/@af+sweph@.../...  ❌ wrong (will crash at runtime)
```

---

## 3. Crash mode B — Turbopack hashed alias

### Symptom

```
Error: Cannot find module '@af/sweph-a2d961ef910dcafa'
    at Function.Module._resolveFilename (node:internal/modules/cjs/loader:1039:15)
```

### Root cause

Next.js 16+ uses Turbopack for `next build` by default. When `@af/sweph` appears in `serverExternalPackages`, Turbopack externalises it with a content-hash-based alias:

```javascript
// Turbopack output (compiled .next/server/... file)
const _sweph = require('@af/sweph-a2d961ef910dcafa');
//                                ^^^^^^^^^^^^^^^^
//                    16-hex content hash — changes on every npm version bump
```

Turbopack creates a directory `.next/node_modules/@af/sweph-{hash}/` but NFT records it as a **bare directory entry** (no individual files) — the Vercel build system skips it. The Lambda receives no such package.

### Fix

**Option 1 (preferred): Use dynamic import with `turbopackIgnore`**

The `/* turbopackIgnore: true */` comment prevents Turbopack from creating the hashed alias. Combine with a string variable to prevent static analysis:

```typescript
// ❌ WRONG — Turbopack rewrites this to require('@af/sweph-{hash}')
import { createSwephAdapter } from '@af/sweph/node';

// ✅ CORRECT — Turbopack ignores this dynamic import
async function loadSweph() {
  const _m = '@af/sweph/node';
  return await import(/* webpackIgnore: true */ /* turbopackIgnore: true */ _m as string);
}
```

The variable trick (`const _m = '...'`) is required because if you inline the string, some bundler versions still statically analyse the import even with the comment.

**Option 2: Inject a redirect shim in the deploy script**

If you cannot change the import (e.g., third-party code), inject a shim package after `next build`:

```javascript
// In prune-trace.cjs
function injectTurbopackHashedShim(outputDir, swephHash) {
  const shimDir = path.join(outputDir, 'node_modules', `@af/sweph-${swephHash}`);
  fs.mkdirSync(shimDir, { recursive: true });
  
  // package.json redirect
  fs.writeFileSync(path.join(shimDir, 'package.json'), JSON.stringify({
    name: `@af/sweph-${swephHash}`,
    version: '0.0.1',
    main: 'index.js',
  }));
  
  // Redirect to the real package
  fs.writeFileSync(path.join(shimDir, 'index.js'),
    `module.exports = require('@af/sweph');\n`
  );
}
```

To find the hash for the current build:

```bash
find .next -name 'package.json' -path '*/node_modules/@af/sweph-*' | head -1
# → .next/node_modules/@af/sweph-a2d961ef910dcafa/package.json
```

### Why not add to `serverExternalPackages`?

Adding to `serverExternalPackages` is what causes Turbopack to create the hashed alias in the first place. The solution is to use dynamic imports with `turbopackIgnore` — not to remove from `serverExternalPackages` (which would cause Turbopack to attempt to bundle the native `.node` binary).

---

## 4. Crash mode C — module-load-time static import

### Symptom

The function crashes immediately with a module error, before your try-catch runs.

```
Error: Cannot find package '@af/sweph'
    at Object.<anonymous> (/var/task/.next/server/chunks/123.js:1:...)
```

And your error handler never fires.

### Root cause

Static top-level imports are evaluated at **module load time**, before any function code runs:

```typescript
// ❌ This import runs when the module is first loaded — before any try-catch
import { calculateLagna } from '@af/sweph/node';

export async function handler(req) {
  try {
    const result = await calculateLagna(/*...*/);
  } catch (e) {
    // This NEVER runs if the import above fails
    return fallback();
  }
}
```

If `@af/sweph` is not resolvable (crash modes A or B), the module fails to load entirely. The Lambda returns a 500 with a module-not-found error. Your fallback never executes.

### Fix

Convert to a lazy dynamic import:

```typescript
// ✅ Only imported when the function is called — try-catch can catch load failures
async function getLagna(date, location, ayanamsa) {
  try {
    const _m = '@af/sweph/node';
    const sweph = await import(/* webpackIgnore: true */ /* turbopackIgnore: true */ _m as string);
    return await sweph.calculateLagna(date, location, { ayanamsa });
  } catch (e) {
    // Fallback to JSON engine or cached data
    return jsonEngine.calculateLagna(date, location, { ayanamsa });
  }
}
```

`import type` is safe — type imports are erased at build time and never appear in emitted JS.

---

## 5. Crash mode D — outputFileTracingExcludes override

### Symptom

`@af/sweph` files disappear from a function that previously had them. The deploy log shows "includes" working, but runtime crashes.

### Root cause

`outputFileTracingExcludes` **always wins** over `outputFileTracingIncludes`. There is no priority flag.

```javascript
// ❌ The exclude on '*' removes sweph from ALL routes
const config = {
  experimental: {
    outputFileTracingIncludes: {
      '/api/kundali': ['./node_modules/@af/sweph/**'], // ← included for /api/kundali
    },
    outputFileTracingExcludes: {
      '*': ['./node_modules/@af/sweph/**'], // ← WINS — removes from everything
    },
  },
};
```

This is a Next.js invariant, not a bug. Excludes are applied after includes.

### Fix

Use route-specific excludes. Never add `@af/sweph` to the global `'*'` exclude key:

```javascript
// ✅ Exclude sweph only from routes that don't need it
const config = {
  experimental: {
    outputFileTracingIncludes: {
      '/api/kundali': ['./node_modules/@af/sweph/**'],
    },
    outputFileTracingExcludes: {
      '/api/blog/**': ['./node_modules/@af/sweph/**'],  // exclude from blog
      '/api/auth/**': ['./node_modules/@af/sweph/**'],  // exclude from auth
      // ← NOT '*' — that would exclude from everything including kundali
    },
  },
};
```

---

## 6. How to use `turbopackIgnore` and the variable trick

Both comments are required to reliably prevent static analysis:

```typescript
// Pattern 1: variable + both comments (most reliable)
const _m = '@af/sweph/node';
const mod = await import(/* webpackIgnore: true */ /* turbopackIgnore: true */ _m as string);

// Pattern 2: inline string with both comments (works in most cases)
const mod = await import(/* webpackIgnore: true */ /* turbopackIgnore: true */ '@af/sweph/node');
```

Use unique variable names if you have multiple imports in the same scope:

```typescript
const _swephMod1 = '@af/sweph/node';
const sunResult = await import(/* webpackIgnore: true */ /* turbopackIgnore: true */ _swephMod1 as string);

const _swephMod2 = '@af/sweph/node';
const moonResult = await import(/* webpackIgnore: true */ /* turbopackIgnore: true */ _swephMod2 as string);
```

(The bundler may share the same variable if you reuse a name, re-analyzing it statically.)

**Do not use for `import type`** — type imports are erased at build time and never cause runtime issues.

---

## 7. Vercel-specific fixes — prune-trace injection

The `scripts/build/prune-trace.cjs` script in your project runs after `next build` and injects two fixes:

### `injectSwephAtRootNodeModules()`

Reads sweph files recorded at the pnpm store path and re-adds them at `node_modules/@af/sweph/`. This fixes crash mode A.

```bash
# How to verify it ran correctly:
node scripts/build/verify-sweph-trace.cjs
```

The verify script checks DEST paths (the right side of `filePathMap`), not source paths. A pnpm source path looks valid — only the dest path reveals whether the Lambda will see `node_modules/@af/sweph/` or `.pnpm/@af+sweph@.../`.

### `injectTurbopackHashedShim()`

Finds the Turbopack-generated hashed directory and injects a two-file redirect shim. This fixes crash mode B.

### Deployment sequence (do not reorder)

```bash
vercel build                          # 1. Generate .next/ and .vercel/output/
node scripts/build/prune-trace.cjs    # 2. Fix pnpm paths + inject shim
node scripts/build/verify-sweph-trace.cjs  # 3. Gate: abort if sweph missing
node scripts/build/patch-web-runtime-module-type.mjs  # 4. CJS/ESM markers
vercel deploy --prebuilt              # 5. Upload cleaned output
```

---

## 8. Zero-native alternative: `@af/sweph-json`

If native `@af/sweph` continues to cause deployment issues, `@af/sweph-json` provides
a pure-JS alternative that works in any serverless environment without any of the above
crash modes.

```typescript
import { createJsonSweph, NodeFsLoader } from '@af/sweph-json';

const sweph = createJsonSweph({
  loader: new NodeFsLoader('/var/task/ephemeris_data'),
});

// Same API as @af/sweph v2
const planets = await sweph.calculatePlanets(new Date(), { ayanamsa: 1 });
const lagna = await sweph.calculateLagna(new Date(), { latitude: 28.6, longitude: 77.2 });
```

See [`packages/json/README.md`](../packages/json/README.md) for full documentation.

**Accuracy trade-offs:**

| Feature | `@af/sweph` (native) | `@af/sweph-json` |
|---|---|---|
| Planet positions | Sub-arcsecond | ±0.01–0.5° |
| Lagna | Sub-arcsecond | ~0.3–0.5° |
| Cold start | +200–500ms | +5–30ms |
| Lambda memory | +50MB | +2MB |
| Deployment risk | High (native binary) | None |

Recommended strategy: use `@af/sweph-json` as primary, escalate to native for high-accuracy
requests (individual chart printing, professional reports).

---

## 9. Cold start optimisation checklist

- [ ] All `@af/sweph` imports are dynamic with `/* turbopackIgnore: true */`
- [ ] `@af/sweph` is NOT in `outputFileTracingExcludes['*']`
- [ ] `prune-trace.cjs` runs after every `next build`
- [ ] `verify-sweph-trace.cjs` PASSES before `vercel deploy --prebuilt`
- [ ] Verify script checks DEST paths not source paths
- [ ] Consider `@af/sweph-json` as primary for warm path, native only for accuracy-critical flows
- [ ] Confirm Lambda memory limit allows for sweph (~50MB overhead)
- [ ] `IS_BUILD_TIME=true` env var set during `vercel build` so mock calculators fire (prevents hang)
