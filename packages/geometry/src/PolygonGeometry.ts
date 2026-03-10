import type { Geometry } from './Geometry';

export interface PolygonGeometryOptions {
  positions: Float64Array;  // flat array of xyz, 3 values per vertex
  holes?: { start: number; count: number }[];  // optional hole definitions
  extrudedHeight?: number;  // optional extrusion height for 3D polygon
}

/**
 * Compute signed area of a 2D polygon (projected positions).
 * Positive = counter-clockwise, negative = clockwise.
 */
function signedArea2D(
  coords: number[][],
): number {
  let area = 0;
  const n = coords.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += coords[i][0] * coords[j][1];
    area -= coords[j][0] * coords[i][1];
  }
  return area * 0.5;
}

/**
 * Check if a point is inside a triangle (2D).
 */
function pointInTriangle(
  px: number, py: number,
  ax: number, ay: number,
  bx: number, by: number,
  cx: number, cy: number,
): boolean {
  const d1 = (px - bx) * (ay - by) - (ax - bx) * (py - by);
  const d2 = (px - cx) * (by - cy) - (bx - cx) * (py - cy);
  const d3 = (px - ax) * (cy - ay) - (cx - ax) * (py - ay);
  const hasNeg = (d1 < 0) || (d2 < 0) || (d3 < 0);
  const hasPos = (d1 > 0) || (d2 > 0) || (d3 > 0);
  return !(hasNeg && hasPos);
}

/**
 * Check if a triangle formed by three consecutive vertices is an "ear"
 * (convex and no other polygon vertices lie inside it).
 */
function isEar(
  coords: number[][],
  prev: number,
  curr: number,
  next: number,
  ccw: boolean,
): boolean {
  const ax = coords[prev][0], ay = coords[prev][1];
  const bx = coords[curr][0], by = coords[curr][1];
  const cx = coords[next][0], cy = coords[next][1];

  // Cross product to check convexity
  const cross = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
  if (ccw ? cross <= 0 : cross >= 0) return false;

  // Check no other vertex is inside this triangle
  for (let i = 0; i < coords.length; i++) {
    if (i === prev || i === curr || i === next) continue;
    if (pointInTriangle(coords[i][0], coords[i][1], ax, ay, bx, by, cx, cy)) {
      return false;
    }
  }
  return true;
}

/**
 * Ear-clipping triangulation for a simple polygon.
 * Returns triangle indices into the original vertex array.
 */
function earClipTriangulate(coords: number[][]): number[] {
  const n = coords.length;
  if (n < 3) return [];
  if (n === 3) return [0, 1, 2];

  const ccw = signedArea2D(coords) > 0;
  const indices: number[] = [];
  const remaining = Array.from({ length: n }, (_, i) => i);

  let maxIterations = n * n; // Safety limit
  while (remaining.length > 3 && maxIterations-- > 0) {
    let earFound = false;
    const len = remaining.length;

    for (let i = 0; i < len; i++) {
      const prev = (i - 1 + len) % len;
      const next = (i + 1) % len;

      // Build coords from remaining indices for ear test
      const rCoords = remaining.map((idx) => coords[idx]);
      if (isEar(rCoords, prev, i, next, ccw)) {
        indices.push(remaining[prev], remaining[i], remaining[next]);
        remaining.splice(i, 1);
        earFound = true;
        break;
      }
    }

    if (!earFound) {
      // Fallback: just take the first triangle
      indices.push(remaining[0], remaining[1], remaining[2]);
      remaining.splice(1, 1);
    }
  }

  // Last triangle
  if (remaining.length === 3) {
    indices.push(remaining[0], remaining[1], remaining[2]);
  }

  return indices;
}

/**
 * Project 3D positions to 2D by dropping the axis with smallest variance.
 */
