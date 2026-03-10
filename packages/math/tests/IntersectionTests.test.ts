import { describe, it, expect } from 'vitest';
import { IntersectionTests } from '../src/IntersectionTests';
import { Ray } from '../src/Ray';
import { Plane } from '../src/Plane';
import { BoundingSphere } from '../src/BoundingSphere';
import { Ellipsoid } from '../src/Ellipsoid';
import { Vec3 } from '../src/Vec3';

describe('IntersectionTests', () => {
  describe('raySphere', () => {
    it('should hit sphere at (0,0,5) with radius 1 from origin along +Z, t ~ 4', () => {
      const ray = Ray.create(Vec3.zero(), Vec3.create(0, 0, 1));
      const sphere = BoundingSphere.create(Vec3.create(0, 0, 5), 1);
      const t = IntersectionTests.raySphere(ray, sphere);
      expect(t).toBeDefined();
      expect(t!).toBeCloseTo(4);
    });

    it('should return undefined when ray misses sphere', () => {
      const ray = Ray.create(Vec3.zero(), Vec3.create(0, 0, 1));
      const sphere = BoundingSphere.create(Vec3.create(10, 0, 0), 1);
      const t = IntersectionTests.raySphere(ray, sphere);
      expect(t).toBeUndefined();
    });

    it('should return undefined when sphere is behind ray', () => {
      const ray = Ray.create(Vec3.zero(), Vec3.create(0, 0, 1));
      const sphere = BoundingSphere.create(Vec3.create(0, 0, -5), 1);
      const t = IntersectionTests.raySphere(ray, sphere);
      expect(t).toBeUndefined();
    });

    it('should return t when ray origin is inside sphere', () => {
      const ray = Ray.create(Vec3.zero(), Vec3.create(0, 0, 1));
      const sphere = BoundingSphere.create(Vec3.zero(), 5);
      const t = IntersectionTests.raySphere(ray, sphere);
      expect(t).toBeDefined();
      expect(t!).toBeCloseTo(5);
    });
  });

  describe('rayPlane', () => {
    it('should hit plane at angle', () => {
      // Ray from (0, 0, 1) going straight down, plane at z = 0 with normal (0, 0, 1)
      const ray = Ray.create(Vec3.create(0, 0, 1), Vec3.create(0, 0, -1));
      const plane = Plane.create(Vec3.create(0, 0, 1), 0);
      const t = IntersectionTests.rayPlane(ray, plane);
      expect(t).toBeDefined();
      expect(t!).toBeCloseTo(1);
    });

    it('should hit plane at 45 degrees', () => {
      // Ray from (0, 0, 2) going diagonally
      const ray = Ray.create(
        Vec3.create(0, 0, 2),
        Vec3.create(1, 0, -1), // will be normalized in Ray.create
      );
      const plane = Plane.create(Vec3.create(0, 0, 1), 0); // z = 0
      const t = IntersectionTests.rayPlane(ray, plane);
      expect(t).toBeDefined();
      // The hit point should be at z = 0
      const hitPoint = Vec3.zero();
      Ray.getPoint(ray, t!, hitPoint);
      expect(hitPoint[2]).toBeCloseTo(0);
    });

    it('should return undefined when ray is parallel to plane', () => {
      const ray = Ray.create(Vec3.create(0, 0, 1), Vec3.create(1, 0, 0));
      const plane = Plane.create(Vec3.create(0, 0, 1), 0);
      const t = IntersectionTests.rayPlane(ray, plane);
      expect(t).toBeUndefined();
    });

    it('should return undefined when plane is behind ray', () => {
      const ray = Ray.create(Vec3.create(0, 0, 1), Vec3.create(0, 0, 1));
      const plane = Plane.create(Vec3.create(0, 0, 1), 0); // z = 0
      const t = IntersectionTests.rayPlane(ray, plane);
      expect(t).toBeUndefined();
    });
  });

  describe('rayEllipsoid', () => {
    it('should intersect unit sphere from outside', () => {
      const ray = Ray.create(Vec3.create(0, 0, -5), Vec3.create(0, 0, 1));
      const result = IntersectionTests.rayEllipsoid(ray, Ellipsoid.UNIT_SPHERE);
      expect(result).toBeDefined();
      expect(result!.start).toBeCloseTo(4);
      expect(result!.stop).toBeCloseTo(6);
    });

    it('should return undefined when ray misses ellipsoid', () => {
      const ray = Ray.create(Vec3.create(10, 0, 0), Vec3.create(0, 0, 1));
      const result = IntersectionTests.rayEllipsoid(ray, Ellipsoid.UNIT_SPHERE);
      expect(result).toBeUndefined();
    });

    it('should handle ray origin inside ellipsoid (start = 0)', () => {
      const ray = Ray.create(Vec3.zero(), Vec3.create(0, 0, 1));
      const result = IntersectionTests.rayEllipsoid(ray, Ellipsoid.UNIT_SPHERE);
      expect(result).toBeDefined();
      expect(result!.start).toBe(0);
      expect(result!.stop).toBeCloseTo(1);
    });

    it('should work with non-uniform ellipsoid', () => {
      const ellipsoid = Ellipsoid.create(2, 1, 1);
      const ray = Ray.create(Vec3.create(-5, 0, 0), Vec3.create(1, 0, 0));
      const result = IntersectionTests.rayEllipsoid(ray, ellipsoid);
      expect(result).toBeDefined();
      expect(result!.start).toBeCloseTo(3); // hits at x = -2
      expect(result!.stop).toBeCloseTo(7); // exits at x = 2
    });
  });

  describe('rayTriangle', () => {
    it('should hit a triangle', () => {
      const ray = Ray.create(Vec3.create(0.25, 0.25, -1), Vec3.create(0, 0, 1));
      const p0 = Vec3.create(0, 0, 0);
      const p1 = Vec3.create(1, 0, 0);
      const p2 = Vec3.create(0, 1, 0);
      const t = IntersectionTests.rayTriangle(ray, p0, p1, p2);
      expect(t).toBeDefined();
      expect(t!).toBeCloseTo(1);
    });

    it('should miss a triangle', () => {
      const ray = Ray.create(Vec3.create(5, 5, -1), Vec3.create(0, 0, 1));
      const p0 = Vec3.create(0, 0, 0);
      const p1 = Vec3.create(1, 0, 0);
      const p2 = Vec3.create(0, 1, 0);
      const t = IntersectionTests.rayTriangle(ray, p0, p1, p2);
      expect(t).toBeUndefined();
    });

    it('should return undefined when ray is parallel to triangle', () => {
      const ray = Ray.create(Vec3.create(0, 0, 1), Vec3.create(1, 0, 0));
      const p0 = Vec3.create(0, 0, 0);
      const p1 = Vec3.create(1, 0, 0);
      const p2 = Vec3.create(0, 1, 0);
      const t = IntersectionTests.rayTriangle(ray, p0, p1, p2);
      expect(t).toBeUndefined();
    });

    it('should return undefined when triangle is behind ray', () => {
      const ray = Ray.create(Vec3.create(0.25, 0.25, 1), Vec3.create(0, 0, 1));
      const p0 = Vec3.create(0, 0, 0);
      const p1 = Vec3.create(1, 0, 0);
      const p2 = Vec3.create(0, 1, 0);
      const t = IntersectionTests.rayTriangle(ray, p0, p1, p2);
      expect(t).toBeUndefined();
    });
  });
});

