import type { Geometry } from './Geometry';

export interface PolylineVolumeGeometryOptions {
  positions: Float64Array;  // xyz path, 3 per vertex
  shape: Float32Array;      // xy cross-section, 2 per vertex
}

/**
 * Extrudes a 2D cross-section shape along a 3D polyline path.
 *
 * At each path point a local frame (tangent, normal, binormal) is computed.
 * The cross-section shape is placed in the normal-binormal plane and
 * adjacent cross-sections are connected with triangles.
 */
export const PolylineVolumeGeometry = {
  create(options: PolylineVolumeGeometryOptions): Geometry {
    const { positions, shape } = options;
    const pathCount = positions.length / 3;
    const shapeCount = shape.length / 2;

    if (pathCount < 2 || shapeCount < 2) {
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

    // Compute tangent vectors at each path point
    const tangents = new Float64Array(pathCount * 3);
    for (let i = 0; i < pathCount; i++) {
      let tx: number, ty: number, tz: number;
      if (i === 0) {
        tx = positions[3] - positions[0];
        ty = positions[4] - positions[1];
        tz = positions[5] - positions[2];
      } else if (i === pathCount - 1) {
        tx = positions[i * 3] - positions[(i - 1) * 3];
        ty = positions[i * 3 + 1] - positions[(i - 1) * 3 + 1];
        tz = positions[i * 3 + 2] - positions[(i - 1) * 3 + 2];
      } else {
        // Average of forward and backward
        tx = positions[(i + 1) * 3] - positions[(i - 1) * 3];
        ty = positions[(i + 1) * 3 + 1] - positions[(i - 1) * 3 + 1];
        tz = positions[(i + 1) * 3 + 2] - positions[(i - 1) * 3 + 2];
      }
      const len = Math.sqrt(tx * tx + ty * ty + tz * tz);
      if (len > 0) { tx /= len; ty /= len; tz /= len; }
      tangents[i * 3] = tx;
      tangents[i * 3 + 1] = ty;
      tangents[i * 3 + 2] = tz;
    }

    // Build local frames: normal and binormal at each path point
    // Use an initial reference up vector to bootstrap the first normal
    const normals = new Float64Array(pathCount * 3);
    const binormals = new Float64Array(pathCount * 3);

    // Pick initial up: prefer (0,1,0), fall back to (0,0,1) if tangent is parallel
    const t0x = tangents[0], t0y = tangents[1], t0z = tangents[2];
    let upX = 0, upY = 1, upZ = 0;
    const dotUp = Math.abs(t0x * upX + t0y * upY + t0z * upZ);
    if (dotUp > 0.9) {
      upX = 0; upY = 0; upZ = 1;
    }

    // First normal = cross(tangent, up), then normalize
    let nx = t0y * upZ - t0z * upY;
    let ny = t0z * upX - t0x * upZ;
    let nz = t0x * upY - t0y * upX;
    let nLen = Math.sqrt(nx * nx + ny * ny + nz * nz);
    if (nLen > 0) { nx /= nLen; ny /= nLen; nz /= nLen; }

    normals[0] = nx; normals[1] = ny; normals[2] = nz;

    // binormal = cross(tangent, normal)
    let bx = t0y * nz - t0z * ny;
    let by = t0z * nx - t0x * nz;
    let bz = t0x * ny - t0y * nx;
    nLen = Math.sqrt(bx * bx + by * by + bz * bz);
    if (nLen > 0) { bx /= nLen; by /= nLen; bz /= nLen; }

    binormals[0] = bx; binormals[1] = by; binormals[2] = bz;

    // Propagate frame along the path using rotation minimizing approach
    for (let i = 1; i < pathCount; i++) {
      const tx = tangents[i * 3], ty = tangents[i * 3 + 1], tz = tangents[i * 3 + 2];
      const prevNx = normals[(i - 1) * 3];
      const prevNy = normals[(i - 1) * 3 + 1];
      const prevNz = normals[(i - 1) * 3 + 2];

      // Project previous normal onto plane perpendicular to current tangent
      const dot = prevNx * tx + prevNy * ty + prevNz * tz;
      nx = prevNx - dot * tx;
      ny = prevNy - dot * ty;
      nz = prevNz - dot * tz;
      nLen = Math.sqrt(nx * nx + ny * ny + nz * nz);
      if (nLen > 0) { nx /= nLen; ny /= nLen; nz /= nLen; }
      normals[i * 3] = nx;
      normals[i * 3 + 1] = ny;
      normals[i * 3 + 2] = nz;

      // Binormal = cross(tangent, normal)
      bx = ty * nz - tz * ny;
      by = tz * nx - tx * nz;
      bz = tx * ny - ty * nx;
      nLen = Math.sqrt(bx * bx + by * by + bz * bz);
      if (nLen > 0) { bx /= nLen; by /= nLen; bz /= nLen; }
      binormals[i * 3] = bx;
      binormals[i * 3 + 1] = by;
      binormals[i * 3 + 2] = bz;
    }

    // Generate vertices: pathCount * shapeCount vertices
    const vertexCount = pathCount * shapeCount;
    const posValues = new Float32Array(vertexCount * 3);
    const normalValues = new Float32Array(vertexCount * 3);

    for (let p = 0; p < pathCount; p++) {
      const px = positions[p * 3];
      const py = positions[p * 3 + 1];
      const pz = positions[p * 3 + 2];
      const pnx = normals[p * 3], pny = normals[p * 3 + 1], pnz = normals[p * 3 + 2];
      const pbx = binormals[p * 3], pby = binormals[p * 3 + 1], pbz = binormals[p * 3 + 2];

      for (let s = 0; s < shapeCount; s++) {
        const sx = shape[s * 2];      // shape x maps to normal direction
        const sy = shape[s * 2 + 1];  // shape y maps to binormal direction
        const vi = p * shapeCount + s;

        // Position = pathPoint + sx * normal + sy * binormal
        posValues[vi * 3] = px + sx * pnx + sy * pbx;
        posValues[vi * 3 + 1] = py + sx * pny + sy * pby;
        posValues[vi * 3 + 2] = pz + sx * pnz + sy * pbz;

        // Normal for lighting: direction from path center to vertex
        let vnx = sx * pnx + sy * pbx;
        let vny = sx * pny + sy * pby;
        let vnz = sx * pnz + sy * pbz;
        const vnLen = Math.sqrt(vnx * vnx + vny * vny + vnz * vnz);
        if (vnLen > 0) { vnx /= vnLen; vny /= vnLen; vnz /= vnLen; }
        normalValues[vi * 3] = vnx;
        normalValues[vi * 3 + 1] = vny;
        normalValues[vi * 3 + 2] = vnz;
      }
    }

    // Generate indices: connect adjacent cross-sections
    const allIndices: number[] = [];
    for (let p = 0; p < pathCount - 1; p++) {
      for (let s = 0; s < shapeCount; s++) {
        const nextS = (s + 1) % shapeCount;
        const curr = p * shapeCount + s;
        const currNext = p * shapeCount + nextS;
        const nextP = (p + 1) * shapeCount + s;
        const nextPNext = (p + 1) * shapeCount + nextS;

        // Two triangles per quad
        allIndices.push(curr, nextP, currNext);
        allIndices.push(currNext, nextP, nextPNext);
      }
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
