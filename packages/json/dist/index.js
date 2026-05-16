"use strict";
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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.UrlLoader = exports.NodeFsLoader = exports.EphemerisStore = exports.JsonSwephInstance = exports.JsonEngine = void 0;
exports.createJsonSweph = createJsonSweph;
exports.createJsonEngine = createJsonEngine;
const loader_1 = require("./loader");
const engine_1 = require("./engine");
const instance_1 = require("./instance");
__exportStar(require("./types"), exports);
__exportStar(require("./ayanamsa"), exports);
__exportStar(require("./interpolate"), exports);
__exportStar(require("./lagna"), exports);
var engine_2 = require("./engine");
Object.defineProperty(exports, "JsonEngine", { enumerable: true, get: function () { return engine_2.JsonEngine; } });
var instance_2 = require("./instance");
Object.defineProperty(exports, "JsonSwephInstance", { enumerable: true, get: function () { return instance_2.JsonSwephInstance; } });
var loader_2 = require("./loader");
Object.defineProperty(exports, "EphemerisStore", { enumerable: true, get: function () { return loader_2.EphemerisStore; } });
// ============================================================================
// Node.js FS loader — only used in Node.js environments
// ============================================================================
/**
 * File-system based loader for Node.js environments.
 * Pass the directory that contains year sub-folders:
 *   <dataDir>/<year>/main.csv
 *   <dataDir>/<year>/moon.csv
 */
class NodeFsLoader {
    dataDir;
    constructor(dataDir) {
        this.dataDir = dataDir;
    }
    async loadYear(year) {
        const fs = await Promise.resolve().then(() => __importStar(require('fs/promises')));
        const path = await Promise.resolve().then(() => __importStar(require('path')));
        const filePath = path.join(this.dataDir, String(year), 'main.csv');
        return fs.readFile(filePath, 'utf-8');
    }
    async loadMoonYear(year) {
        const fs = await Promise.resolve().then(() => __importStar(require('fs/promises')));
        const path = await Promise.resolve().then(() => __importStar(require('path')));
        const filePath = path.join(this.dataDir, String(year), 'moon.csv');
        return fs.readFile(filePath, 'utf-8');
    }
}
exports.NodeFsLoader = NodeFsLoader;
/**
 * URL-based loader — fetches CSV files from any HTTP(S) endpoint.
 * Suitable for CDN-hosted data or Vercel static assets.
 *
 * Pass a custom fetch implementation if the global `fetch` is not available
 * in your environment (e.g. Node 16):
 *   new UrlLoader(baseUrl, require('node-fetch'))
 */
class UrlLoader {
    baseUrl;
    fetchFn;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(baseUrl, 
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fetchFn = globalThis.fetch) {
        this.baseUrl = baseUrl;
        this.fetchFn = fetchFn;
    }
    async loadYear(year) {
        const res = await this.fetchFn(`${this.baseUrl}/${year}/main.csv`);
        if (!res.ok)
            throw new Error(`Failed to load year ${year}: ${res.status}`);
        return res.text();
    }
    async loadMoonYear(year) {
        const res = await this.fetchFn(`${this.baseUrl}/${year}/moon.csv`);
        if (!res.ok)
            throw new Error(`Failed to load moon year ${year}: ${res.status}`);
        return res.text();
    }
}
exports.UrlLoader = UrlLoader;
// ============================================================================
// Factory
// ============================================================================
/**
 * Create a JSON-based sweph instance.
 *
 * @param options  Loader configuration
 * @returns        A SwephInstance-compatible object
 */
function createJsonSweph(options = {}) {
    const store = new loader_1.EphemerisStore(options.loader ?? null, options.preloadedData ?? {}, options.preloadedMoonData ?? {});
    const engine = new engine_1.JsonEngine(store);
    return new instance_1.JsonSwephInstance(engine);
}
/**
 * Convenience: create a JsonEngine directly for use with the
 * ICalculationEngine tiered system.
 */
function createJsonEngine(options = {}) {
    const store = new loader_1.EphemerisStore(options.loader ?? null, options.preloadedData ?? {}, options.preloadedMoonData ?? {});
    return new engine_1.JsonEngine(store);
}
//# sourceMappingURL=index.js.map