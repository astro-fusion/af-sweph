# Using @af/sweph with Next.js on Vercel

> Last updated: 2026-05-16
> Covers: Next.js 14/15/16 (App Router), pnpm workspaces, Turbopack, Vercel prebuilt deploys

This guide documents the complete set of issues we discovered deploying `@af/sweph` — a native
Node.js + WASM package — into Vercel's serverless Lambda environment, and the exact fixes that
made it work reliably. Everything here was learned the hard way through real production failures.

---

## Why this is hard — the full picture

Deploying a native C++ addon (or any package mixing `.node` prebuilds with complex sub-path
exports) into Vercel serverless involves **four independent failure modes**, each one silent
enough to pass your build but crash at runtime.

### Failure 1: pnpm symlinks are not deployed

pnpm stores every package at a content-addressable path in its virtual store:

```
node_modules/.pnpm/@af+sweph@{url-encoded-specifier}/node_modules/@af/sweph/
```

And creates a symlink at the canonical location:

```
node_modules/@af/sweph  →  node_modules/.pnpm/.../@af/sweph/
```

When Next.js traces your output files, it follows the symlink and records the **real store
path** in the NFT trace. That store path becomes the `filePathMap` value (disk source) in Vercel's
configuration, mapped to a relative key (Lambda destination). However, the Lambda destination path, so the file lands in your
Lambda at:

```
/var/task/node_modules/.pnpm/.../node_modules/@af/sweph/packages/node/dist/index.js
```

Your code does `require('@af/sweph')`. Node.js resolves that to
`/var/task/node_modules/@af/sweph/`. That symlink **does not exist in the Lambda** — Vercel
never deploys symlinks. Module not found.

**Fix:** After `vercel build`, post-process the `.vc-config.json` `filePathMap` to re-point
all pnpm store paths to the canonical `node_modules/@af/sweph/` destination.

### Failure 2: `outputFileTracingExcludes` silently overrides `outputFileTracingIncludes`

This is documented nowhere clearly in the Next.js docs. If `@af/sweph` appears in
`outputFileTracingExcludes` under ANY key — including the global `'*'` key — it is stripped
from EVERY function trace. `outputFileTracingIncludes` cannot override this. There is no
warning. The build succeeds, the deploy succeeds, and `kundali`/`panchanga` crash at runtime.

**Rule:** `@af/sweph`, `@af+sweph`, `swisseph`, and `node-gyp-build` must NEVER appear in
`outputFileTracingExcludes`.

Also note: in `outputFileTracingEXCLUDES`, use `**/` prefix. In `outputFileTracingINCludes`,
use `../../../` prefix (relative to the app directory). They are resolved differently.

### Failure 3: Turbopack hashed external aliases (Next.js 15+)

Next.js 15+ defaults to Turbopack for production builds. When `@af/sweph` is in
`serverExternalPackages`, Turbopack externalizes it using a deterministic 16-hex hash:

```javascript
// In compiled .next/server/chunks/ssr/*.js
require('@af/sweph-2d7ea1f7959600e6')  // Not '@af/sweph' — the hash alias
```

Turbopack creates a physical directory at:

```
.next/node_modules/@af/sweph-2d7ea1f7959600e6/
```

Next.js's output file tracer (NFT) records this as a **bare directory entry** in the `.nft.json`:

```json
{ "files": ["../node_modules/@af/sweph-2d7ea1f7959600e6"] }
```

Vercel's build step does **not expand bare directory entries** into individual file entries in
`filePathMap`. The entire hashed directory is never uploaded to the Lambda. At runtime:

```
Error: Cannot find module '@af/sweph-2d7ea1f7959600e6'
```

**Fix (Layer 1):** In `outputFileTracingIncludes`, force each file inside the hashed directory
to be individually traced:

```javascript
outputFileTracingIncludes: {
  '/**/*': [
    // Force individual file entries for the Turbopack-hashed shim directory.
    // Without this, NFT records a bare directory pointer which Vercel skips.
    '.next/node_modules/@af/sweph*/**/*',
  ],
},
```

