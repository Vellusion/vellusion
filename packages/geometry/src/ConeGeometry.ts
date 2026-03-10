import type { Geometry } from './Geometry';
import { CylinderGeometry } from './CylinderGeometry';

export interface ConeGeometryOptions {
  radius?: number;
  height?: number;
  sliceCount?: number;
}

/**
 * Generates a cone geometry centered at the origin, extending along the Y axis.
 *
 * Implemented as a cylinder with topRadius = 0.
 */
export const ConeGeometry = {
  create(options?: ConeGeometryOptions): Geometry {
    return CylinderGeometry.create({
      topRadius: 0,
      bottomRadius: options?.radius ?? 1,
      height: options?.height ?? 1,
      sliceCount: options?.sliceCount ?? 32,
    });
  },
} as const;