describe('Ray', () => {
  it('should normalize direction on create', () => {
    const ray = Ray.create(Vec3.zero(), Vec3.create(0, 0, 5));
    expect(ray.direction[0]).toBeCloseTo(0);
    expect(ray.direction[1]).toBeCloseTo(0);
    expect(ray.direction[2]).toBeCloseTo(1);
  });

  it('getPoint should compute origin + t * direction', () => {
    const ray = Ray.create(Vec3.create(1, 2, 3), Vec3.create(0, 0, 1));
    const result = Vec3.zero();
    Ray.getPoint(ray, 5, result);
    expect(result[0]).toBeCloseTo(1);
    expect(result[1]).toBeCloseTo(2);
    expect(result[2]).toBeCloseTo(8);
  });
});

describe('Plane', () => {
  it('should create from normal and distance', () => {
    const plane = Plane.create(Vec3.create(0, 1, 0), -5);
    expect(plane.normal[1]).toBe(1);
    expect(plane.distance).toBe(-5);
  });

  it('fromPointNormal should compute correct distance', () => {
    // Point (0, 5, 0) with normal (0, 1, 0) -> distance = -5
    const plane = Plane.fromPointNormal(
      Vec3.create(0, 5, 0),
      Vec3.create(0, 1, 0),
    );
    expect(plane.distance).toBeCloseTo(-5);
  });

  it('getPointDistance should return signed distance', () => {
    const plane = Plane.create(Vec3.create(0, 0, 1), 0); // z = 0
    expect(Plane.getPointDistance(plane, Vec3.create(0, 0, 5))).toBeCloseTo(5);
    expect(Plane.getPointDistance(plane, Vec3.create(0, 0, -3))).toBeCloseTo(-3);
    expect(Plane.getPointDistance(plane, Vec3.create(0, 0, 0))).toBeCloseTo(0);
  });

  it('fromPointNormal should write to result when provided', () => {
    const result: { normal: Float64Array; distance: number } = {
      normal: Vec3.zero(),
      distance: 0,
    };
    const returned = Plane.fromPointNormal(
      Vec3.create(0, 0, 3),
      Vec3.create(0, 0, 1),
      result,
    );
    expect(returned).toBe(result);
    expect(result.distance).toBeCloseTo(-3);
  });
});
