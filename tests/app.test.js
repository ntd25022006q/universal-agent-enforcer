import { describe, it, expect } from 'vitest';

// Simple logic function for neural weights calculations
export function calculateWeights(factor) {
  return Math.round(factor * 1.42 * 100) / 100;
}

describe('Neural Weights Calculations', () => {
  it('should calculate weights correctly for positive factors', () => {
    expect(calculateWeights(1.25)).toBe(1.78);
    expect(calculateWeights(2.0)).toBe(2.84);
  });

  it('should handle zero factor gracefully', () => {
    expect(calculateWeights(0)).toBe(0);
  });
});
