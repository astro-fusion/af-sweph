/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Native Binary Loader for @af/sweph
 * Loads platform-specific pre-built Swiss Ephemeris binaries
 * 
 * This module handles loading the correct native binary for the current platform,
 * enabling Vercel serverless deployment without native compilation.
 * 
 * IMPORTANT: All require() calls use dynamic loading to prevent webpack from
 * bundling native binaries at build time.
 */
import path from 'path';
import { platform, arch } from 'os';

// Cached native module instance
let nativeModule: any = null;
let loading = false;
let loadPromise: Promise<any> | null = null;

// Serverless environment detection
const isServerless = (): boolean => {
  return !!(
    process.env.VERCEL ||
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
    process.env.FUNCTION_NAME ||
    process.env.K_SERVICE ||
    process.env.NETLIFY
  );
};

// Memory optimization for serverless: limit module caching in high-concurrency environments
const shouldCacheModule = (): boolean => {
  // In serverless environments, prefer fresh instances to avoid memory leaks
  if (isServerless()) {
    return process.env.SWEPH_CACHE_MODULE === 'true';
  }
  return true;
};

/**
 * Dynamic require that webpack cannot detect at build time
 * Uses module.createRequire for ESM compatibility
 */
const dynamicRequire = (moduleName: string): any => {
  // Use createRequire for ESM compatibility (Node.js 12+)
  // This is wrapped in a try-catch to handle different module systems
  try {
    const { createRequire } = require('module');
    const customRequire = createRequire(__filename);
    return customRequire(moduleName);
  } catch {
    // Fallback: try direct require (CommonJS)
    return require(moduleName);
  }
};

/**
 * Supported platform configurations
 */
const SUPPORTED_PLATFORMS = [
  'linux-x64',     // Vercel, AWS Lambda, most Linux servers
  'linux-arm64',   // AWS Lambda Graviton, some Linux servers
  'darwin-arm64',  // macOS M1/M2/M3
  'darwin-x64',    // macOS Intel
  'win32-x64',     // Windows x64
  'win32-arm64',   // Windows ARM64
] as const;

type SupportedPlatform = typeof SUPPORTED_PLATFORMS[number];

/**
 * Get the platform key for the current system
 */
function getPlatformKey(): string {
  return `${platform()}-${arch()}`;
}

/**
 * Check if the current platform is supported
 */
function isSupportedPlatform(key: string): key is SupportedPlatform {
  return SUPPORTED_PLATFORMS.includes(key as SupportedPlatform);
}

/**
 * Get paths to search for pre-built binaries
 */
function getPrebuildPaths(platformKey: string): string[] {
  const paths: string[] = [];

  // Standard prebuild location (works from dist/ and src/)
  paths.push(path.resolve(__dirname, '..', 'prebuilds', platformKey, 'swisseph.node'));

  // Alternative: node_modules location for installed packages
  paths.push(path.resolve(process.cwd(), 'node_modules', '@af', 'sweph', 'prebuilds', platformKey, 'swisseph.node'));

  return paths;
}

/**
 * Try to load a native binary from the given path using dynamic require
 */
function tryLoadBinary(binaryPath: string): any | null {
  try {
    return dynamicRequire(binaryPath);
  } catch {
    return null;
  }
}

/**
 * Load the Swiss Ephemeris native module from pre-built binaries
 * Falls back to swisseph-v2 if prebuilds are not available
 *
 * Uses dynamic requires to prevent webpack bundling of native modules.
 * Optimized for serverless environments with intelligent caching.
 *
 * @returns Promise resolving to Swiss Ephemeris native module instance
 * @throws Error if no compatible native module can be loaded
 */
export async function loadNativeBinary(_options?: any): Promise<any> {
  // Return cached module if already loaded and caching is enabled
  if (nativeModule && shouldCacheModule()) {
    return nativeModule;
  }

  // If already loading, wait for the existing promise
  if (loading && loadPromise) {
    return loadPromise;
  }

  loading = true;
  loadPromise = (async () => {
    const platformKey = getPlatformKey();
    const errors: string[] = [];

    // 1. Try loading from prebuilds (primary method for Vercel)
    const prebuildPaths = getPrebuildPaths(platformKey);
    for (const binaryPath of prebuildPaths) {
      const module = tryLoadBinary(binaryPath);
      if (module) {
        // Cache module only if caching is enabled
        if (shouldCacheModule()) {
          nativeModule = module;
        }
        loading = false;
        return module;
      }
    }
    errors.push(`No prebuild found for ${platformKey}`);

    // 2. Try node-gyp-build (for dynamically built binaries in development)
    try {
      const gypBuild = dynamicRequire('node-gyp-build');
      const module = gypBuild(path.resolve(__dirname, '..'));
      if (module) {
        nativeModule = module;
        loading = false;
        return nativeModule;
      }
    } catch (e: any) {
      errors.push(`node-gyp-build failed: ${e.message || e}`);
    }

    // 3. Fallback to swisseph-v2 (optional dependency, development only)
    try {
      const swissephV2 = dynamicRequire('swisseph-v2');
      nativeModule = swissephV2.default || swissephV2;
      loading = false;
      return nativeModule;
    } catch (e: any) {
      errors.push(`swisseph-v2 fallback failed: ${e.message || e}`);
    }

    // 4. All loading attempts failed
    loading = false;
    const supportedList = SUPPORTED_PLATFORMS.join(', ');
    const errorDetails = errors.join('; ');

    const serverlessHint = isServerless()
      ? ' For serverless platforms (Vercel, AWS Lambda, etc.), ensure prebuilds are included in your deployment package.'
      : '';

    throw new Error(
      `Failed to load Swiss Ephemeris native module for platform '${platformKey}'. ` +
      `Supported platforms: ${supportedList}. ` +
      `Details: ${errorDetails}.${serverlessHint}` +
      ` Try setting SWEPH_CACHE_MODULE=false if you encounter memory issues in serverless environments.`
    );
  })();

  return loadPromise;
}

/**
 * Synchronous version for backward compatibility
 * Will throw if module hasn't been loaded yet via async loadNativeBinary
 */
export function getNativeModuleSync(): any {
  if (!nativeModule) {
    throw new Error(
      'Swiss Ephemeris module not initialized. ' +
      'Call await initializeSweph() before using calculation functions.'
    );
  }
  return nativeModule;
}

/**
 * Get information about the current platform
 * Useful for debugging deployment issues
 */
export function getPlatformInfo(): {
  platform: string;
  arch: string;
  key: string;
  isSupported: boolean;
  prebuildPaths: string[];
} {
  const key = getPlatformKey();
  return {
    platform: platform(),
    arch: arch(),
    key,
    isSupported: isSupportedPlatform(key),
    prebuildPaths: getPrebuildPaths(key),
  };
}

/**
 * Check if prebuilds are available for the current platform
 */
export function hasPrebuilds(): boolean {
  const platformKey = getPlatformKey();
  const prebuildPaths = getPrebuildPaths(platformKey);

  for (const binaryPath of prebuildPaths) {
    try {
      // Use dynamic require.resolve
      const resolveFn = new Function('moduleName', 'return require.resolve(moduleName)');
      resolveFn(binaryPath);
      return true;
    } catch {
      continue;
    }
  }

  return false;
}

/**
 * Get the list of supported platforms
 */
export function getSupportedPlatforms(): readonly string[] {
  return SUPPORTED_PLATFORMS;
}
