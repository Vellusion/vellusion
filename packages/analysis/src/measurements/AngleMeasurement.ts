import type { Vec3Type } from '@vellusion/math';

export class AngleMeasurement {
  /**
   * Angle between two rays meeting at a vertex (in radians).
   * Computes acos(dot(a-vertex, b-vertex) / (|a-vertex| * |b-vertex|)).
   * Returns 0 if either ray has zero length.
   */
  static angleBetween(a: Vec3Type, vertex: Vec3Type, b: Vec3Type): number {
    const ax = a[0] - vertex[0], ay = a[1] - vertex[1], az = a[2] - vertex[2];
    const bx = b[0] - vertex[0], by = b[1] - vertex[1], bz = b[2] - vertex[2];
    const dot = ax * bx + ay * by + az * bz;
    const lenA = Math.sqrt(ax * ax + ay * ay + az * az);
    const lenB = Math.sqrt(bx * bx + by * by + bz * bz);
    if (lenA === 0 || lenB === 0) return 0;
    return Math.acos(Math.max(-1, Math.min(1, dot / (lenA * lenB))));
  }

  /**
   * Convert radians to degrees.
   */
  static toDegrees(radians: number): number {
    return radians * 180 / Math.PI;
  }
}
