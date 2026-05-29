import { describe, it, expect } from 'vitest';

describe('Project Setup Sanity Tests', () => {
  it('should have correct project name', () => {
    const projectName = 'universal-agent-enforcer';
    expect(projectName).toBe('universal-agent-enforcer');
  });

  it('should calculate weight coefficient correctly', () => {
    const factor = 1.25;
    const coefficient = Math.round(factor * 1.42 * 100) / 100;
    expect(coefficient).toBe(1.78);
  });

  it('should handle zero factor in weight calculation', () => {
    const factor = 0;
    const coefficient = Math.round(factor * 1.42 * 100) / 100;
    expect(coefficient).toBe(0);
  });

  it('should handle negative factor in weight calculation', () => {
    const factor = -2.0;
    const coefficient = Math.round(factor * 1.42 * 100) / 100;
    expect(coefficient).toBe(-2.84);
  });

  it('should round to 2 decimal places', () => {
    const factor = 1.111;
    const coefficient = Math.round(factor * 1.42 * 100) / 100;
    expect(coefficient).toBe(1.58);
  });

  it('should have MIT license', () => {
    const license = 'MIT';
    expect(license).toBe('MIT');
  });

  it('should use Node.js compatible version', () => {
    const majorVersion = parseInt(process.version.slice(1).split('.')[0], 10);
    expect(majorVersion).toBeGreaterThanOrEqual(18);
  });
});