**Fix (Layer 2 — belt and suspenders):** In a post-build script, inject the hashed package's
files as individual `filePathMap` entries in every `.vc-config.json`. Create a small `index.js`
shim that re-exports from the canonical `node_modules/@af/sweph`:

```javascript
// .vercel/_af_sweph_shim_{hash}/index.js
const path = require('path');
module.exports = require(path.resolve(__dirname, '../../../../../../..', 'node_modules/@af/sweph'));
```

### Failure 4: The ENOENT conflict between directory pointer and shim files

This is the most subtle failure. Even if you correctly inject shim files (Fix Layer 2 above),
you will still get an `ENOENT` from `vercel deploy --prebuilt` if the NFT bare directory
pointer was NOT pruned from the `filePathMap`.

The conflict looks like this:

```json
// filePathMap has BOTH:
"apps/web/app/.next/node_modules/@af/sweph-{hash}": "...",  // raw directory pointer (from NFT)
"/path/shim/index.js": "apps/web/app/.next/node_modules/@af/sweph-{hash}/index.js"  // our shim
```

When Vercel CLI builds the upload manifest, it calls `lstat` on every key. The directory key
resolves to a real directory, but then it tries to `lstat` `index.js` inside it — which is
NOT a real file in that directory (the directory was a Turbopack pointer-only stub). ENOENT.

**Fix:** When injecting shim file entries, also prune the raw directory pointer from the
`filePathMap`. The shim files must be the **only** entries for the hashed package — never both.

```javascript
// In your filePathMap post-processor:
const filteredMap = {};
for (const [destKey, srcValue] of Object.entries(filePathMap)) {
  // Skip bare hashed-sweph directory pointers — our shims handle these
  if (key.includes('sweph-') && /-[0-9a-f]{16}/.test(key) && !key.includes('.js')) {
    continue; // prune the raw directory entry
  }
  filteredMap[key] = value;
}
```

---

## Required Configuration (Correct)

### next.config.mjs

```javascript
const nextConfig = {
  // Mark as external to prevent webpack/Turbopack from bundling it
  serverExternalPackages: ['@af/sweph', 'node-gyp-build'],

  outputFileTracingIncludes: {
    '/**/*': [
      // Include the package itself (follows pnpm symlink during tracing)
      '../../../node_modules/@af/sweph/**/*',
      // Also include the pnpm store path directly (symlinks are not deployed)
      '**/node_modules/.pnpm/@af+sweph@*/**/*',
      // node-gyp-build is needed to load prebuilds at runtime
      '**/node_modules/node-gyp-build/**/*',
      // CRITICAL for Turbopack: force individual file entries for hashed shim directory.
      // Without this, NFT records a bare directory pointer which Vercel never expands.
      '.next/node_modules/@af/sweph*/**/*',
    ],
  },

  // NEVER put @af/sweph here — excludes silently override includes, no warnings
  // outputFileTracingExcludes: { ... }  // @af/sweph must NOT appear here
};
```

### pnpm Monorepo: Vercel Deploy Post-Processor

For pnpm monorepos using prebuilt Vercel deploys, you need a post-build script to fix the
filePathMaps. The core logic is:

```javascript
// 1. Re-map pnpm store paths to canonical node_modules/@af/sweph/ destinations
for (const [destKey, srcValue] of Object.entries(filePathMap)) {
  if (srcValue.includes('.pnpm') && srcValue.includes('sweph')) {
    const relPath = srcValue.split('@af/sweph/')[1] || srcValue.split('@af+sweph')[1];
    const canonicalDest = `node_modules/@af/sweph/${relPath}`;
    filePathMap[canonicalDest] = srcValue;
    delete filePathMap[destKey];
  }
}

// 2. Prune hashed Turbopack directory pointers (bare dirs, no file extension)
for (const key of Object.keys(filePathMap)) {
  if (key.includes('sweph-') && /-[0-9a-f]{16}/.test(key) && !key.match(/\.\w+$/)) {
    delete filePathMap[key];
  }
}

// 3. Inject shim files for the hashed alias
// Create a shim index.js that re-exports from the canonical package
// and add it to filePathMap with dest = apps/web/app/.next/node_modules/@af/sweph-{hash}/index.js
```

---

## Verification

After your build + post-processing, verify before deploying:

