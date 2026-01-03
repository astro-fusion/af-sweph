"use strict";
/**
 * @af/sweph-wasm - WASM Loader
 *
 * Loads and initializes the WebAssembly module.
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
exports.loadWasmModule = loadWasmModule;
exports.getAdapter = getAdapter;
exports.isLoaded = isLoaded;
exports.isWasmSupported = isWasmSupported;
const adapter_1 = require("./adapter");
// Cached instances
let wasmModule = null;
let adapter = null;
let loadPromise = null;
/**
 * Load and initialize the Swiss Ephemeris WASM module
 *
 * @param options - Loading options
 * @returns Promise resolving to the WASM adapter
 */
async function loadWasmModule(options) {
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
            const createSwephModule = (await Promise.resolve().then(() => __importStar(require('../wasm/swisseph.js')))).default;
            const moduleConfig = {
                locateFile: (path, scriptDirectory) => {
                    if (path.endsWith('.wasm') && options?.wasmUrl) {
                        return options.wasmUrl;
                    }
                    return scriptDirectory + path;
                }
            };
            wasmModule = await createSwephModule(moduleConfig);
            adapter = new adapter_1.WasmAdapter(wasmModule);
            return adapter;
        }
        catch (error) {
            loadPromise = null;
            throw new Error(`Failed to load Swiss Ephemeris WASM module: ${error}`);
        }
    })();
    return loadPromise;
}
/**
 * Get the loaded adapter (throws if not initialized)
 */
function getAdapter() {
    if (!adapter) {
        throw new Error('Swiss Ephemeris WASM module not initialized. ' +
            'Call await initializeSweph() before using calculation functions.');
    }
    return adapter;
}
/**
 * Check if WASM module is loaded
 */
function isLoaded() {
    return adapter !== null;
}
/**
 * Check if WebAssembly is supported in this environment
 */
function isWasmSupported() {
    return typeof WebAssembly !== 'undefined';
}
//# sourceMappingURL=loader.js.map