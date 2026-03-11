import type { CartographicType, Vec3Type } from '@vellusion/math';

export class AreaMeasurement {
  /**
   * Spherical polygon area using the shoelace-like formula on a sphere.
   * Positions are CartographicType (longitude, latitude in radians).
   * Returns area in square meters.
   */
  static sphericalArea(positions: CartographicType[]): number {
    const R = 6371008.8;
    const n = positions.length;
    if (n < 3) return 0;

    // Trapezoidal spherical area formula
    let sum = 0;
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      const lon1 = positions[i][0], lat1 = positions[i][1];
      const lon2 = positions[j][0], lat2 = positions[j][1];
      sum += (lon2 - lon1) * (2 + Math.sin(lat1) + Math.sin(lat2));
    }
    return Math.abs(sum * R * R / 2);
  }

  /**
   * Planar area of a 3D polygon using Newell's method (cross product).
   * Returns area in the same units squared as the input coordinates.
   */
  static planarArea(positions: Vec3Type[]): number {
    if (positions.length < 3) return 0;
    // Newell's method for polygon area
    let nx = 0, ny = 0, nz = 0;
    for (let i = 0; i < positions.length; i++) {
      const j = (i + 1) % positions.length;
      const ci = positions[i], cj = positions[j];
      nx += (ci[1] - cj[1]) * (ci[2] + cj[2]);
      ny += (ci[2] - cj[2]) * (ci[0] + cj[0]);
      nz += (ci[0] - cj[0]) * (ci[1] + cj[1]);
    }
    return Math.sqrt(nx * nx + ny * ny + nz * nz) / 2;
  }
}
