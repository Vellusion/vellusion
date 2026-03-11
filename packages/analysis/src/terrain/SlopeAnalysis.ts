/**
 * Slope analysis using the Horn (Sobel) method on a height grid.
 * Computes the slope angle at each cell from a 3x3 neighborhood.
 */
export class SlopeAnalysis {
  /**
   * Compute slope angle (radians) at each cell from a height grid.
   * Uses 3x3 Sobel/Horn method. Edge cells are left as zero.
   *
   * @param heightGrid - Row-major height values
   * @param width - Number of columns
   * @param height - Number of rows
   * @param cellSize - Distance between cell centers in meters
   * @returns Float32Array of slope angles in radians
   */
  static analyze(
    heightGrid: Float32Array,
    width: number,
    height: number,
    cellSize: number,
  ): Float32Array {
    const result = new Float32Array(width * height);

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x;

        // 3x3 neighborhood
        const a = heightGrid[(y - 1) * width + (x - 1)];
        const b = heightGrid[(y - 1) * width + x];
        const c = heightGrid[(y - 1) * width + (x + 1)];
        const d = heightGrid[y * width + (x - 1)];
        const f = heightGrid[y * width + (x + 1)];
        const g = heightGrid[(y + 1) * width + (x - 1)];
        const h = heightGrid[(y + 1) * width + x];
        const i = heightGrid[(y + 1) * width + (x + 1)];

        // Sobel dz/dx and dz/dy
        const dzdx = (c + 2 * f + i - (a + 2 * d + g)) / (8 * cellSize);
        const dzdy = (g + 2 * h + i - (a + 2 * b + c)) / (8 * cellSize);

        result[idx] = Math.atan(Math.sqrt(dzdx * dzdx + dzdy * dzdy));
      }
    }

    return result;
  }
}
