# Using @af/sweph with Next.js on Vercel

This guide explains how to correctly configure @af/sweph for deployment on Vercel's serverless platform.

## The Challenge

Vercel's serverless functions have specific requirements for native Node.js modules:

1. **Native binaries must be included in the bundle** - Next.js output file tracing must explicitly include the `.node` prebuilds
2. **Symlinks don't work** - pnpm's symlinked node_modules may not be traced correctly
3. **Platform-specific binaries** - The `linux-x64` prebuild must be available at runtime
4. **Size Limits** - Vercel functions have a 250MB (unzipped) limit. Including too many binaries can crash the deployment.

## 🧠 Technical Deep Dive: Why is this so hard?

Deploying native modules (C++ ad dons) to Serverless is notoriously difficult. Here is why:

### 1. The ABI Nightmare (Node.js Version Mismatch)
Native modules are compiled against a specific Node.js **ABI (Application Binary Interface)**.
- If you build locally on Node 22, the binary expects Node 22 ABI.
- If Vercel runs on Node 20, the binary **will crash** with `Error: The module was compiled against a different Node.js version`.
- **Solution:** We explicitly ship prebuilt binaries for multiple Node versions and platforms (`linux-x64`, `darwin-arm64`) and load the correct one at runtime.

### 2. The "GLIBC" Trap
Linux isn't just "Linux".
- Local Linux (Ubuntu/Debian) might have a newer `glibc`.
- Vercel/AWS Lambda often run on Amazon Linux 2, which has an older `glibc`.
- **Result:** `Error: /lib64/libc.so.6: version 'GLIBC_2.28' not found`.
- **Solution:** Our prebuilds are compiled in a Docker container that mimics the Vercel execution environment.

### 3. "Sloppy Code" Pitfalls
Common patterns that break in Serverless:
- ❌ **Relative Paths:** `path.join(__dirname, './bin')` often points to the wrong place because files are moved during bundling.
- ❌ **Assuming Persistence:** Saving a file to disk? It's gone on the next request.
- ❌ **Lazy Error Handling:** Swallowing "Module Not Found" errors leads to "silent failures" where the app works but returns wrong data (or purely mathematical approximations).

### 4. The 250MB Limit
Vercel enforces a strict 250MB unzipped limit per function.
- **The Problem:** Including ALL prebuilds (Windows, Mac, Linux x Node 18, 20, 22) exceeds 250MB.
- **The Fix:** We use "Tiered Loading":
    1.  **Prefer WASM:** (Coming soon) Light, consistent, safe.
    2.  **Specific Prebuilds:** Only bundle `linux-x64` for production.

---

## Required Configuration

### 1. next.config.js

Add the prebuilds to `outputFileTracingIncludes`:

```javascript
// next.config.js
const path = require('path');

/** @type {import('next').NextConfig} */
const config = {
  // Enable standalone output for Vercel
  output: 'standalone',
  
  // Set tracing root for monorepos
  outputFileTracingRoot: path.join(__dirname, '../../'),
  
  // Mark native modules as external (prevents webpack bundling)
  serverExternalPackages: [
    '@af/sweph',
    'node-gyp-build',
  ],
  
  // CRITICAL: Include prebuilds in the serverless bundle
  outputFileTracingIncludes: {
    '/**/*': [
      // Standard location
      '../../node_modules/@af/sweph/packages/node/prebuilds/**/*',
      // pnpm store location (for pnpm users)
      '../../node_modules/.pnpm/**/node_modules/@af/sweph/packages/node/prebuilds/**/*',
      // node-gyp-build helper
      '../../node_modules/node-gyp-build/**/*',
    ],
  },
  
  // Transpile the core package for SSR
  transpilePackages: [
    '@af/sweph-core',
  ],
};

module.exports = config;
```

### 2. For pnpm Monorepos (Recommended)

pnpm stores packages in a content-addressable store with symlinks. To ensure reliable tracing, copy prebuilds to your app directory:

```javascript
// scripts/setup-prebuilds.js
const fs = require('fs');
const path = require('path');

function copyPrebuildsToApp() {
  const rootDir = path.resolve(__dirname, '..');
  const nodeModules = path.join(rootDir, 'node_modules');
  
  // Find prebuilds in @af/sweph
  const source = path.join(nodeModules, '@af/sweph/packages/node/prebuilds');
  const target = path.join(rootDir, 'lib/sweph-prebuilds');
  
  if (fs.existsSync(source)) {
    fs.cpSync(source, target, { recursive: true });
    console.log('✅ Copied SWEPH prebuilds to', target);
  }
}

copyPrebuildsToApp();
```

Add to package.json:
```json
{
  "scripts": {
    "postinstall": "node scripts/setup-prebuilds.js",
    "prebuild": "node scripts/setup-prebuilds.js"
  }
}
```

Then update next.config.js to include the local copy:
```javascript
outputFileTracingIncludes: {
  '/**/*': [
    './lib/sweph-prebuilds/**/*',  // Local copy - most reliable
    // ... other paths
  ],
},
```

### 3. Verifying the Fix

After building, check that prebuilds are included:

```bash
pnpm build

# Verify prebuilds in standalone output
find .next/standalone -name "swisseph.node" -type f
```

Expected output:
```
.next/standalone/node_modules/@af/sweph/packages/node/prebuilds/linux-x64/swisseph.node
```

## Common Errors

### Error: "No prebuild found for linux-x64"

**Cause:** Next.js didn't include the native binary in the serverless bundle.

**Solution:**
1. Ensure `outputFileTracingIncludes` is correctly configured
2. For pnpm: copy prebuilds to a local directory as shown above
3. Rebuild and verify the binary is in `.next/standalone`

### Error: "Swiss Ephemeris module not initialized"

**Cause:** `initializeSweph()` wasn't called before using calculation functions.

**Solution:**
```typescript
import { initializeSweph, calculatePlanets } from '@af/sweph';

async function calculate() {
  await initializeSweph();  // Call ONCE at startup
  const planets = await calculatePlanets(date, location);
}
```

## Environment Variables

For serverless environments with memory constraints:

```bash
# Disable module caching to reduce memory usage
SWEPH_CACHE_MODULE=false
```

## Platform Support

| Platform | Status | Notes |
|----------|--------|-------|
| `linux-x64` | ✅ Supported | Vercel, AWS Lambda |
| `linux-arm64` | ✅ Supported | AWS Graviton |
| `darwin-arm64` | ✅ Supported | macOS M1/M2/M3 |
| `darwin-x64` | ✅ Supported | macOS Intel |
| `win32-x64` | ✅ Supported | Windows |

## Troubleshooting

1. **Check prebuilds exist in node_modules:**
   ```bash
   ls -la node_modules/@af/sweph/packages/node/prebuilds/linux-x64/
   ```

2. **Check build includes prebuilds:**
   ```bash
   find .next/standalone -name "*.node" | grep swisseph
   ```

3. **Enable verbose logging:**
   ```bash
   BUILD_LOG_LEVEL=debug pnpm build
   ```
