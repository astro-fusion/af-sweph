/**
 * @af/sweph-wasm - WASM Loader
 *
 * Loads and initializes the WebAssembly module.
 */
import { WasmAdapter } from './adapter';
/**
 * Options for loading the WASM module
 */
export interface WasmLoadOptions {
    /** Custom URL for the WASM file */
    wasmUrl?: string;
    /** Custom URL for the JS glue code */
    jsUrl?: string;
}
/**
 * Load and initialize the Swiss Ephemeris WASM module
 *
 * @param options - Loading options
 * @returns Promise resolving to the WASM adapter
 */
export declare function loadWasmModule(options?: WasmLoadOptions): Promise<WasmAdapter>;
/**
 * Get the loaded adapter (throws if not initialized)
 */
export declare function getAdapter(): WasmAdapter;
/**
 * Check if WASM module is loaded
 */
export declare function isLoaded(): boolean;
/**
 * Check if WebAssembly is supported in this environment
 */
export declare function isWasmSupported(): boolean;
//# sourceMappingURL=loader.d.ts.map