/**
 * Represents a single contour line at a specific elevation.
 */
export interface ContourLine {
  elevation: number;
  segments: Float64Array; // pairs of [x1,y1, x2,y2, ...] line segments
}

/**
 * Generates contour lines from a height grid using the marching squares algorithm.
 */
export class ContourGenerator {
  /**
   * Generate contour lines from a height grid.
   *
   * @param heightGrid - Row-major height values
   * @param width - Number of columns
   * @param height - Number of rows
   * @param cellSize - Distance between cell centers in meters
   * @param interval - Elevation interval between contour lines
   * @returns Array of ContourLine objects
   */
  static generate(
    heightGrid: Float32Array,
    width: number,
    height: number,
    cellSize: number,
    interval: number,
  ): ContourLine[] {
    let minH = Infinity;
    let maxH = -Infinity;
    for (let k = 0; k < heightGrid.length; k++) {
      if (heightGrid[k] < minH) minH = heightGrid[k];
      if (heightGrid[k] > maxH) maxH = heightGrid[k];
    }

    const contours: ContourLine[] = [];

    for (
      let elev = Math.ceil(minH / interval) * interval;
      elev <= maxH;
      elev += interval
    ) {
      const segments: number[] = [];

      for (let y = 0; y < height - 1; y++) {
        for (let x = 0; x < width - 1; x++) {
          const tl = heightGrid[y * width + x];
          const tr = heightGrid[y * width + (x + 1)];
          const br = heightGrid[(y + 1) * width + (x + 1)];
          const bl = heightGrid[(y + 1) * width + x];

          // Classify corners: above or below contour level
          const code =
            (tl >= elev ? 8 : 0) |
            (tr >= elev ? 4 : 0) |
            (br >= elev ? 2 : 0) |
            (bl >= elev ? 1 : 0);
          if (code === 0 || code === 15) continue;

          // Interpolate edge crossings
          const lerp = (v0: number, v1: number) =>
            v0 === v1 ? 0.5 : (elev - v0) / (v1 - v0);
          const top: [number, number] = [x + lerp(tl, tr), y];
          const right: [number, number] = [x + 1, y + lerp(tr, br)];
          const bottom: [number, number] = [x + lerp(bl, br), y + 1];
          const left: [number, number] = [x, y + lerp(tl, bl)];

          // Add segments based on marching squares lookup
          const addSeg = (p1: [number, number], p2: [number, number]) => {
            segments.push(
              p1[0] * cellSize,
              p1[1] * cellSize,
              p2[0] * cellSize,
              p2[1] * cellSize,
            );
          };

          switch (code) {
            case 1:
            case 14:
              addSeg(left, bottom);
              break;
            case 2:
            case 13:
              addSeg(bottom, right);
              break;
            case 3:
            case 12:
              addSeg(left, right);
              break;
            case 4:
            case 11:
              addSeg(top, right);
              break;
            case 6:
            case 9:
              addSeg(top, bottom);
              break;
            case 7:
            case 8:
              addSeg(top, left);
              break;
            case 5:
              addSeg(top, right);
              addSeg(left, bottom);
              break;
            case 10:
              addSeg(top, left);
              addSeg(bottom, right);
              break;
          }
        }
      }

      if (segments.length > 0) {
        contours.push({
          elevation: elev,
          segments: new Float64Array(segments),
        });
      }
    }

    return contours;
  }
}
