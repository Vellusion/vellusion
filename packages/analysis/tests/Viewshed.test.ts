import { describe, it, expect } from 'vitest';
import { LineOfSight } from '../src/viewshed/LineOfSight';
import { Viewshed } from '../src/viewshed/Viewshed';
import type { TerrainSampler } from '../src/TerrainSampler';

describe('LineOfSight', () => {
  it('should report visible over flat terrain', () => {
    const sampler: TerrainSampler = { getHeight: () => 0 };
    const origin = new Float64Array([0, 0, 100]);
    const target = new Float64Array([0.001, 0.001, 100]);
    const result = LineOfSight.analyze(origin, target, sampler);
    expect(result.isVisible).toBe(true);
    expect(result.obstructionPoint).toBeNull();
  });

  it('should detect obstruction by a hill', () => {
    const sampler: TerrainSampler = {
      getHeight: (lon: number, lat: number) => {
        // Hill in the middle
        const dist = Math.sqrt(lon * lon + lat * lat);
        if (dist > 0.0003 && dist < 0.0007) return 200;
        return 0;
      },
    };
    const origin = new Float64Array([0, 0, 50]);
    const target = new Float64Array([0.001, 0, 50]);
    const result = LineOfSight.analyze(origin, target, sampler);
    expect(result.isVisible).toBe(false);
    expect(result.obstructionPoint).not.toBeNull();
  });

  it('should return correct distance for visible path', () => {
    const sampler: TerrainSampler = { getHeight: () => 0 };
    const origin = new Float64Array([0, 0, 100]);
    const target = new Float64Array([0.001, 0, 100]);
    const result = LineOfSight.analyze(origin, target, sampler);
    expect(result.distance).toBeGreaterThan(0);
  });

  it('should return distance to obstruction point', () => {
    const sampler: TerrainSampler = {
      getHeight: (lon: number) => {
        // Wall at lon = 0.0005
        return lon > 0.0004 && lon < 0.0006 ? 500 : 0;
      },
    };
    const origin = new Float64Array([0, 0, 50]);
    const target = new Float64Array([0.001, 0, 50]);
    const result = LineOfSight.analyze(origin, target, sampler);
    expect(result.isVisible).toBe(false);
    expect(result.distance).toBeGreaterThan(0);
    expect(result.distance).toBeLessThan(
      LineOfSight.analyze(
        origin,
        target,
        { getHeight: () => 0 },
      ).distance,
    );
  });

  it('should handle custom sample count', () => {
    const sampler: TerrainSampler = { getHeight: () => 0 };
    const origin = new Float64Array([0, 0, 100]);
    const target = new Float64Array([0.001, 0, 100]);
    const result = LineOfSight.analyze(origin, target, sampler, 10);
    expect(result.isVisible).toBe(true);
  });

  it('should see target above terrain', () => {
    const sampler: TerrainSampler = { getHeight: () => 50 };
    const origin = new Float64Array([0, 0, 200]);
    const target = new Float64Array([0.001, 0, 200]);
    const result = LineOfSight.analyze(origin, target, sampler);
    expect(result.isVisible).toBe(true);
  });
});

describe('Viewshed', () => {
  it('should return correct grid size', () => {
    const sampler: TerrainSampler = { getHeight: () => 0 };
    const origin = new Float64Array([0, 0, 100]);
    const result = Viewshed.analyze(origin, sampler, {
      horizontalFov: Math.PI / 4,
      verticalFov: Math.PI / 4,
      direction: 0,
      distance: 1000,
      resolution: 8,
    });
    expect(result.width).toBe(8);
    expect(result.height).toBe(8);
    expect(result.visibility.length).toBe(64);
  });

  it('should show all visible on flat terrain', () => {
    const sampler: TerrainSampler = { getHeight: () => 0 };
    const origin = new Float64Array([0, 0, 100]);
    const result = Viewshed.analyze(origin, sampler, {
      horizontalFov: Math.PI / 4,
      verticalFov: Math.PI / 4,
      direction: 0,
      distance: 500,
      resolution: 4,
    });
    const allVisible = Array.from(result.visibility).every((v) => v === 1);
    expect(allVisible).toBe(true);
  });

  it('should detect obstructed cells with terrain', () => {
    const sampler: TerrainSampler = {
      getHeight: (lon: number, lat: number) => {
        // Ridge blocking view at mid-distance
        if (lat > 0.00001 && lat < 0.00003) return 500;
        return 0;
      },
    };
    const origin = new Float64Array([0, 0, 50]);
    const result = Viewshed.analyze(origin, sampler, {
      horizontalFov: Math.PI / 6,
      verticalFov: Math.PI / 6,
      direction: 0,
      distance: 5000,
      resolution: 4,
    });
    const hasObstructed = Array.from(result.visibility).some((v) => v === 0);
    expect(hasObstructed).toBe(true);
  });

  it('should produce Uint8Array visibility values', () => {
    const sampler: TerrainSampler = { getHeight: () => 0 };
    const origin = new Float64Array([0, 0, 100]);
    const result = Viewshed.analyze(origin, sampler, {
      horizontalFov: Math.PI / 4,
      verticalFov: Math.PI / 4,
      direction: 0,
      distance: 1000,
      resolution: 4,
    });
    expect(result.visibility).toBeInstanceOf(Uint8Array);
    for (const v of result.visibility) {
      expect(v === 0 || v === 1).toBe(true);
    }
  });
});
