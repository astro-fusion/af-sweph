/**
 * @af/sweph-lite
 * 
 * Lightweight pure JavaScript astronomical calculations using astronomy-engine.
 * This is the default/fastest tier for planetary calculations.
 * 
 * Supported Features:
 * - Planetary positions (Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn, Rahu, Ketu)
 * - Sunrise/Sunset times
 * - Moon phase calculations
 * - Ayanamsa (approximated)
 * 
 * NOT Supported (auto-escalates to WASM/Native):
 * - House systems / Lagna (Ascendant)
 * - Exact Ayanamsa values
 * 
 * @example
 * ```typescript
 * import { LiteEngine } from '@af/sweph-lite';
 * 
 * const engine = new LiteEngine();
 * await engine.initialize();
 * 
 * const planets = await engine.calculatePlanets(new Date());
 * ```
 */

export { LiteEngine } from './engine';
export { createLiteSweph } from './factory';

// Re-export core types for convenience
export type {
    Planet,
    GeoLocation,
    SunTimes,
    MoonPhase,
    LagnaInfo,
    CalculationOptions,
    TieredResult,
    TierMetadata,
    ICalculationEngine,
} from '@af/sweph-core';

export {
    CalculationTier,
    EngineFeatures,
    FeatureNotSupportedError,
} from '@af/sweph-core';