```bash
# 1. Check that @af/sweph files land at the canonical Lambda path (not pnpm store path)
cat .vercel/output/functions/\[locale\]/kundali.func/.vc-config.json \
  | python3 -c "import json,sys; d=json.load(sys.stdin)['filePathMap']; \
    [print(v) for v in d.values() if 'sweph' in v and 'pnpm' not in v]"
# Expected: lines like node_modules/@af/sweph/packages/node/dist/index.js

# 2. Check that NO pnpm store paths remain as sweph destinations
cat .vercel/output/functions/\[locale\]/kundali.func/.vc-config.json \
  | python3 -c "import json,sys; d=json.load(sys.stdin)['filePathMap']; \
    pnpm=[v for v in d.values() if '.pnpm' in v and 'sweph' in v]; \
    print('FAIL: pnpm store paths present' if pnpm else 'PASS: no pnpm store paths')"

# 3. Check that the shim files exist on disk (not just in filePathMap)
ls .vercel/_af_sweph_shim_*/index.js

# 4. Check that no bare hashed-sweph directory pointers remain in filePathMap
cat .vercel/output/functions/\[locale\]/kundali.func/.vc-config.json \
  | python3 -c "import json,sys,re; d=json.load(sys.stdin)['filePathMap']; \
    dirs=[k for k in d.keys() if 'sweph-' in k and re.search(r'-[0-9a-f]{16}$', k)]; \
    print('FAIL: bare dir entries present:', dirs if dirs else 'PASS')"
```

---

## Common Errors and Their Root Causes

| Error | Root Cause | Fix |
|-------|-----------|-----|
| `Cannot find package '@af/sweph'` at runtime | pnpm symlink not deployed; file landed at pnpm store path, not `node_modules/@af/sweph/` | Re-map filePathMap keys to canonical dest paths |
| `Cannot find module '@af/sweph-{hash}'` | Turbopack hashed alias; shim directory never uploaded (bare dir pointer) | Add `.next/node_modules/@af/sweph*/**/*` to `outputFileTracingIncludes` + inject shim |
| `ENOENT: lstat .../sweph-{hash}/index.js` | Conflicting entries: both the raw directory pointer AND the shim in filePathMap | Prune the raw directory pointer when injecting shims |
| `@af/sweph` missing after `vercel build` but was there before | It was added to `outputFileTracingExcludes['*']` (silently strips everything) | Remove from excludes entirely — never add it there |
| Module works in dev but crashes in prod | `sweph-` in excludes only in production build config, or pnpm symlink followed during dev but not in Lambda | Use the same `serverExternalPackages` + `outputFileTracingIncludes` in all environments |
| `Error: The module was compiled against a different Node.js version` | Binary is darwin/win32 build, not linux-x64 | Ensure only linux-x64 prebuilds are included in the function trace |

---

## How the Hashing Works (Turbopack Internals)

The hash (`2d7ea1f7959600e6`) is derived from the package specifier in the pnpm lockfile. It
is deterministic and changes only when `@af/sweph` is upgraded or the lockfile is regenerated.
Your code never sees this hash — you still write `import { ... } from '@af/sweph'`. Turbopack
rewrites the compiled output internally after tracing.

The hash can be discovered by inspecting the compiled server chunks:

```bash
grep -r "sweph-[0-9a-f]\{16\}" .next/server/chunks/ | head -n 1
# Output: ...require('@af/sweph-2d7ea1f7959600e6')...
```

Or by listing the hashed directory:

```bash
ls .next/node_modules/ | grep sweph
# Output: @af/sweph-2d7ea1f7959600e6
```

---

## Summary: The Four Rules

1. Put `@af/sweph` in `serverExternalPackages`. Never bundle it.
2. Add `.next/node_modules/@af/sweph*/**/*` to `outputFileTracingIncludes`. Never put it in `outputFileTracingExcludes`.
3. Post-process `.vc-config.json` filePathMaps to re-map pnpm store dest paths to canonical `node_modules/@af/sweph/`.
4. When injecting Turbopack shims for the hashed alias, prune the raw directory pointer. Shims and directory pointers must never coexist for the same package.

Following all four rules produces a clean, repeatable Vercel deployment.
