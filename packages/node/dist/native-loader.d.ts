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
export declare function loadNativeBinary(_options?: any): Promise<any>;
/**
 * Synchronous version for backward compatibility
 * Will throw if module hasn't been loaded yet via async loadNativeBinary
 */
export declare function getNativeModuleSync(): any;
/**
 * Get information about the current platform
 * Useful for debugging deployment issues
 */
export declare function getPlatformInfo(): {
    platform: string;
    arch: string;
    key: string;
    isSupported: boolean;
    prebuildPaths: string[];
};
/**
 * Check if prebuilds are available for the current platform
 */
export declare function hasPrebuilds(): boolean;
/**
 * Get the list of supported platforms
 */
export declare function getSupportedPlatforms(): readonly string[];
//# sourceMappingURL=native-loader.d.ts.map