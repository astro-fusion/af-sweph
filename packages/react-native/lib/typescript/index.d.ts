/**
 * @af/sweph-react-native
 *
 * React Native Turbo Module for Swiss Ephemeris.
 */
import { ReactNativeAdapter } from './adapter';
import type { ISwephInstance } from '@af/sweph-core';
export * from '@af/sweph-core';
export { ReactNativeAdapter };
/**
 * Options for initializing the React Native module
 */
export interface NativeLoadOptions {
    /** Optional custom ephemeris path (if not using default bundle resource) */
    ephePath?: string;
}
/**
 * Create and initialize a Swiss Ephemeris instance for React Native
 */
export declare function createSweph(options?: NativeLoadOptions): Promise<ISwephInstance>;
/**
 * Initialize (Same as createSweph for API compatibility)
 */
export declare function initializeSweph(options?: NativeLoadOptions): Promise<void>;
//# sourceMappingURL=index.d.ts.map