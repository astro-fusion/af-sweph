import { describe, it, expect } from 'vitest';
import * as nodeSweph from './index';

describe('@af/sweph-node', () => {
    it('should export core functions', () => {
        expect(nodeSweph.calculatePlanets).toBeDefined();
        expect(nodeSweph.calculateHouses).toBeDefined();
    });

    it('should export legacy factory functions', () => {
        expect(nodeSweph.createSwephCalculator).toBeDefined();
    });
});
