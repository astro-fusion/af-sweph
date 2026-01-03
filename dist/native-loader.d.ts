/**
 * Load the Swiss Ephemeris native module from pre-built binaries
 * Falls back to swisseph-v2 if prebuilds are not available
 *
 * @returns Swiss Ephemeris native module instance
 * @throws Error if no compatible native module can be loaded
 */
export declare function loadNativeBinary(): any;
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