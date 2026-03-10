import type { Vec3Type } from './Vec3';
import { Vec3 } from './Vec3';
import type { RayType } from './Ray';
import type { BoundingSphereType } from './BoundingSphere';
import type { PlaneType } from './Plane';
import type { EllipsoidType } from './Ellipsoid';
import { VelMath } from './MathUtils';

export enum Intersect {
  INSIDE = -1,
  INTERSECTING = 0,
  OUTSIDE = 1,
}

export const IntersectionTests = {
  /**
   * Ray-sphere intersection. Returns the nearest positive t, or undefined if no hit.
   */
  raySphere(ray: RayType, sphere: BoundingSphereType): number | undefined {
    const oc = Vec3.subtract(ray.origin, sphere.center, Vec3.zero());
    const a = Vec3.dot(ray.direction, ray.direction);
    const b = 2.0 * Vec3.dot(oc, ray.direction);
    const c = Vec3.dot(oc, oc) - sphere.radius * sphere.radius;
    const discriminant = b * b - 4.0 * a * c;

    if (discriminant < 0.0) {
      return undefined;
    }

    const sqrtD = Math.sqrt(discriminant);
    const t0 = (-b - sqrtD) / (2.0 * a);
    const t1 = (-b + sqrtD) / (2.0 * a);

    if (t0 >= 0.0) return t0;
    if (t1 >= 0.0) return t1;
    return undefined;
  },

  /**
   * Ray-plane intersection. Returns t, or undefined if the ray is parallel to the plane
   * or the intersection is behind the ray.
   */
  rayPlane(ray: RayType, plane: PlaneType): number | undefined {
    const denom = Vec3.dot(plane.normal, ray.direction);
    if (Math.abs(denom) < VelMath.EPSILON15) {
      return undefined;
    }

    const t = -(Vec3.dot(plane.normal, ray.origin) + plane.distance) / denom;
    if (t < 0.0) {
      return undefined;
    }
    return t;
  },

  /**
   * Ray-ellipsoid intersection. Returns { start, stop } parameter values,
   * or undefined if no intersection.
   *
   * The ellipsoid equation is: (x/a)^2 + (y/b)^2 + (z/c)^2 = 1
   * Transform the ray into normalized space by dividing by radii, then test
   * against a unit sphere.
   */
  rayEllipsoid(
    ray: RayType,
    ellipsoid: EllipsoidType,
  ): { start: number; stop: number } | undefined {
    const inverseRadii = ellipsoid.oneOverRadii;

    // Transform ray origin and direction into normalized space
    const origin = Vec3.multiplyComponents(ray.origin, inverseRadii, Vec3.zero());
    const direction = Vec3.multiplyComponents(ray.direction, inverseRadii, Vec3.zero());

    const a = Vec3.dot(direction, direction);
    const b = 2.0 * Vec3.dot(origin, direction);
    const c = Vec3.dot(origin, origin) - 1.0;

    const discriminant = b * b - 4.0 * a * c;
    if (discriminant < 0.0) {
      return undefined;
    }

    const sqrtD = Math.sqrt(discriminant);
    const t0 = (-b - sqrtD) / (2.0 * a);
    const t1 = (-b + sqrtD) / (2.0 * a);

    if (t1 < 0.0) {
      return undefined;
    }

    if (t0 < 0.0) {
      return { start: 0.0, stop: t1 };
    }

    return { start: t0, stop: t1 };
  },

  /**
   * Ray-triangle intersection using the Moller-Trumbore algorithm.
   * Returns t, or undefined if the ray misses the triangle.
   */
  rayTriangle(
    ray: RayType,
    p0: Vec3Type,
    p1: Vec3Type,
    p2: Vec3Type,
  ): number | undefined {
    const edge1 = Vec3.subtract(p1, p0, Vec3.zero());
    const edge2 = Vec3.subtract(p2, p0, Vec3.zero());

    const h = Vec3.cross(ray.direction, edge2, Vec3.zero());
    const a = Vec3.dot(edge1, h);

    if (Math.abs(a) < VelMath.EPSILON15) {
      return undefined; // Ray is parallel to triangle
    }

    const f = 1.0 / a;
    const s = Vec3.subtract(ray.origin, p0, Vec3.zero());
    const u = f * Vec3.dot(s, h);

    if (u < 0.0 || u > 1.0) {
      return undefined;
    }

    const q = Vec3.cross(s, edge1, Vec3.zero());
    const v = f * Vec3.dot(ray.direction, q);

    if (v < 0.0 || u + v > 1.0) {
      return undefined;
    }

    const t = f * Vec3.dot(edge2, q);
    if (t < VelMath.EPSILON15) {
      return undefined;
    }

    return t;
  },
} as const;
