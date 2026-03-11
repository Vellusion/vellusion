import type { TerrainSampler } from '../TerrainSampler';
import { LineOfSight } from './LineOfSight';

/**
 * Result of a viewshed analysis containing a grid of visibility values.
 */
export interface ViewshedResult {
  width: number;
  height: number;
  visibility: Uint8Array; // 0=not visible, 1=visible
}

/**
 * Viewshed analysis computes visibility from an observation point
 * across a field-of-view area, producing a grid where each cell
 * indicates whether it is visible from the observation point.
 */
export class Viewshed {
  /**
   * Compute viewshed from an observation point.
   * Generates a grid of visibility values.
   */
  static analyze(
    origin: Float64Array, // [lon, lat, height]
    terrainSampler: TerrainSampler,
    options: {
      horizontalFov: number; // radians
      verticalFov: number; // radians
      direction: number; // azimuth in radians (0=north)
      distance: number; // max distance in meters
      resolution: number; // grid cells per side
    },
  ): ViewshedResult {
    const { horizontalFov, direction, distance, resolution } = options;
    const width = resolution;
    const height = resolution;
    const visibility = new Uint8Array(width * height);

    const metersPerDeg = 111320; // approximate meters per degree at equator
    const distRad = distance / (metersPerDeg * (180 / Math.PI));

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        // Map grid to angular offset from direction
        const azOffset = (x / (width - 1) - 0.5) * horizontalFov;
        const distFrac = (y + 1) / height;
        const az = direction + azOffset;
        const d = distRad * distFrac;

        const targetLon = origin[0] + d * Math.sin(az);
        const targetLat = origin[1] + d * Math.cos(az);
        const targetHeight = terrainSampler.getHeight(targetLon, targetLat);

        // Simple LOS check
        const los = LineOfSight.analyze(
          origin,
          new Float64Array([targetLon, targetLat, targetHeight]),
          terrainSampler,
          20, // reduced samples for performance
        );

        visibility[y * width + x] = los.isVisible ? 1 : 0;
      }
    }

    return { width, height, visibility };
  }
}
