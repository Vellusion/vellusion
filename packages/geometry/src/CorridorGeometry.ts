import type { Geometry } from './Geometry';

export interface CorridorGeometryOptions {
  positions: Float64Array;  // xyz center line (flat, 3 per vertex)
  width: number;            // corridor width in meters
}

/**
 * Generates a flat corridor (ribbon) geometry along a center line.
 *
 * Similar to PolylineGeometry but intended to represent a surface-conforming
 * corridor. Positions are offset perpendicular to the path direction by
 * +/- width/2, and the ribbon strip is triangulated.
 */
export const CorridorGeometry = {
  create(options: CorridorGeometryOptions): Geometry {
    const { positions, width } = options;
    const pointCount = positions.length / 3;
    const halfWidth = width / 2.0;

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

    // For each point on the center line, compute left and right offset vertices.
    // This produces 2 * pointCount vertices and (pointCount - 1) * 6 indices.
    const vertexCount = pointCount * 2;
    const segmentCount = pointCount - 1;
    const indexCount = segmentCount * 6;
    const posValues = new Float32Array(vertexCount * 3);
    const normals = new Float32Array(vertexCount * 3);
    const stValues = new Float32Array(vertexCount * 2);

    for (let i = 0; i < pointCount; i++) {
      const px = positions[i * 3];
      const py = positions[i * 3 + 1];
      const pz = positions[i * 3 + 2];

      // Compute tangent direction at this point
      let tx: number, ty: number, tz: number;
      if (i === 0) {
        tx = positions[3] - px;
        ty = positions[4] - py;
        tz = positions[5] - pz;
      } else if (i === pointCount - 1) {
        tx = px - positions[(i - 1) * 3];
        ty = py - positions[(i - 1) * 3 + 1];
        tz = pz - positions[(i - 1) * 3 + 2];
      } else {
        // Average of previous and next segment directions
        tx = positions[(i + 1) * 3] - positions[(i - 1) * 3];
        ty = positions[(i + 1) * 3 + 1] - positions[(i - 1) * 3 + 1];
        tz = positions[(i + 1) * 3 + 2] - positions[(i - 1) * 3 + 2];
      }

      const tLen = Math.sqrt(tx * tx + ty * ty + tz * tz);
      if (tLen > 0) { tx /= tLen; ty /= tLen; tz /= tLen; }

      // Up direction: use normalized position (radial for globe-centric)
      const pLen = Math.sqrt(px * px + py * py + pz * pz);
      let upX = 0, upY = 0, upZ = 1;
      if (pLen > 0) {
        upX = px / pLen;
        upY = py / pLen;
        upZ = pz / pLen;
      }

      // Lateral direction: cross(tangent, up)
      let latX = ty * upZ - tz * upY;
      let latY = tz * upX - tx * upZ;
      let latZ = tx * upY - ty * upX;
      let latLen = Math.sqrt(latX * latX + latY * latY + latZ * latZ);

      // Fallback if tangent is parallel to up
      if (latLen < 1e-10) {
        // cross with (0,1,0)
        latX = ty * 0 - tz * 1;
        latY = tz * 0 - tx * 0;
        latZ = tx * 1 - ty * 0;
        latLen = Math.sqrt(latX * latX + latY * latY + latZ * latZ);
      }

      if (latLen > 0) { latX /= latLen; latY /= latLen; latZ /= latLen; }

      const offsetX = latX * halfWidth;
      const offsetY = latY * halfWidth;
      const offsetZ = latZ * halfWidth;

      // Left vertex (index 2*i)
      const li = i * 2;
      posValues[li * 3] = px - offsetX;
      posValues[li * 3 + 1] = py - offsetY;
      posValues[li * 3 + 2] = pz - offsetZ;

      // Right vertex (index 2*i+1)
      const ri = i * 2 + 1;
      posValues[ri * 3] = px + offsetX;
      posValues[ri * 3 + 1] = py + offsetY;
      posValues[ri * 3 + 2] = pz + offsetZ;

      // Normal = up direction for flat ribbon
      normals[li * 3] = upX;
      normals[li * 3 + 1] = upY;
      normals[li * 3 + 2] = upZ;
      normals[ri * 3] = upX;
      normals[ri * 3 + 1] = upY;
      normals[ri * 3 + 2] = upZ;

      // Texture coordinates
      const t = pointCount > 1 ? i / (pointCount - 1) : 0;
      stValues[li * 2] = 0;
      stValues[li * 2 + 1] = t;
      stValues[ri * 2] = 1;
      stValues[ri * 2 + 1] = t;
    }

    // Build triangle indices: for each segment, create 2 triangles
    const allIndices: number[] = [];
    for (let seg = 0; seg < segmentCount; seg++) {
      const l0 = seg * 2;
      const r0 = seg * 2 + 1;
      const l1 = (seg + 1) * 2;
      const r1 = (seg + 1) * 2 + 1;

      allIndices.push(l0, l1, r0);
      allIndices.push(r0, l1, r1);
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
        st: {
          values: stValues,
          componentsPerAttribute: 2,
          componentDatatype: 'float32',
        },
      },
      indices,
      primitiveType: 'triangles',
    };
  },
} as const;
