import { describe, it, expect } from 'vitest';
import { FloodAnalysis } from '../src/FloodAnalysis';
import { ProfileAnalysis } from '../src/ProfileAnalysis';
import { CutFillAnalysis } from '../src/CutFillAnalysis';
import { SkylineAnalysis } from '../src/SkylineAnalysis';
import type { TerrainSampler } from '../src/TerrainSampler';

describe('FloodAnalysis', () => {
  it('should mark cells below water level as flooded', () => {
    const grid = new Float32Array([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    const result = FloodAnalysis.analyze(grid, 3, 3, 5);
    // Cells with height <= 5 should be flooded
    expect(result[0]).toBe(1); // 1 <= 5
    expect(result[1]).toBe(1); // 2 <= 5
    expect(result[2]).toBe(1); // 3 <= 5
    expect(result[3]).toBe(1); // 4 <= 5
    expect(result[4]).toBe(1); // 5 <= 5
  });

  it('should mark cells above water level as dry', () => {
    const grid = new Float32Array([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    const result = FloodAnalysis.analyze(grid, 3, 3, 5);
    expect(result[5]).toBe(0); // 6 > 5
    expect(result[6]).toBe(0); // 7 > 5
    expect(result[7]).toBe(0); // 8 > 5
    expect(result[8]).toBe(0); // 9 > 5
  });

  it('should return Uint8Array with correct size', () => {
    const grid = new Float32Array(16).fill(10);
    const result = FloodAnalysis.analyze(grid, 4, 4, 5);
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBe(16);
  });
});

describe('ProfileAnalysis', () => {
  it('should return constant heights for flat terrain', () => {
    const sampler: TerrainSampler = { getHeight: () => 42 };
    const positions = [
      new Float64Array([0, 0]),
      new Float64Array([0.001, 0]),
    ];
    const result = ProfileAnalysis.generateProfile(positions, sampler, 10);
    for (let i = 0; i < result.heights.length; i++) {
      expect(result.heights[i]).toBe(42);
    }
  });

  it('should return correct sample count', () => {
    const sampler: TerrainSampler = { getHeight: () => 0 };
    const positions = [
      new Float64Array([0, 0]),
      new Float64Array([0.001, 0]),
    ];
    const result = ProfileAnalysis.generateProfile(positions, sampler, 25);
    expect(result.distances.length).toBe(25);
    expect(result.heights.length).toBe(25);
  });

  it('should compute total distance greater than zero', () => {
    const sampler: TerrainSampler = { getHeight: () => 0 };
    const positions = [
      new Float64Array([0, 0]),
      new Float64Array([0.01, 0]),
    ];
    const result = ProfileAnalysis.generateProfile(positions, sampler, 10);
    expect(result.totalDistance).toBeGreaterThan(0);
  });

  it('should have monotonically increasing distances', () => {
    const sampler: TerrainSampler = { getHeight: () => 0 };
    const positions = [
      new Float64Array([0, 0]),
      new Float64Array([0.001, 0.001]),
    ];
    const result = ProfileAnalysis.generateProfile(positions, sampler, 20);
    for (let i = 1; i < result.distances.length; i++) {
      expect(result.distances[i]).toBeGreaterThanOrEqual(result.distances[i - 1]);
    }
  });
});

describe('CutFillAnalysis', () => {
  it('should compute fill where design is above existing', () => {
    const existing = new Float32Array([10, 10, 10, 10]);
    const design = new Float32Array([15, 15, 15, 15]);
    const result = CutFillAnalysis.analyze(existing, design, 2, 2, 1);
    expect(result.fillVolume).toBe(20); // 5 * 1 * 4 cells
    expect(result.cutVolume).toBe(0);
  });

  it('should compute cut where design is below existing', () => {
    const existing = new Float32Array([20, 20, 20, 20]);
    const design = new Float32Array([10, 10, 10, 10]);
    const result = CutFillAnalysis.analyze(existing, design, 2, 2, 1);
    expect(result.cutVolume).toBe(40); // 10 * 1 * 4 cells
    expect(result.fillVolume).toBe(0);
  });

  it('should compute correct net volume', () => {
    const existing = new Float32Array([10, 10, 20, 20]);
    const design = new Float32Array([15, 15, 15, 15]);
    const result = CutFillAnalysis.analyze(existing, design, 2, 2, 2);
    // Fill: 5*4 + 5*4 = 40, Cut: 5*4 + 5*4 = 40
    expect(result.fillVolume).toBeCloseTo(40);
    expect(result.cutVolume).toBeCloseTo(40);
    expect(result.netVolume).toBeCloseTo(0);
  });

  it('should scale volume by cell area', () => {
    const existing = new Float32Array([0]);
    const design = new Float32Array([10]);
    const smallCell = CutFillAnalysis.analyze(existing, design, 1, 1, 1);
    const largeCell = CutFillAnalysis.analyze(existing, design, 1, 1, 3);
    expect(largeCell.fillVolume).toBe(smallCell.fillVolume * 9);
  });
});

describe('SkylineAnalysis', () => {
  it('should find top of objects in depth buffer', () => {
    // 4x4 depth buffer: sky (1.0) on top rows, object (0.5) on bottom rows
    const depth = new Float32Array([
      1.0, 1.0, 1.0, 1.0,
      1.0, 1.0, 1.0, 1.0,
      0.5, 0.5, 0.5, 0.5,
      0.5, 0.5, 0.5, 0.5,
    ]);
    const result = SkylineAnalysis.extract(depth, 4, 4);
    expect(result.points.length).toBe(8); // 4 columns * 2 values
    // All columns should have skyline at y=2 (first non-sky row)
    for (let x = 0; x < 4; x++) {
      expect(result.points[x * 2]).toBe(x);
      expect(result.points[x * 2 + 1]).toBe(2);
    }
  });

  it('should default to bottom for all-sky columns', () => {
    const depth = new Float32Array(16).fill(1.0);
    const result = SkylineAnalysis.extract(depth, 4, 4);
    for (let x = 0; x < 4; x++) {
      expect(result.points[x * 2 + 1]).toBe(4); // bottom = height
    }
  });

  it('should return Float32Array of x,y pairs', () => {
    const depth = new Float32Array(9).fill(0.5);
    const result = SkylineAnalysis.extract(depth, 3, 3);
    expect(result.points).toBeInstanceOf(Float32Array);
    expect(result.points.length).toBe(6); // 3 columns * 2
  });

  it('should handle custom maxDepth', () => {
    const depth = new Float32Array([
      100, 100,
      50, 50,
    ]);
    const result = SkylineAnalysis.extract(depth, 2, 2, 100);
    // First row is sky (100 = maxDepth), second row is object (50 < 100)
    expect(result.points[1]).toBe(1); // column 0 skyline at y=1
    expect(result.points[3]).toBe(1); // column 1 skyline at y=1
  });
});
