/**
 * Interface for sampling terrain height at geographic coordinates.
 * Used by analysis tools that need terrain elevation data.
 */
export interface TerrainSampler {
  getHeight(longitude: number, latitude: number): number;
}
