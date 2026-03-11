/**
 * Result of a cut/fill volume analysis.
 */
export interface CutFillResult {
  cutVolume: number;
  fillVolume: number;
  netVolume: number;
}

/**
 * Cut/fill analysis compares an existing terrain surface against
 * a design surface to compute earthwork volumes.
 */
export class CutFillAnalysis {
  /**
   * Analyze cut and fill volumes between existing and design surfaces.
   *
   * @param existingGrid - Current terrain heights (row-major)
   * @param designGrid - Proposed design heights (row-major)
   * @param width - Number of columns
   * @param height - Number of rows
   * @param cellSize - Distance between cell centers in meters
   * @returns CutFillResult with cut, fill, and net volumes in cubic meters
   */
  static analyze(
    existingGrid: Float32Array,
    designGrid: Float32Array,
    width: number,
    height: number,
    cellSize: number,
  ): CutFillResult {
    let cut = 0;
    let fill = 0;
    const cellArea = cellSize * cellSize;

    for (let i = 0; i < width * height; i++) {
      const diff = designGrid[i] - existingGrid[i];
      if (diff > 0) {
        fill += diff * cellArea;
      } else {
        cut += Math.abs(diff) * cellArea;
      }
    }

    return { cutVolume: cut, fillVolume: fill, netVolume: fill - cut };
  }
}
