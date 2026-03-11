import { describe, it, expect } from 'vitest';
import { Vec3, Cartographic, Ellipsoid } from '@vellusion/math';
import type { Vec3Type, CartographicType } from '@vellusion/math';
import {
  DistanceMeasurement,
  AreaMeasurement,
  HeightMeasurement,
  AngleMeasurement,
} from '@vellusion/analysis';

describe('DistanceMeasurement', () => {
  it('geodesicDistance between same point returns 0', () => {
    const p = Cartographic.fromDegrees(0, 0);
    expect(DistanceMeasurement.geodesicDistance(p, p)).toBe(0);
  });

  it('geodesicDistance along equator 0,0 to 1,0 is approximately 111km', () => {
    const from = Cartographic.fromDegrees(0, 0);
    const to = Cartographic.fromDegrees(1, 0);
    const dist = DistanceMeasurement.geodesicDistance(from, to);
    // 1 degree of longitude at equator ~ 111,195 m
    expect(dist).toBeGreaterThan(110_000);
    expect(dist).toBeLessThan(112_000);
  });

  it('geodesicDistance is symmetric', () => {
    const a = Cartographic.fromDegrees(10, 20);
    const b = Cartographic.fromDegrees(30, 40);
    const d1 = DistanceMeasurement.geodesicDistance(a, b);
    const d2 = DistanceMeasurement.geodesicDistance(b, a);
    expect(d1).toBeCloseTo(d2, 6);
  });

  it('straightLineDistance between known points', () => {
    const a = Vec3.create(0, 0, 0);
    const b = Vec3.create(3, 4, 0);
    expect(DistanceMeasurement.straightLineDistance(a, b)).toBeCloseTo(5, 10);
  });

  it('straightLineDistance in 3D', () => {
    const a = Vec3.create(1, 2, 3);
    const b = Vec3.create(4, 6, 3);
    // dx=3, dy=4, dz=0 => 5
    expect(DistanceMeasurement.straightLineDistance(a, b)).toBeCloseTo(5, 10);
  });

  it('polylineDistance sums segments in straight mode', () => {
    const pts: Vec3Type[] = [
      Vec3.create(0, 0, 0),
      Vec3.create(3, 4, 0), // dist=5
      Vec3.create(3, 4, 12), // dist=12
    ];
    expect(DistanceMeasurement.polylineDistance(pts, 'straight')).toBeCloseTo(17, 10);
  });

  it('polylineDistance with single point returns 0', () => {
    const pts: Vec3Type[] = [Vec3.create(1, 2, 3)];
    expect(DistanceMeasurement.polylineDistance(pts)).toBe(0);
  });

  it('polylineDistance geodesic mode converts cartesian through WGS84', () => {
    // Two points on the WGS84 surface at equator, ~1 degree apart
    const result1 = Vec3.zero();
    const result2 = Vec3.zero();
    Ellipsoid.cartographicToCartesian(Ellipsoid.WGS84, Cartographic.fromDegrees(0, 0, 0), result1);
    Ellipsoid.cartographicToCartesian(Ellipsoid.WGS84, Cartographic.fromDegrees(1, 0, 0), result2);
    const pts: Vec3Type[] = [result1, result2];
    const dist = DistanceMeasurement.polylineDistance(pts, 'geodesic');
    expect(dist).toBeGreaterThan(110_000);
    expect(dist).toBeLessThan(112_000);
  });
});

describe('AreaMeasurement', () => {
  it('sphericalArea of fewer than 3 points returns 0', () => {
    expect(AreaMeasurement.sphericalArea([])).toBe(0);
    expect(AreaMeasurement.sphericalArea([Cartographic.fromDegrees(0, 0)])).toBe(0);
    expect(AreaMeasurement.sphericalArea([
      Cartographic.fromDegrees(0, 0),
      Cartographic.fromDegrees(1, 0),
    ])).toBe(0);
  });

  it('sphericalArea of a small rectangle is approximately correct', () => {
    // 1 degree x 1 degree rectangle near the equator
    const positions: CartographicType[] = [
      Cartographic.fromDegrees(0, 0),
      Cartographic.fromDegrees(1, 0),
      Cartographic.fromDegrees(1, 1),
      Cartographic.fromDegrees(0, 1),
    ];
    const area = AreaMeasurement.sphericalArea(positions);
    // ~111km * ~111km = ~1.23e10 m^2
    expect(area).toBeGreaterThan(1.0e10);
    expect(area).toBeLessThan(1.5e10);
  });

  it('planarArea of fewer than 3 points returns 0', () => {
    expect(AreaMeasurement.planarArea([])).toBe(0);
    expect(AreaMeasurement.planarArea([Vec3.create(0, 0, 0)])).toBe(0);
  });

  it('planarArea of a unit square in XY plane equals 1', () => {
    const positions: Vec3Type[] = [
      Vec3.create(0, 0, 0),
      Vec3.create(1, 0, 0),
      Vec3.create(1, 1, 0),
      Vec3.create(0, 1, 0),
    ];
    expect(AreaMeasurement.planarArea(positions)).toBeCloseTo(1, 10);
  });

  it('planarArea of a right triangle equals half base times height', () => {
    // Triangle with base=6, height=4 => area=12
    const positions: Vec3Type[] = [
      Vec3.create(0, 0, 0),
      Vec3.create(6, 0, 0),
      Vec3.create(0, 4, 0),
    ];
    expect(AreaMeasurement.planarArea(positions)).toBeCloseTo(12, 10);
  });

  it('planarArea works for a 3D polygon not in XY plane', () => {
    // A unit square in the XZ plane
    const positions: Vec3Type[] = [
      Vec3.create(0, 0, 0),
      Vec3.create(1, 0, 0),
      Vec3.create(1, 0, 1),
      Vec3.create(0, 0, 1),
    ];
    expect(AreaMeasurement.planarArea(positions)).toBeCloseTo(1, 10);
  });
});

