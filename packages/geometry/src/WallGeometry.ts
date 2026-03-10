import type { Geometry } from './Geometry';

export interface WallGeometryOptions {
  positions: Float64Array;     // xyz polyline (flat, 3 per vertex)
  maximumHeights?: number[];   // top heights per vertex
  minimumHeights?: number[];   // bottom heights per vertex (default 0)
}

/**
 * Generates a vertical wall geometry from a polyline.
 *
 * For each segment between consecutive points, creates a vertical quad
 * (4 vertices, 6 indices). Height offsets are applied along the
 * normalized position direction (radial for globe-centric coordinates).
 */
export const WallGeometry = {
  create(options: WallGeometryOptions): Geometry {
    const { positions, maximumHeights, minimumHeights } = options;
    const pointCount = positions.length / 3;

    if (pointCount < 2) {
      return {
        attributes: {
          position: {
            values: new Float32Array(0),
            componentsPerAttribute: 3,
            componentDatatype: 'float32',
          },
        },
        indices: new Uint16Array(0),
        primitiveType: 'triangles',
      };
    }

    const segmentCount = pointCount - 1;
    // Each segment produces a quad: 4 vertices, 6 indices
    const vertexCount = segmentCount * 4;
    const indexCount = segmentCount * 6;
    const posValues = new Float32Array(vertexCount * 3);
    const normals = new Float32Array(vertexCount * 3);
    const allIndices: number[] = [];

    for (let seg = 0; seg < segmentCount; seg++) {
      const i0 = seg;
      const i1 = seg + 1;
      const base = seg * 4;

      // Radial direction (up) for each endpoint
      // Use normalized position as approximate radial direction
      const p0x = positions[i0 * 3], p0y = positions[i0 * 3 + 1], p0z = positions[i0 * 3 + 2];
      const p1x = positions[i1 * 3], p1y = positions[i1 * 3 + 1], p1z = positions[i1 * 3 + 2];

      const p0Len = Math.sqrt(p0x * p0x + p0y * p0y + p0z * p0z);
      const up0x = p0Len > 0 ? p0x / p0Len : 0;
      const up0y = p0Len > 0 ? p0y / p0Len : 0;
      const up0z = p0Len > 0 ? p0z / p0Len : 1;

      const p1Len = Math.sqrt(p1x * p1x + p1y * p1y + p1z * p1z);
      const up1x = p1Len > 0 ? p1x / p1Len : 0;
      const up1y = p1Len > 0 ? p1y / p1Len : 0;
      const up1z = p1Len > 0 ? p1z / p1Len : 1;

      const maxH0 = maximumHeights ? maximumHeights[i0] : 0;
      const maxH1 = maximumHeights ? maximumHeights[i1] : 0;
      const minH0 = minimumHeights ? minimumHeights[i0] : 0;
      const minH1 = minimumHeights ? minimumHeights[i1] : 0;

      // Top-left (vertex 0): start point at max height
      posValues[(base + 0) * 3] = p0x + up0x * maxH0;
      posValues[(base + 0) * 3 + 1] = p0y + up0y * maxH0;
      posValues[(base + 0) * 3 + 2] = p0z + up0z * maxH0;

      // Top-right (vertex 1): end point at max height
      posValues[(base + 1) * 3] = p1x + up1x * maxH1;
      posValues[(base + 1) * 3 + 1] = p1y + up1y * maxH1;
      posValues[(base + 1) * 3 + 2] = p1z + up1z * maxH1;

      // Bottom-right (vertex 2): end point at min height
      posValues[(base + 2) * 3] = p1x + up1x * minH1;
      posValues[(base + 2) * 3 + 1] = p1y + up1y * minH1;
      posValues[(base + 2) * 3 + 2] = p1z + up1z * minH1;

      // Bottom-left (vertex 3): start point at min height
      posValues[(base + 3) * 3] = p0x + up0x * minH0;
      posValues[(base + 3) * 3 + 1] = p0y + up0y * minH0;
      posValues[(base + 3) * 3 + 2] = p0z + up0z * minH0;

      // Wall face normal: perpendicular to segment direction and up
      // Segment direction
      const sdx = p1x - p0x;
      const sdy = p1y - p0y;
      const sdz = p1z - p0z;

      // Average up
      const avgUpX = (up0x + up1x) * 0.5;
      const avgUpY = (up0y + up1y) * 0.5;
      const avgUpZ = (up0z + up1z) * 0.5;

      // Normal = cross(segmentDir, averageUp)
      let nx = sdy * avgUpZ - sdz * avgUpY;
      let ny = sdz * avgUpX - sdx * avgUpZ;
      let nz = sdx * avgUpY - sdy * avgUpX;
      const nLen = Math.sqrt(nx * nx + ny * ny + nz * nz);
      if (nLen > 0) { nx /= nLen; ny /= nLen; nz /= nLen; }

      for (let k = 0; k < 4; k++) {
        normals[(base + k) * 3] = nx;
        normals[(base + k) * 3 + 1] = ny;
        normals[(base + k) * 3 + 2] = nz;
      }

      // Two triangles for the quad
      allIndices.push(base, base + 1, base + 2);
      allIndices.push(base, base + 2, base + 3);
    }

    const indices = indexCount > 65535
      ? new Uint32Array(allIndices)
      : new Uint16Array(allIndices);

    return {
      attributes: {
        position: {
          values: posValues,
          componentsPerAttribute: 3,
          componentDatatype: 'float32',
        },
        normal: {
          values: normals,
          componentsPerAttribute: 3,
          componentDatatype: 'float32',
        },
      },
      indices,
      primitiveType: 'triangles',
    };
  },
} as const;
