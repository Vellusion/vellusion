import { describe, it, expect } from 'vitest';
import { Vec3 } from '../src/Vec3';
import { Cartographic } from '../src/Cartographic';
import { VelMath } from '../src/MathUtils';
import { GeographicProjection, WebMercatorProjection } from '../src/Projection';

describe('GeographicProjection', () => {
  it('should project (0, 0) to near origin', () => {
    const proj = GeographicProjection.create();
    const carto = Cartographic.create(0, 0, 0);
    const result = Vec3.zero();

    proj.project(carto, result);
    expect(result[0]).toBeCloseTo(0);
    expect(result[1]).toBeCloseTo(0);
    expect(result[2]).toBeCloseTo(0);
  });

  it('should round-trip project and unproject', () => {
    const proj = GeographicProjection.create();
    const carto = Cartographic.fromDegrees(45, 30, 100);
    const projected = Vec3.zero();
    const unprojected = Cartographic.create();

    proj.project(carto, projected);
    proj.unproject(projected, unprojected);

    expect(unprojected[0]).toBeCloseTo(carto[0], 10);
    expect(unprojected[1]).toBeCloseTo(carto[1], 10);
    expect(unprojected[2]).toBeCloseTo(carto[2], 10);
  });

  it('should preserve height through projection', () => {
    const proj = GeographicProjection.create();
    const carto = Cartographic.create(0, 0, 500);
    const result = Vec3.zero();

    proj.project(carto, result);
    expect(result[2]).toBeCloseTo(500);
  });
});

describe('WebMercatorProjection', () => {
  it('should project (0, 0) to (0, 0)', () => {
    const proj = WebMercatorProjection.create();
    const carto = Cartographic.create(0, 0, 0);
    const result = Vec3.zero();

    proj.project(carto, result);
    expect(result[0]).toBeCloseTo(0);
    expect(result[1]).toBeCloseTo(0);
    expect(result[2]).toBeCloseTo(0);
  });

  it('should round-trip project and unproject', () => {
    const proj = WebMercatorProjection.create();
    const carto = Cartographic.fromDegrees(45, 30, 200);
    const projected = Vec3.zero();
    const unprojected = Cartographic.create();

    proj.project(carto, projected);
    proj.unproject(projected, unprojected);

    expect(unprojected[0]).toBeCloseTo(carto[0], 10);
    expect(unprojected[1]).toBeCloseTo(carto[1], 10);
    expect(unprojected[2]).toBeCloseTo(carto[2], 10);
  });

  it('should clamp high latitude', () => {
    const proj = WebMercatorProjection.create();
    const maxLat = VelMath.toRadians(85.05112878);

    // Latitude above the mercator limit
    const carto = Cartographic.fromDegrees(0, 89, 0);
    const projected = Vec3.zero();

    proj.project(carto, projected);

    // The projected y should be the same as projecting the clamped latitude
    const clampedCarto = Cartographic.create(0, maxLat, 0);
    const clampedProjected = Vec3.zero();
    proj.project(clampedCarto, clampedProjected);

    expect(projected[1]).toBeCloseTo(clampedProjected[1]);
  });

  it('should produce positive y for positive latitude', () => {
    const proj = WebMercatorProjection.create();
    const carto = Cartographic.fromDegrees(0, 45, 0);
    const result = Vec3.zero();

    proj.project(carto, result);
    expect(result[1]).toBeGreaterThan(0);
  });
});
