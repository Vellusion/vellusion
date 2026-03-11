import type { TerrainSampler } from './TerrainSampler';

/**
 * Result of a terrain profile analysis along a path.
 */
export interface ProfileResult {
  distances: Float64Array;
  heights: Float64Array;
  totalDistance: number;
}

/**
 * Profile analysis generates an elevation profile along a path
 * defined by a sequence of geographic positions.
 */
export class ProfileAnalysis {
  /**
   * Generate an elevation profile along a path.
   *
   * @param positions - Array of [lon, lat] pairs in radians
   * @param terrainSampler - Terrain height sampler
   * @param sampleCount - Number of evenly-spaced samples along the path
   * @returns ProfileResult with distances and heights arrays
   */
  static generateProfile(
    positions: Float64Array[],
    terrainSampler: TerrainSampler,
    sampleCount: number = 100,
  ): ProfileResult {
    // Total approximate distance
    let totalDist = 0;
    const segDistances: number[] = [0];
    for (let i = 1; i < positions.length; i++) {
      const dlon = positions[i][0] - positions[i - 1][0];
      const dlat = positions[i][1] - positions[i - 1][1];
      totalDist += Math.sqrt(dlon * dlon + dlat * dlat) * 6371008.8;
      segDistances.push(totalDist);
    }

    const distances = new Float64Array(sampleCount);
    const heights = new Float64Array(sampleCount);

    for (let s = 0; s < sampleCount; s++) {
      const d = (s / (sampleCount - 1)) * totalDist;
      distances[s] = d;

      // Find segment
      let seg = 0;
      for (let i = 1; i < segDistances.length; i++) {
        if (d <= segDistances[i]) {
          seg = i - 1;
          break;
        }
      }
      const segLen = segDistances[seg + 1] - segDistances[seg];
      const t = segLen > 0 ? (d - segDistances[seg]) / segLen : 0;
      const lon =
        positions[seg][0] + (positions[seg + 1][0] - positions[seg][0]) * t;
      const lat =
        positions[seg][1] + (positions[seg + 1][1] - positions[seg][1]) * t;
      heights[s] = terrainSampler.getHeight(lon, lat);
    }

    return { distances, heights, totalDistance: totalDist };
  }
}
