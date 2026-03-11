import type { TerrainSampler } from '../TerrainSampler';

/**
 * Result of a line-of-sight analysis between two points.
 */
export interface LineOfSightResult {
  isVisible: boolean;
  obstructionPoint: Float64Array | null; // [x, y, z] if obstructed
  distance: number;
}

/**
 * Line-of-sight analysis between two geographic points.
 * Samples terrain along the line connecting origin and target
 * to determine if the target is visible from the origin.
 */
export class LineOfSight {
  /**
   * Check if target is visible from origin by sampling terrain along the line.
   * Both origin/target are [lon, lat, height] in radians/meters.
   */
  static analyze(
    origin: Float64Array, // [lon, lat, height]
    target: Float64Array, // [lon, lat, height]
    terrainSampler: TerrainSampler,
    sampleCount: number = 100,
  ): LineOfSightResult {
    const totalDist =
      Math.sqrt(
        (target[0] - origin[0]) ** 2 + (target[1] - origin[1]) ** 2,
      ) * 6371008.8; // approximate arc distance

    for (let i = 1; i < sampleCount; i++) {
      const t = i / sampleCount;
      const lon = origin[0] + (target[0] - origin[0]) * t;
      const lat = origin[1] + (target[1] - origin[1]) * t;
      const lineHeight = origin[2] + (target[2] - origin[2]) * t;
      const terrainHeight = terrainSampler.getHeight(lon, lat);

      if (terrainHeight > lineHeight) {
        return {
          isVisible: false,
          obstructionPoint: new Float64Array([lon, lat, terrainHeight]),
          distance: totalDist * t,
        };
      }
    }

    return { isVisible: true, obstructionPoint: null, distance: totalDist };
  }
}
