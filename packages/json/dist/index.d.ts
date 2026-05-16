/**
 * @af/sweph-json — Zero-native-dependency JSON ephemeris engine
 *
 * @example Basic usage with a file-system loader (Node.js)
 * ```typescript
 * import { createJsonSweph, NodeFsLoader } from '@af/sweph-json';
 *
 * const sweph = createJsonSweph({
 *   loader: new NodeFsLoader('/path/to/ephemeris_data'),
 * });
 *
 * const planets = await sweph.calculatePlanets(new Date(), { ayanamsa: 1 });
 * const lagna = await sweph.calculateLagna(new Date(), { latitude: 28.6, longitude: 77.2 });
 * ```
 *
 * @example Serverless / edge — bundle data via dynamic import
 * ```typescript
 * import { createJsonSweph } from '@af/sweph-json';
 *
 * const sweph = createJsonSweph({
 *   loader: {
 *     async loadYear(year: number) {
 *       // Dynamic import of pre-bundled CSV files
 *       const mod = await import(`../data/ephemeris/${year}/main.csv?raw`);
 *       return mod.default;
 *     },
 *   },
 * });
 * ```
 */
import type { JsonSwephOptions } from './types';
import { JsonEngine } from './engine';
import { JsonSwephInstance } from './instance';
export * from './types';
export * from './ayanamsa';
export * from './interpolate';
export * from './lagna';
export { JsonEngine } from './engine';
export { JsonSwephInstance } from './instance';
export { EphemerisStore } from './loader';
/**
 * File-system based loader for Node.js environments.
 * Pass the directory that contains year sub-folders:
 *   <dataDir>/<year>/main.csv
 *   <dataDir>/<year>/moon.csv
 */
export declare class NodeFsLoader {
    private readonly dataDir;
    constructor(dataDir: string);
    loadYear(year: number): Promise<string>;
    loadMoonYear(year: number): Promise<string>;
}
/**
 * URL-based loader — fetches CSV files from any HTTP(S) endpoint.
 * Suitable for CDN-hosted data or Vercel static assets.
 *
 * Pass a custom fetch implementation if the global `fetch` is not available
 * in your environment (e.g. Node 16):
 *   new UrlLoader(baseUrl, require('node-fetch'))
 */
export declare class UrlLoader {
    private readonly baseUrl;
    private readonly fetchFn;
    constructor(baseUrl: string, fetchFn?: (url: string) => Promise<any>);
    loadYear(year: number): Promise<string>;
    loadMoonYear(year: number): Promise<string>;
}
/**
 * Create a JSON-based sweph instance.
 *
 * @param options  Loader configuration
 * @returns        A SwephInstance-compatible object
 */
export declare function createJsonSweph(options?: JsonSwephOptions): JsonSwephInstance;
/**
 * Convenience: create a JsonEngine directly for use with the
 * ICalculationEngine tiered system.
 */
export declare function createJsonEngine(options?: JsonSwephOptions): JsonEngine;
//# sourceMappingURL=index.d.ts.map