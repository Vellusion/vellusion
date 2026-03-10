import type { Geometry } from './Geometry';

export interface PolylineGeometryOptions {
  positions: Float64Array;  // flat xyz, 3 per vertex
  width?: number;           // default 1.0
}

/**
 * Generates a flat ribbon mesh along a polyline path.
 *
 * For each segment, creates 4 vertices (2 on each side of the line)
 * connected with miter joins at segment boundaries.
 */
export const PolylineGeometry = {
  create(options: PolylineGeometryOptions): Geometry {
    const { positions, width = 1.0 } = options;
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

    const halfWidth = width / 2.0;
    const segmentCount = pointCount - 1;

    // Each segment produces 4 vertices and 6 indices (2 triangles)
    const vertexCount = segmentCount * 4;
    const indexCount = segmentCount * 6;
    const posValues = new Float32Array(vertexCount * 3);
    const normals = new Float32Array(vertexCount * 3);
    const allIndices: number[] = [];

    // Approximate up vector - use (0,0,1) if positions are mostly horizontal,
    // otherwise use (0,1,0)
    const approxUp = [0, 0, 1];

    for (let seg = 0; seg < segmentCount; seg++) {
      const i0 = seg;
      const i1 = seg + 1;
      const base = seg * 4;

      // Segment direction
      const dx = positions[i1 * 3] - positions[i0 * 3];
      const dy = positions[i1 * 3 + 1] - positions[i0 * 3 + 1];
      const dz = positions[i1 * 3 + 2] - positions[i0 * 3 + 2];
      const segLen = Math.sqrt(dx * dx + dy * dy + dz * dz);
      const dirX = segLen > 0 ? dx / segLen : 1;
      const dirY = segLen > 0 ? dy / segLen : 0;
      const dirZ = segLen > 0 ? dz / segLen : 0;

      // Normal = cross(segmentDir, approxUp)
      let nx = dirY * approxUp[2] - dirZ * approxUp[1];
      let ny = dirZ * approxUp[0] - dirX * approxUp[2];
      let nz = dirX * approxUp[1] - dirY * approxUp[0];
      let nLen = Math.sqrt(nx * nx + ny * ny + nz * nz);

      // If segment is parallel to up, use alternate up
      if (nLen < 1e-10) {
        nx = dirY * 1 - dirZ * 0;
        ny = dirZ * 0 - dirX * 1;
        nz = dirX * 0 - dirY * 0;
        // cross with (0,1,0)
        nx = dirY * 0 - dirZ * 1;
        ny = dirZ * 0 - dirX * 0;
        nz = dirX * 1 - dirY * 0;
        nLen = Math.sqrt(nx * nx + ny * ny + nz * nz);
      }

      if (nLen > 0) {
        nx /= nLen; ny /= nLen; nz /= nLen;
      }

      const offsetX = nx * halfWidth;
      const offsetY = ny * halfWidth;
      const offsetZ = nz * halfWidth;

      // Face normal = cross(offset, segmentDir) for a flat ribbon, or just use approxUp
      // For a flat ribbon, face normal points along the up direction
      let fnx = ny * dirZ - nz * dirY;
      let fny = nz * dirX - nx * dirZ;
      let fnz = nx * dirY - ny * dirX;
      const fnLen = Math.sqrt(fnx * fnx + fny * fny + fnz * fnz);
      if (fnLen > 0) { fnx /= fnLen; fny /= fnLen; fnz /= fnLen; }

      // Vertex 0: start - offset
      posValues[(base + 0) * 3] = positions[i0 * 3] - offsetX;
      posValues[(base + 0) * 3 + 1] = positions[i0 * 3 + 1] - offsetY;
      posValues[(base + 0) * 3 + 2] = positions[i0 * 3 + 2] - offsetZ;

      // Vertex 1: start + offset
      posValues[(base + 1) * 3] = positions[i0 * 3] + offsetX;
      posValues[(base + 1) * 3 + 1] = positions[i0 * 3 + 1] + offsetY;
      posValues[(base + 1) * 3 + 2] = positions[i0 * 3 + 2] + offsetZ;

      // Vertex 2: end + offset
      posValues[(base + 2) * 3] = positions[i1 * 3] + offsetX;
      posValues[(base + 2) * 3 + 1] = positions[i1 * 3 + 1] + offsetY;
      posValues[(base + 2) * 3 + 2] = positions[i1 * 3 + 2] + offsetZ;

      // Vertex 3: end - offset
      posValues[(base + 3) * 3] = positions[i1 * 3] - offsetX;
      posValues[(base + 3) * 3 + 1] = positions[i1 * 3 + 1] - offsetY;
      posValues[(base + 3) * 3 + 2] = positions[i1 * 3 + 2] - offsetZ;

      // All 4 vertices share face normal
      for (let k = 0; k < 4; k++) {
        normals[(base + k) * 3] = fnx;
        normals[(base + k) * 3 + 1] = fny;
        normals[(base + k) * 3 + 2] = fnz;
      }

      // Two triangles: (0,1,2) and (0,2,3)
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
