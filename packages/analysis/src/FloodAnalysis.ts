/**
 * Flood analysis determines which cells in a height grid would be
 * inundated at a given water level.
 */
export class FloodAnalysis {
  /**
   * Analyze flooding at a given water level.
   *
   * @param heightGrid - Row-major height values
   * @param width - Number of columns
   * @param height - Number of rows
   * @param waterLevel - Water elevation in meters
   * @returns Uint8Array where 1=flooded, 0=dry
   */
  static analyze(
    heightGrid: Float32Array,
    width: number,
    height: number,
    waterLevel: number,
  ): Uint8Array {
    const result = new Uint8Array(width * height);
    for (let i = 0; i < heightGrid.length; i++) {
      result[i] = heightGrid[i] <= waterLevel ? 1 : 0;
    }
    return result;
  }
}