function projectTo2D(positions: Float64Array, vertexCount: number): { coords: number[][]; dropAxis: number } {
  // Compute variance along each axis
  const mean = [0, 0, 0];
  for (let i = 0; i < vertexCount; i++) {
    mean[0] += positions[i * 3];
    mean[1] += positions[i * 3 + 1];
    mean[2] += positions[i * 3 + 2];
  }
  mean[0] /= vertexCount;
  mean[1] /= vertexCount;
  mean[2] /= vertexCount;

  const variance = [0, 0, 0];
  for (let i = 0; i < vertexCount; i++) {
    const dx = positions[i * 3] - mean[0];
    const dy = positions[i * 3 + 1] - mean[1];
    const dz = positions[i * 3 + 2] - mean[2];
    variance[0] += dx * dx;
    variance[1] += dy * dy;
    variance[2] += dz * dz;
  }

  // Drop axis with smallest variance
  let dropAxis = 0;
  if (variance[1] < variance[0] && variance[1] < variance[2]) dropAxis = 1;
  else if (variance[2] < variance[0] && variance[2] < variance[1]) dropAxis = 2;

  const axisA = dropAxis === 0 ? 1 : 0;
  const axisB = dropAxis === 2 ? 1 : 2;

  const coords: number[][] = [];
  for (let i = 0; i < vertexCount; i++) {
    coords.push([positions[i * 3 + axisA], positions[i * 3 + axisB]]);
  }

  return { coords, dropAxis };
}

/**
 * Compute face normal from three vertices.
 */
function computeNormal(
  positions: Float64Array,
  i0: number, i1: number, i2: number,
): [number, number, number] {
  const ax = positions[i1 * 3] - positions[i0 * 3];
  const ay = positions[i1 * 3 + 1] - positions[i0 * 3 + 1];
  const az = positions[i1 * 3 + 2] - positions[i0 * 3 + 2];
  const bx = positions[i2 * 3] - positions[i0 * 3];
  const by = positions[i2 * 3 + 1] - positions[i0 * 3 + 1];
  const bz = positions[i2 * 3 + 2] - positions[i0 * 3 + 2];
  const nx = ay * bz - az * by;
  const ny = az * bx - ax * bz;
  const nz = ax * by - ay * bx;
  const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
  if (len === 0) return [0, 0, 1];
  return [nx / len, ny / len, nz / len];
}

