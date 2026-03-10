import type { Vec3Type } from './Vec3';
import { Vec3 } from './Vec3';

export type PlaneType = {
  normal: Vec3Type;
  distance: number;
};

export const Plane = {
  /**
   * Create a plane from a unit normal and signed distance from origin.
   */
  create(normal: Vec3Type, distance: number): PlaneType {
    return {
      normal: Vec3.clone(normal),
      distance,
    };
  },

  /**
   * Create a plane from a point on the plane and a normal.
   * distance = -dot(normal, point)
   */
  fromPointNormal(point: Vec3Type, normal: Vec3Type, result?: PlaneType): PlaneType {
    const d = -Vec3.dot(normal, point);
    if (result) {
      result.normal[0] = normal[0];
      result.normal[1] = normal[1];
      result.normal[2] = normal[2];
      result.distance = d;
      return result;
    }
    return {
      normal: Vec3.clone(normal),
      distance: d,
    };
  },

  /**
   * Signed distance from a point to a plane.
   * Positive = same side as normal, negative = opposite side.
   */
  getPointDistance(plane: PlaneType, point: Vec3Type): number {
    return Vec3.dot(plane.normal, point) + plane.distance;
  },
} as const;
