import type { Geometry } from './Geometry';

export interface CoplanarPolygonGeometryOptions {
  positions: Float64Array;  // xyz, 3 per vertex, must be coplanar
}

/**
 * Compute signed area of a 2D polygon.
 * Positive = counter-clockwise, negative = clockwise.
 */
function signedArea2D(coords: number[][]): number {
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
 * Check if a triangle formed by three consecutive vertices is an "ear".
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

  const cross = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
  if (ccw ? cross <= 0 : cross >= 0) return false;

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
 */
function earClipTriangulate(coords: number[][]): number[] {
  const n = coords.length;
  if (n < 3) return [];
  if (n === 3) return [0, 1, 2];

  const ccw = signedArea2D(coords) > 0;
  const indices: number[] = [];
  const remaining = Array.from({ length: n }, (_, i) => i);

  let maxIterations = n * n;
  while (remaining.length > 3 && maxIterations-- > 0) {
    let earFound = false;
    const len = remaining.length;

    for (let i = 0; i < len; i++) {
      const prev = (i - 1 + len) % len;
      const next = (i + 1) % len;

      const rCoords = remaining.map((idx) => coords[idx]);
      if (isEar(rCoords, prev, i, next, ccw)) {
        indices.push(remaining[prev], remaining[i], remaining[next]);
        remaining.splice(i, 1);
        earFound = true;
        break;
      }
    }

    if (!earFound) {
      indices.push(remaining[0], remaining[1], remaining[2]);
      remaining.splice(1, 1);
    }
  }

  if (remaining.length === 3) {
    indices.push(remaining[0], remaining[1], remaining[2]);
  }

  return indices;
}

/**
 * Triangulates an arbitrary 3D polygon whose vertices lie on a single plane.
 *
 * Computes the plane normal from the first three points, projects all vertices
 * onto a 2D coordinate system on that plane, triangulates with ear-clipping,
 * and returns the result using the original 3D positions.
 */
export const CoplanarPolygonGeometry = {
  create(options: CoplanarPolygonGeometryOptions): Geometry {
    const { positions } = options;
    const vertexCount = positions.length / 3;

    if (vertexCount < 3) {
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

    // Compute plane normal from first 3 points: cross(p1-p0, p2-p0)
    const p0x = positions[0], p0y = positions[1], p0z = positions[2];
    const e1x = positions[3] - p0x, e1y = positions[4] - p0y, e1z = positions[5] - p0z;
    const e2x = positions[6] - p0x, e2y = positions[7] - p0y, e2z = positions[8] - p0z;

    let nx = e1y * e2z - e1z * e2y;
    let ny = e1z * e2x - e1x * e2z;
    let nz = e1x * e2y - e1y * e2x;
    const nLen = Math.sqrt(nx * nx + ny * ny + nz * nz);
    if (nLen > 0) { nx /= nLen; ny /= nLen; nz /= nLen; }

    // Build a 2D coordinate system on the plane
    // uAxis = normalized(e1)
    const e1Len = Math.sqrt(e1x * e1x + e1y * e1y + e1z * e1z);
    const ux = e1Len > 0 ? e1x / e1Len : 1;
    const uy = e1Len > 0 ? e1y / e1Len : 0;
    const uz = e1Len > 0 ? e1z / e1Len : 0;

    // vAxis = cross(normal, uAxis)
    const vx = ny * uz - nz * uy;
    const vy = nz * ux - nx * uz;
    const vz = nx * uy - ny * ux;

    // Project each vertex to 2D: (dot(p - p0, uAxis), dot(p - p0, vAxis))
    const coords: number[][] = [];
    for (let i = 0; i < vertexCount; i++) {
      const dx = positions[i * 3] - p0x;
      const dy = positions[i * 3 + 1] - p0y;
      const dz = positions[i * 3 + 2] - p0z;
      coords.push([
        dx * ux + dy * uy + dz * uz,
        dx * vx + dy * vy + dz * vz,
      ]);
    }

    // Triangulate in 2D
    const triIndices = earClipTriangulate(coords);

    // Build output positions (as Float32Array)
    const posValues = new Float32Array(vertexCount * 3);
    for (let i = 0; i < vertexCount * 3; i++) {
      posValues[i] = positions[i];
    }

    // All vertices share the same plane normal
    const normalValues = new Float32Array(vertexCount * 3);
    for (let i = 0; i < vertexCount; i++) {
      normalValues[i * 3] = nx;
      normalValues[i * 3 + 1] = ny;
      normalValues[i * 3 + 2] = nz;
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
          values: normalValues,
          componentsPerAttribute: 3,
          componentDatatype: 'float32',
        },
      },
      indices,
      primitiveType: 'triangles',
    };
  },
} as const;
