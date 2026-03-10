import { describe, it, expect } from 'vitest';
import { BoundingSphere } from '../src/BoundingSphere';
import { Plane } from '../src/Plane';
import { Intersect } from '../src/IntersectionTests';
import { Vec3 } from '../src/Vec3';

describe('BoundingSphere', () => {
  describe('create', () => {
    it('should create from center and radius', () => {
      const center = Vec3.create(1, 2, 3);
      const sphere = BoundingSphere.create(center, 5);
      expect(sphere.center[0]).toBe(1);
      expect(sphere.center[1]).toBe(2);
      expect(sphere.center[2]).toBe(3);
      expect(sphere.radius).toBe(5);
    });

    it('should clone the center so mutations do not affect the sphere', () => {
      const center = Vec3.create(1, 2, 3);
      const sphere = BoundingSphere.create(center, 5);
      center[0] = 99;
      expect(sphere.center[0]).toBe(1);
    });
  });

  describe('fromPoints', () => {
    it('should return zero sphere for empty array', () => {
      const sphere = BoundingSphere.fromPoints([]);
      expect(sphere.center[0]).toBe(0);
      expect(sphere.center[1]).toBe(0);
      expect(sphere.center[2]).toBe(0);
      expect(sphere.radius).toBe(0);
    });

    it('should contain all input points', () => {
      const points = [
        Vec3.create(1, 0, 0),
        Vec3.create(-1, 0, 0),
        Vec3.create(0, 2, 0),
        Vec3.create(0, -2, 0),
        Vec3.create(0, 0, 3),
        Vec3.create(0, 0, -3),
      ];
      const sphere = BoundingSphere.fromPoints(points);

      for (const p of points) {
        const dist = Vec3.distance(sphere.center, p);
        expect(dist).toBeLessThanOrEqual(sphere.radius + 1e-10);
      }
    });

    it('should compute a tight sphere for axis-aligned points', () => {
      const points = [
        Vec3.create(1, 0, 0),
        Vec3.create(-1, 0, 0),
      ];
      const sphere = BoundingSphere.fromPoints(points);
      expect(sphere.radius).toBeCloseTo(1);
      expect(sphere.center[0]).toBeCloseTo(0);
    });

    it('should write to result parameter when provided', () => {
      const result: { center: Float64Array; radius: number } = {
        center: Vec3.zero(),
        radius: 0,
      };
      const points = [Vec3.create(5, 0, 0), Vec3.create(-5, 0, 0)];
      const returned = BoundingSphere.fromPoints(points, result);
      expect(returned).toBe(result);
      expect(result.radius).toBeCloseTo(5);
    });
  });

  describe('intersectPlane', () => {
    it('should return OUTSIDE when sphere is entirely on normal side', () => {
      const sphere = BoundingSphere.create(Vec3.create(0, 0, 10), 1);
      const plane = Plane.create(Vec3.create(0, 0, 1), 0); // z = 0
      expect(BoundingSphere.intersectPlane(sphere, plane)).toBe(Intersect.OUTSIDE);
    });

    it('should return INSIDE when sphere is entirely on opposite side', () => {
      const sphere = BoundingSphere.create(Vec3.create(0, 0, -10), 1);
      const plane = Plane.create(Vec3.create(0, 0, 1), 0); // z = 0
      expect(BoundingSphere.intersectPlane(sphere, plane)).toBe(Intersect.INSIDE);
    });

    it('should return INTERSECTING when sphere straddles the plane', () => {
      const sphere = BoundingSphere.create(Vec3.create(0, 0, 0.5), 1);
      const plane = Plane.create(Vec3.create(0, 0, 1), 0); // z = 0
      expect(BoundingSphere.intersectPlane(sphere, plane)).toBe(Intersect.INTERSECTING);
    });
  });

  describe('distanceSquaredTo', () => {
    it('should return 0 when point is inside sphere', () => {
      const sphere = BoundingSphere.create(Vec3.zero(), 5);
      const point = Vec3.create(1, 1, 1);
      expect(BoundingSphere.distanceSquaredTo(sphere, point)).toBe(0);
    });

    it('should return squared surface distance for point outside', () => {
      const sphere = BoundingSphere.create(Vec3.zero(), 1);
      const point = Vec3.create(3, 0, 0);
      // distance from surface = 3 - 1 = 2, squared = 4
      expect(BoundingSphere.distanceSquaredTo(sphere, point)).toBeCloseTo(4);
    });

    it('should return 0 when point is on surface', () => {
      const sphere = BoundingSphere.create(Vec3.zero(), 5);
      const point = Vec3.create(5, 0, 0);
      expect(BoundingSphere.distanceSquaredTo(sphere, point)).toBeCloseTo(0);
    });
  });
});
