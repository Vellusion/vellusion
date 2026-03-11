/**
 * Aspect analysis using the Horn method on a height grid.
 * Computes the downslope direction at each cell.
 */
export class AspectAnalysis {
  /**
   * Compute aspect direction (radians, 0=North, clockwise) at each cell.
   * Returns -1 for flat cells. Edge cells are left as -1.
   *
   * @param heightGrid - Row-major height values
   * @param width - Number of columns
   * @param height - Number of rows
   * @param cellSize - Distance between cell centers in meters
   * @returns Float32Array of aspect angles in radians (-1 for flat)
   */
  static analyze(
    heightGrid: Float32Array,
    width: number,
    height: number,
    cellSize: number,
  ): Float32Array {
    const result = new Float32Array(width * height);
    result.fill(-1); // -1 = flat

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

        if (dzdx === 0 && dzdy === 0) {
          result[idx] = -1; // flat
        } else {
          let aspect = Math.atan2(-dzdy, dzdx);
          if (aspect < 0) aspect += 2 * Math.PI;
          result[idx] = aspect;
        }
      }
    }

    return result;
  }
}
