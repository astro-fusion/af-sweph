import { describe, it, expect } from 'vitest';
import { createSweph } from './index';

describe('@af/sweph-wasm', () => {
    it('should export createSweph factory', () => {
        expect(createSweph).toBeDefined();
        expect(typeof createSweph).toBe('function');
    });
});