export const PolygonGeometry = {
  create(options: PolygonGeometryOptions): Geometry {
    const { positions, extrudedHeight } = options;
    const vertexCount = positions.length / 3;

    // Project to 2D and triangulate
    const { coords } = projectTo2D(positions, vertexCount);
    const triIndices = earClipTriangulate(coords);

    if (!extrudedHeight || extrudedHeight === 0) {
      // Flat polygon
      const posValues = new Float32Array(vertexCount * 3);
      for (let i = 0; i < vertexCount * 3; i++) {
        posValues[i] = positions[i];
      }

      // Compute per-vertex normals from face normals (averaged)
      const normals = new Float32Array(vertexCount * 3);
      for (let t = 0; t < triIndices.length; t += 3) {
        const n = computeNormal(positions, triIndices[t], triIndices[t + 1], triIndices[t + 2]);
        for (let k = 0; k < 3; k++) {
          const vi = triIndices[t + k];
          normals[vi * 3] += n[0];
          normals[vi * 3 + 1] += n[1];
          normals[vi * 3 + 2] += n[2];
        }
      }
      // Normalize
      for (let i = 0; i < vertexCount; i++) {
        const nx = normals[i * 3], ny = normals[i * 3 + 1], nz = normals[i * 3 + 2];
        const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
        if (len > 0) {
          normals[i * 3] /= len;
          normals[i * 3 + 1] /= len;
          normals[i * 3 + 2] /= len;
        }
      }

      const indices = triIndices.length > 65535
        ? new Uint32Array(triIndices)
        : new Uint16Array(triIndices);

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
    }

    // Extruded polygon: top face + bottom face + side walls
    // Compute face normal for height offset direction
    const faceNormal = vertexCount >= 3
      ? computeNormal(positions, 0, 1, 2)
      : [0, 0, 1] as [number, number, number];

    // Top positions = original, Bottom positions = original + extrudedHeight * normal
    const topCount = vertexCount;
    const bottomCount = vertexCount;
    const wallVertCount = vertexCount * 4; // 4 vertices per edge segment
    const totalVerts = topCount + bottomCount + wallVertCount;

    const posValues = new Float32Array(totalVerts * 3);
    const normals = new Float32Array(totalVerts * 3);
    const allIndices: number[] = [];

    // Top face positions and normals
    for (let i = 0; i < vertexCount; i++) {
      posValues[i * 3] = positions[i * 3];
      posValues[i * 3 + 1] = positions[i * 3 + 1];
      posValues[i * 3 + 2] = positions[i * 3 + 2];
      normals[i * 3] = faceNormal[0];
      normals[i * 3 + 1] = faceNormal[1];
      normals[i * 3 + 2] = faceNormal[2];
    }

    // Bottom face positions and normals
    const bottomOffset = topCount;
    for (let i = 0; i < vertexCount; i++) {
      posValues[(bottomOffset + i) * 3] = positions[i * 3] + extrudedHeight * faceNormal[0];
      posValues[(bottomOffset + i) * 3 + 1] = positions[i * 3 + 1] + extrudedHeight * faceNormal[1];
      posValues[(bottomOffset + i) * 3 + 2] = positions[i * 3 + 2] + extrudedHeight * faceNormal[2];
      normals[(bottomOffset + i) * 3] = -faceNormal[0];
      normals[(bottomOffset + i) * 3 + 1] = -faceNormal[1];
      normals[(bottomOffset + i) * 3 + 2] = -faceNormal[2];
    }

    // Top face indices
    for (const idx of triIndices) {
      allIndices.push(idx);
    }

    // Bottom face indices (reversed winding)
    for (let t = 0; t < triIndices.length; t += 3) {
      allIndices.push(
        triIndices[t] + bottomOffset,
        triIndices[t + 2] + bottomOffset,
        triIndices[t + 1] + bottomOffset,
      );
    }

    // Side walls
    const wallBaseIdx = topCount + bottomCount;
    for (let i = 0; i < vertexCount; i++) {
      const next = (i + 1) % vertexCount;
      const vi = wallBaseIdx + i * 4;

      // 4 vertices: top_i, top_next, bottom_next, bottom_i
      posValues[vi * 3] = positions[i * 3];
      posValues[vi * 3 + 1] = positions[i * 3 + 1];
      posValues[vi * 3 + 2] = positions[i * 3 + 2];

      posValues[(vi + 1) * 3] = positions[next * 3];
      posValues[(vi + 1) * 3 + 1] = positions[next * 3 + 1];
      posValues[(vi + 1) * 3 + 2] = positions[next * 3 + 2];

      posValues[(vi + 2) * 3] = posValues[(bottomOffset + next) * 3];
      posValues[(vi + 2) * 3 + 1] = posValues[(bottomOffset + next) * 3 + 1];
      posValues[(vi + 2) * 3 + 2] = posValues[(bottomOffset + next) * 3 + 2];

      posValues[(vi + 3) * 3] = posValues[(bottomOffset + i) * 3];
      posValues[(vi + 3) * 3 + 1] = posValues[(bottomOffset + i) * 3 + 1];
      posValues[(vi + 3) * 3 + 2] = posValues[(bottomOffset + i) * 3 + 2];

      // Wall normal: cross(edge, extrusion direction)
      const edgeX = positions[next * 3] - positions[i * 3];
      const edgeY = positions[next * 3 + 1] - positions[i * 3 + 1];
      const edgeZ = positions[next * 3 + 2] - positions[i * 3 + 2];
      let wnx = edgeY * faceNormal[2] - edgeZ * faceNormal[1];
      let wny = edgeZ * faceNormal[0] - edgeX * faceNormal[2];
      let wnz = edgeX * faceNormal[1] - edgeY * faceNormal[0];
      const wnLen = Math.sqrt(wnx * wnx + wny * wny + wnz * wnz);
      if (wnLen > 0) { wnx /= wnLen; wny /= wnLen; wnz /= wnLen; }

      for (let k = 0; k < 4; k++) {
        normals[(vi + k) * 3] = wnx;
        normals[(vi + k) * 3 + 1] = wny;
        normals[(vi + k) * 3 + 2] = wnz;
      }

      allIndices.push(vi, vi + 1, vi + 2);
      allIndices.push(vi, vi + 2, vi + 3);
    }

    const indices = allIndices.length > 65535
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
