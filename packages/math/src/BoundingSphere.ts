import type { Vec3Type } from './Vec3';
import { Vec3 } from './Vec3';
import type { PlaneType } from './Plane';
import { Plane } from './Plane';
import { Intersect } from './IntersectionTests';

export type BoundingSphereType = {
  center: Vec3Type;
  radius: number;
};

export const BoundingSphere = {
  create(center: Vec3Type, radius: number): BoundingSphereType {
    return {
      center: Vec3.clone(center),
      radius,
    };
  },

  /**
   * Compute a bounding sphere from a list of points using Ritter's algorithm.
   */
  fromPoints(points: Vec3Type[], result?: BoundingSphereType): BoundingSphereType {
    if (points.length === 0) {
      const r = result ?? { center: Vec3.zero(), radius: 0 };
      r.center[0] = 0; r.center[1] = 0; r.center[2] = 0;
      r.radius = 0;
      return r;
    }

    // Step 1: Find the two most separated points along each axis
    // to get an initial bounding sphere.
    let minX = points[0], maxX = points[0];
    let minY = points[0], maxY = points[0];
    let minZ = points[0], maxZ = points[0];

    for (let i = 1; i < points.length; i++) {
      const p = points[i];
      if (p[0] < minX[0]) minX = p;
      if (p[0] > maxX[0]) maxX = p;
      if (p[1] < minY[1]) minY = p;
      if (p[1] > maxY[1]) maxY = p;
      if (p[2] < minZ[2]) minZ = p;
      if (p[2] > maxZ[2]) maxZ = p;
    }

    const dX = Vec3.magnitudeSquared(
      Vec3.subtract(maxX, minX, Vec3.zero()),
    );
    const dY = Vec3.magnitudeSquared(
      Vec3.subtract(maxY, minY, Vec3.zero()),
    );
    const dZ = Vec3.magnitudeSquared(
      Vec3.subtract(maxZ, minZ, Vec3.zero()),
    );

    let p1: Vec3Type;
    let p2: Vec3Type;
    if (dX >= dY && dX >= dZ) {
      p1 = minX; p2 = maxX;
    } else if (dY >= dX && dY >= dZ) {
      p1 = minY; p2 = maxY;
    } else {
      p1 = minZ; p2 = maxZ;
    }

    // Initial sphere: center at midpoint, radius = half distance
    const center = Vec3.zero();
    Vec3.add(p1, p2, center);
    Vec3.scale(center, 0.5, center);
    let radius = Vec3.distance(p2, center);

    // Step 2: Expand sphere to include all points
    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      const dist = Vec3.distance(center, p);
      if (dist > radius) {
        const newRadius = (radius + dist) * 0.5;
        const offset = dist - newRadius;
        // Move center toward p
        center[0] = (newRadius * center[0] + offset * p[0]) / dist;
        center[1] = (newRadius * center[1] + offset * p[1]) / dist;
        center[2] = (newRadius * center[2] + offset * p[2]) / dist;
        radius = newRadius;
      }
    }

    if (result) {
      result.center[0] = center[0];
      result.center[1] = center[1];
      result.center[2] = center[2];
      result.radius = radius;
      return result;
    }

    return { center, radius };
  },

  /**
   * Determine the relative position of a bounding sphere with respect to a plane.
   */
  intersectPlane(sphere: BoundingSphereType, plane: PlaneType): Intersect {
    const signedDistance = Plane.getPointDistance(plane, sphere.center);
    if (signedDistance > sphere.radius) {
      return Intersect.OUTSIDE;
    }
    if (signedDistance < -sphere.radius) {
      return Intersect.INSIDE;
    }
    return Intersect.INTERSECTING;
  },

  /**
   * Compute the squared distance from the surface of a bounding sphere to a point.
   */
  distanceSquaredTo(sphere: BoundingSphereType, point: Vec3Type): number {
    const dist = Vec3.distance(sphere.center, point) - sphere.radius;
    if (dist <= 0) {
      return 0;
    }
    return dist * dist;
  },
} as const;
