import { describe, it, expect } from 'vitest';

// Weight calculation function for the demonstration dashboard
export function calculateWeights(factor) {
  return Math.round(factor * 1.42 * 100) / 100;
}

describe('Weight Calculation Demo', () => {
  it('should calculate weight coefficient correctly for positive factors', () => {
    expect(calculateWeights(1.25)).toBe(1.78);
    expect(calculateWeights(2.0)).toBe(2.84);
  });

  it('should handle zero factor gracefully', () => {
    expect(calculateWeights(0)).toBe(0);
  });
});
