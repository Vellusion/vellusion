import { describe, it, expect } from 'vitest';
import { SlopeAnalysis } from '../src/terrain/SlopeAnalysis';
import { AspectAnalysis } from '../src/terrain/AspectAnalysis';
import { ContourGenerator } from '../src/terrain/ContourGenerator';

describe('SlopeAnalysis', () => {
  it('should return all zero slopes for flat grid', () => {
    // 5x5 flat grid at height 100
    const grid = new Float32Array(25).fill(100);
    const result = SlopeAnalysis.analyze(grid, 5, 5, 10);
    expect(result.length).toBe(25);
    // Interior cells (1..3, 1..3) should be zero
    for (let y = 1; y < 4; y++) {
      for (let x = 1; x < 4; x++) {
        expect(result[y * 5 + x]).toBeCloseTo(0);
      }
    }
  });

  it('should compute correct slope for uniformly sloped grid', () => {
    // 5x5 grid sloping in x direction: height = x * 10
    const grid = new Float32Array(25);
    for (let y = 0; y < 5; y++) {
      for (let x = 0; x < 5; x++) {
        grid[y * 5 + x] = x * 10;
      }
    }
    const cellSize = 10;
    const result = SlopeAnalysis.analyze(grid, 5, 5, cellSize);
    // Interior cells should have slope = atan(1) = 45 degrees
    const expected = Math.atan(1); // rise/run = 10/10 = 1
    for (let y = 1; y < 4; y++) {
      for (let x = 1; x < 4; x++) {
        expect(result[y * 5 + x]).toBeCloseTo(expected, 4);
      }
    }
  });

  it('should return zero slope at edge cells', () => {
    const grid = new Float32Array(25);
    for (let i = 0; i < 25; i++) grid[i] = i;
    const result = SlopeAnalysis.analyze(grid, 5, 5, 1);
    // Top edge
    for (let x = 0; x < 5; x++) {
      expect(result[x]).toBe(0);
    }
    // Bottom edge
    for (let x = 0; x < 5; x++) {
      expect(result[4 * 5 + x]).toBe(0);
    }
  });

  it('should produce Float32Array output', () => {
    const grid = new Float32Array(9).fill(0);
    const result = SlopeAnalysis.analyze(grid, 3, 3, 1);
    expect(result).toBeInstanceOf(Float32Array);
    expect(result.length).toBe(9);
  });
});

describe('AspectAnalysis', () => {
  it('should return -1 for flat terrain', () => {
    const grid = new Float32Array(25).fill(50);
    const result = AspectAnalysis.analyze(grid, 5, 5, 10);
    for (let y = 1; y < 4; y++) {
      for (let x = 1; x < 4; x++) {
        expect(result[y * 5 + x]).toBe(-1);
      }
    }
  });

  it('should detect east-facing slope', () => {
    // Height increases to the east (positive x)
    const grid = new Float32Array(25);
    for (let y = 0; y < 5; y++) {
      for (let x = 0; x < 5; x++) {
        grid[y * 5 + x] = x * 10;
      }
    }
    const result = AspectAnalysis.analyze(grid, 5, 5, 10);
    // dzdx > 0, dzdy = 0 => atan2(0, dzdx) = 0 (east in math coords)
    for (let y = 1; y < 4; y++) {
      for (let x = 1; x < 4; x++) {
        const aspect = result[y * 5 + x];
        expect(aspect).not.toBe(-1);
        // Should be close to 0 (east direction in atan2 coords)
        expect(aspect).toBeCloseTo(0, 4);
      }
    }
  });

  it('should fill edges with -1', () => {
    const grid = new Float32Array(25);
    for (let i = 0; i < 25; i++) grid[i] = i;
    const result = AspectAnalysis.analyze(grid, 5, 5, 1);
    // Top edge
    for (let x = 0; x < 5; x++) {
      expect(result[x]).toBe(-1);
    }
  });

  it('should return values in [0, 2*PI) or -1', () => {
    const grid = new Float32Array(25);
    for (let i = 0; i < 25; i++) grid[i] = Math.sin(i) * 10;
    const result = AspectAnalysis.analyze(grid, 5, 5, 1);
    for (const v of result) {
      expect(v === -1 || (v >= 0 && v < 2 * Math.PI)).toBe(true);
    }
  });
});

describe('ContourGenerator', () => {
  it('should generate contours at correct elevations', () => {
    // 5x5 grid with heights 0-24
    const grid = new Float32Array(25);
    for (let i = 0; i < 25; i++) grid[i] = i;
    const contours = ContourGenerator.generate(grid, 5, 5, 1, 5);
    const elevations = contours.map((c) => c.elevation);
    expect(elevations).toContain(5);
    expect(elevations).toContain(10);
    expect(elevations).toContain(15);
    expect(elevations).toContain(20);
  });

  it('should generate no contours for flat grid at non-matching interval', () => {
    // All cells at height 7, interval 10 => ceil(7/10)*10 = 10 > 7 => no contours
    const grid = new Float32Array(25).fill(7);
    const contours = ContourGenerator.generate(grid, 5, 5, 1, 10);
    expect(contours.length).toBe(0);
  });

  it('should produce segments with Float64Array', () => {
    const grid = new Float32Array(25);
    for (let i = 0; i < 25; i++) grid[i] = i * 2;
    const contours = ContourGenerator.generate(grid, 5, 5, 1, 10);
    for (const c of contours) {
      expect(c.segments).toBeInstanceOf(Float64Array);
      // Segments come in pairs of 4 (x1,y1,x2,y2)
      expect(c.segments.length % 4).toBe(0);
    }
  });

  it('should scale segment coordinates by cellSize', () => {
    const grid = new Float32Array([0, 0, 10, 10, 0, 0, 10, 10, 10]);
    const cellSize = 5;
    const contours = ContourGenerator.generate(grid, 3, 3, cellSize, 5);
    expect(contours.length).toBeGreaterThan(0);
    // All coordinates should be multiples of cellSize or interpolated
    for (const c of contours) {
      for (let k = 0; k < c.segments.length; k++) {
        expect(c.segments[k]).toBeGreaterThanOrEqual(0);
      }
    }
  });
});
