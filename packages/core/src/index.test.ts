import { describe, it, expect } from 'vitest';
import * as core from './index';

describe('@af/sweph-core', () => {
    it('should export constants', () => {
        expect(core.PLANETS).toBeDefined();
        expect(core.RASHIS).toBeDefined();
        expect(core.NAKSHATRAS).toBeDefined();
    });

    it('should export utility functions', () => {
        expect(core.normalizeLongitude).toBeDefined();
        expect(core.julianToDate).toBeDefined();
    });
});
