import { Ellipsoid, Cartographic } from '@vellusion/math';
import type { CartographicType, Vec3Type } from '@vellusion/math';

export class DistanceMeasurement {
  /**
   * Geodesic distance using the Haversine formula (spherical approximation).
   * Positions are CartographicType (longitude, latitude in radians, height).
   */
  static geodesicDistance(from: CartographicType, to: CartographicType): number {
    const R = 6371008.8; // mean Earth radius in meters
    const lat1 = from[1], lon1 = from[0];
    const lat2 = to[1], lon2 = to[0];
    const dLat = lat2 - lat1;
    const dLon = lon2 - lon1;
    const a = Math.sin(dLat / 2) ** 2 +
              Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Euclidean 3D distance between two Cartesian points.
   */
  static straightLineDistance(from: Vec3Type, to: Vec3Type): number {
    const dx = to[0] - from[0];
    const dy = to[1] - from[1];
    const dz = to[2] - from[2];
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  /**
   * Total distance along a polyline.
   * In 'straight' mode, positions are Cartesian Vec3.
   * In 'geodesic' mode, positions are Cartesian Vec3 and are converted
   * to CartographicType via WGS84 for Haversine computation.
   */
  static polylineDistance(positions: Vec3Type[], mode: 'geodesic' | 'straight' = 'straight'): number {
    let total = 0;
    for (let i = 1; i < positions.length; i++) {
      if (mode === 'straight') {
        total += DistanceMeasurement.straightLineDistance(positions[i - 1], positions[i]);
      } else {
        const fromCarto = Cartographic.create();
        const toCarto = Cartographic.create();
        Ellipsoid.cartesianToCartographic(Ellipsoid.WGS84, positions[i - 1], fromCarto);
        Ellipsoid.cartesianToCartographic(Ellipsoid.WGS84, positions[i], toCarto);
        total += DistanceMeasurement.geodesicDistance(fromCarto, toCarto);
      }
    }
    return total;
  }
}
