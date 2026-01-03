/**
 * @af/sweph-wasm - WASM Loader
 * 
 * Loads and initializes the WebAssembly module.
 */

import { WasmAdapter } from './adapter';

// Cached instances
let wasmModule: any = null;
let adapter: WasmAdapter | null = null;
let loadPromise: Promise<WasmAdapter> | null = null;

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
export async function loadWasmModule(options?: WasmLoadOptions): Promise<WasmAdapter> {
    // Return cached adapter if already loaded
    if (adapter) {
        return adapter;
    }

    // Return existing promise if currently loading
    if (loadPromise) {
        return loadPromise;
    }

    loadPromise = (async () => {
        try {
            // Dynamic import of the WASM glue code
            // @ts-expect-error - Module path is resolved at build time
            const createSwephModule = (await import('../wasm/swisseph.js')).default;

            const moduleConfig: any = {
                locateFile: (path: string, scriptDirectory: string) => {
                    if (path.endsWith('.wasm') && options?.wasmUrl) {
                        return options.wasmUrl;
                    }
                    return scriptDirectory + path;
                }
            };

            wasmModule = await createSwephModule(moduleConfig);
            adapter = new WasmAdapter(wasmModule);

            return adapter;
        } catch (error) {
            loadPromise = null;
            throw new Error(`Failed to load Swiss Ephemeris WASM module: ${error}`);
        }
    })();

    return loadPromise;
}

/**
 * Get the loaded adapter (throws if not initialized)
 */
export function getAdapter(): WasmAdapter {
    if (!adapter) {
        throw new Error(
            'Swiss Ephemeris WASM module not initialized. ' +
            'Call await initializeSweph() before using calculation functions.'
        );
    }
    return adapter;
}

/**
 * Check if WASM module is loaded
 */
export function isLoaded(): boolean {
    return adapter !== null;
}

/**
 * Check if WebAssembly is supported in this environment
 */
export function isWasmSupported(): boolean {
    return typeof WebAssembly !== 'undefined';
}