describe('HeightMeasurement', () => {
  it('verticalDistance between concentric points', () => {
    const inner = Vec3.create(100, 0, 0);
    const outer = Vec3.create(200, 0, 0);
    expect(HeightMeasurement.verticalDistance(inner, outer)).toBeCloseTo(100, 10);
  });

  it('verticalDistance is negative when to is closer to center', () => {
    const outer = Vec3.create(200, 0, 0);
    const inner = Vec3.create(100, 0, 0);
    expect(HeightMeasurement.verticalDistance(outer, inner)).toBeCloseTo(-100, 10);
  });

  it('absoluteHeightDifference is always positive', () => {
    const a = Vec3.create(200, 0, 0);
    const b = Vec3.create(100, 0, 0);
    expect(HeightMeasurement.absoluteHeightDifference(a, b)).toBeCloseTo(100, 10);
    expect(HeightMeasurement.absoluteHeightDifference(b, a)).toBeCloseTo(100, 10);
  });

  it('verticalDistance with 3D points uses radial distance', () => {
    // Point at (3,4,0) has magnitude 5, origin at 0
    const from = Vec3.create(0, 0, 0);
    const to = Vec3.create(3, 4, 0);
    expect(HeightMeasurement.verticalDistance(from, to)).toBeCloseTo(5, 10);
  });
});

describe('AngleMeasurement', () => {
  it('right angle (90 degrees) returns PI/2', () => {
    const a = Vec3.create(1, 0, 0);
    const vertex = Vec3.create(0, 0, 0);
    const b = Vec3.create(0, 1, 0);
    expect(AngleMeasurement.angleBetween(a, vertex, b)).toBeCloseTo(Math.PI / 2, 10);
  });

  it('straight angle (180 degrees) returns PI', () => {
    const a = Vec3.create(1, 0, 0);
    const vertex = Vec3.create(0, 0, 0);
    const b = Vec3.create(-1, 0, 0);
    expect(AngleMeasurement.angleBetween(a, vertex, b)).toBeCloseTo(Math.PI, 10);
  });

  it('zero angle returns 0', () => {
    const a = Vec3.create(5, 0, 0);
    const vertex = Vec3.create(0, 0, 0);
    const b = Vec3.create(3, 0, 0);
    expect(AngleMeasurement.angleBetween(a, vertex, b)).toBeCloseTo(0, 10);
  });

  it('returns 0 when a ray has zero length', () => {
    const a = Vec3.create(0, 0, 0);
    const vertex = Vec3.create(0, 0, 0);
    const b = Vec3.create(1, 0, 0);
    expect(AngleMeasurement.angleBetween(a, vertex, b)).toBe(0);
  });

  it('angle at non-origin vertex', () => {
    // Vertex at (1,1,0), a at (2,1,0), b at (1,2,0) => 90 degrees
    const a = Vec3.create(2, 1, 0);
    const vertex = Vec3.create(1, 1, 0);
    const b = Vec3.create(1, 2, 0);
    expect(AngleMeasurement.angleBetween(a, vertex, b)).toBeCloseTo(Math.PI / 2, 10);
  });

  it('toDegrees converts correctly', () => {
    expect(AngleMeasurement.toDegrees(Math.PI)).toBeCloseTo(180, 10);
    expect(AngleMeasurement.toDegrees(Math.PI / 2)).toBeCloseTo(90, 10);
    expect(AngleMeasurement.toDegrees(0)).toBe(0);
    expect(AngleMeasurement.toDegrees(Math.PI / 4)).toBeCloseTo(45, 10);
  });
});
