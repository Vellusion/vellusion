import type { Vec3Type } from '@vellusion/math';

export class HeightMeasurement {
  /**
   * Vertical (radial) distance between two Cartesian ECEF points.
   * Computed as the difference in distance from Earth center.
   * Positive means `to` is farther from center (higher) than `from`.
   */
  static verticalDistance(from: Vec3Type, to: Vec3Type): number {
    const distFrom = Math.sqrt(from[0] ** 2 + from[1] ** 2 + from[2] ** 2);
    const distTo = Math.sqrt(to[0] ** 2 + to[1] ** 2 + to[2] ** 2);
    return distTo - distFrom;
  }

  /**
   * Absolute height difference (always positive).
   */
  static absoluteHeightDifference(from: Vec3Type, to: Vec3Type): number {
    return Math.abs(HeightMeasurement.verticalDistance(from, to));
  }
}
