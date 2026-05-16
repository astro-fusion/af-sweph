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
import { EphemerisStore } from './loader';
import { JsonEngine } from './engine';
import { JsonSwephInstance } from './instance';

export * from './types';
export * from './ayanamsa';
export * from './interpolate';
export * from './lagna';
export { JsonEngine } from './engine';
export { JsonSwephInstance } from './instance';
export { EphemerisStore } from './loader';

// ============================================================================
// Node.js FS loader — only used in Node.js environments
// ============================================================================

/**
 * File-system based loader for Node.js environments.
 * Pass the directory that contains year sub-folders:
 *   <dataDir>/<year>/main.csv
 *   <dataDir>/<year>/moon.csv
 */
export class NodeFsLoader {
    constructor(private readonly dataDir: string) {}

    async loadYear(year: number): Promise<string> {
        const fs = await import('fs/promises');
        const path = await import('path');
        const filePath = path.join(this.dataDir, String(year), 'main.csv');
        return fs.readFile(filePath, 'utf-8');
    }

    async loadMoonYear(year: number): Promise<string> {
        const fs = await import('fs/promises');
        const path = await import('path');
        const filePath = path.join(this.dataDir, String(year), 'moon.csv');
        return fs.readFile(filePath, 'utf-8');
    }
}

/**
 * URL-based loader — fetches CSV files from any HTTP(S) endpoint.
 * Suitable for CDN-hosted data or Vercel static assets.
 *
 * Pass a custom fetch implementation if the global `fetch` is not available
 * in your environment (e.g. Node 16):
 *   new UrlLoader(baseUrl, require('node-fetch'))
 */
export class UrlLoader {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(
        private readonly baseUrl: string,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        private readonly fetchFn: (url: string) => Promise<any> = globalThis.fetch
    ) {}

    async loadYear(year: number): Promise<string> {
        const res = await this.fetchFn(`${this.baseUrl}/${year}/main.csv`);
        if (!res.ok) throw new Error(`Failed to load year ${year}: ${res.status}`);
        return res.text();
    }

    async loadMoonYear(year: number): Promise<string> {
        const res = await this.fetchFn(`${this.baseUrl}/${year}/moon.csv`);
        if (!res.ok) throw new Error(`Failed to load moon year ${year}: ${res.status}`);
        return res.text();
    }
}

// ============================================================================
// Factory
// ============================================================================

/**
 * Create a JSON-based sweph instance.
 *
 * @param options  Loader configuration
 * @returns        A SwephInstance-compatible object
 */
export function createJsonSweph(options: JsonSwephOptions = {}): JsonSwephInstance {
    const store = new EphemerisStore(
        options.loader ?? null,
        options.preloadedData ?? {},
        options.preloadedMoonData ?? {}
    );
    const engine = new JsonEngine(store);
    return new JsonSwephInstance(engine);
}

/**
 * Convenience: create a JsonEngine directly for use with the
 * ICalculationEngine tiered system.
 */
export function createJsonEngine(options: JsonSwephOptions = {}): JsonEngine {
    const store = new EphemerisStore(
        options.loader ?? null,
        options.preloadedData ?? {},
        options.preloadedMoonData ?? {}
    );
    return new JsonEngine(store);
}
