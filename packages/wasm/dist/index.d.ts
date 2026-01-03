/**
 * @af/sweph-wasm
 *
 * Swiss Ephemeris WebAssembly module for browser-based Vedic astrology calculations.
 *
 * @example
 * ```typescript
 * import { createSweph } from '@af/sweph-wasm';
 *
 * const sweph = await createSweph();
 * const planets = sweph.calculatePlanets(new Date());
 * ```
 */
export * from '@af/sweph-core';
export { WasmAdapter } from './adapter';
export { loadWasmModule, getAdapter, isLoaded, isWasmSupported } from './loader';
export type { WasmLoadOptions } from './loader';
import { WasmLoadOptions } from './loader';
import type { ISwephInstance } from '@af/sweph-core';
/**
 * Create and initialize a Swiss Ephemeris instance for browser
 */
export declare function createSweph(options?: WasmLoadOptions): Promise<ISwephInstance>;
/**
 * Initialize Swiss Ephemeris (alias for createSweph for API compatibility)
 */
export declare function initializeSweph(options?: WasmLoadOptions): Promise<void>;
declare const _default: {
    createSweph: typeof createSweph;
    initializeSweph: typeof initializeSweph;
};
export default _default;
//# sourceMappingURL=index.d.ts.map