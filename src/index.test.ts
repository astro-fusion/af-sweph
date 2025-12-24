import { describe, it, expect } from 'vitest';
import * as sweph from './index';

describe('@AstroFusion/sweph', () => {
  it('should export all main functions', () => {
    expect(typeof sweph.calculatePlanets).toBe('function');
    expect(typeof sweph.calculateLagna).toBe('function');
    expect(typeof sweph.calculateSunTimes).toBe('function');
    expect(typeof sweph.calculateMoonData).toBe('function');
  });

  it('should export constants', () => {
    expect(sweph.PLANETS).toBeDefined();
    expect(sweph.AYANAMSA).toBeDefined();
    expect(sweph.HOUSE_SYSTEMS).toBeDefined();
  });

  it('should have proper constants structure', () => {
    expect(sweph.PLANETS.SUN).toBeDefined();
    expect(sweph.PLANETS.MOON).toBeDefined();
    expect(sweph.PLANETS.SUN.name).toBe('Sun');
  });

  it('should export types', () => {
    // Type exports don't create runtime values, but we can test that the module loads
    expect(sweph).toBeDefined();
  });
});
