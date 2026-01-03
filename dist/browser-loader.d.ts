/**
 * Browser/WASM Loader for @af/sweph
 *
 * This module is COMPLETELY INDEPENDENT from native-loader.ts.
 * It handles loading the WebAssembly module for browser environments.
 *
 * The package.json "browser" field aliases native-loader to this file
 * when bundling for browser targets.
 */
/**
 * Load and initialize the WASM module
 * This is the browser equivalent of loadNativeBinary from native-loader.ts
 */
export declare function loadNativeBinary(options?: {
    wasmUrl?: string;
}): Promise<any>;
/**
 * Get native module instance (throws if not loaded)
 * Browser equivalent of getNativeModuleSync
 */
export declare function getNativeModuleSync(): any;
/**
 * Platform info for browser (always returns browser info)
 */
export declare function getPlatformInfo(): {
    platform: string;
    arch: string;
    key: string;
    isSupported: boolean;
    prebuildPaths: string[];
};
/**
 * Check if WASM is available (always true in supported browsers)
 */
export declare function hasPrebuilds(): boolean;
/**
 * Get supported platforms for browser
 */
export declare function getSupportedPlatforms(): readonly string[];
//# sourceMappingURL=browser-loader.d.ts.map