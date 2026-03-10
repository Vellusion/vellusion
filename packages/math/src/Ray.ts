import type { Vec3Type } from './Vec3';
import { Vec3 } from './Vec3';

export type RayType = {
  origin: Vec3Type;
  direction: Vec3Type;
};

export const Ray = {
  /**
   * Create a ray from an origin and a unit direction.
   */
  create(origin: Vec3Type, direction: Vec3Type): RayType {
    return {
      origin: Vec3.clone(origin),
      direction: Vec3.normalize(direction, Vec3.zero()),
    };
  },

  /**
   * Compute the point on the ray at parameter t: origin + t * direction.
   */
  getPoint(ray: RayType, t: number, result: Vec3Type): Vec3Type {
    result[0] = ray.origin[0] + t * ray.direction[0];
    result[1] = ray.origin[1] + t * ray.direction[1];
    result[2] = ray.origin[2] + t * ray.direction[2];
    return result;
  },
} as const;
