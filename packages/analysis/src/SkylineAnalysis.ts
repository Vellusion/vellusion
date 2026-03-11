/**
 * Result of a skyline extraction.
 */
export interface SkylineResult {
  points: Float32Array; // [x0, y0, x1, y1, ...] pairs
}

/**
 * Skyline analysis extracts the silhouette of objects against the sky
 * from a depth buffer. For each column, it finds the topmost
 * non-background pixel.
 */
export class SkylineAnalysis {
  /**
   * Extract skyline from a depth buffer (2D image).
   * For each column, find the topmost non-max-depth pixel.
   *
   * @param depthBuffer - Row-major depth values
   * @param width - Image width in pixels
   * @param height - Image height in pixels
   * @param maxDepth - Depth value representing sky/background (default 1.0)
   * @returns SkylineResult with x,y pairs for each column
   */
  static extract(
    depthBuffer: Float32Array,
    width: number,
    height: number,
    maxDepth: number = 1.0,
  ): SkylineResult {
    const points = new Float32Array(width * 2);

    for (let x = 0; x < width; x++) {
      let skyY = height; // default: bottom
      for (let y = 0; y < height; y++) {
        if (depthBuffer[y * width + x] < maxDepth) {
          skyY = y;
          break;
        }
      }
      points[x * 2] = x;
      points[x * 2 + 1] = skyY;
    }

    return { points };
  }
}
