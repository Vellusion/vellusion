import type { Geometry } from './Geometry';

export interface EllipseGeometryOptions {
  center: Float64Array;     // xyz center point
  semiMajorAxis: number;    // meters
  semiMinorAxis: number;    // meters
  rotation?: number;        // radians, default 0
  granularity?: number;     // angular step, default PI/180
}

/**
 * Generates a disc geometry with an elliptical boundary using fan triangulation.
 *
 * Boundary points are computed as:
 *   center + cos(a) * major * majorDir + sin(a) * minor * minorDir
 *
 * The disc is triangulated as a fan from the center vertex.
 */
export const EllipseGeometry = {
  create(options: EllipseGeometryOptions): Geometry {
    const {
      center,
      semiMajorAxis,
      semiMinorAxis,
      rotation = 0,
      granularity = Math.PI / 180,
    } = options;

    const TWO_PI = 2.0 * Math.PI;
    const numEdgePoints = Math.max(3, Math.ceil(TWO_PI / granularity));

    // We need a local coordinate frame. Use an approximate tangent plane.
    // Compute a surface normal at the center (for an ellipsoidal surface,
    // approximate using the normalized center position).
    const cx = center[0], cy = center[1], cz = center[2];
    const cLen = Math.sqrt(cx * cx + cy * cy + cz * cz);
    let upX = 0, upY = 0, upZ = 1;
    if (cLen > 0) {
      upX = cx / cLen;
      upY = cy / cLen;
      upZ = cz / cLen;
    }

    // Major axis direction: pick a vector not parallel to up
    let refX = 0, refY = 1, refZ = 0;
    if (Math.abs(upX * refX + upY * refY + upZ * refZ) > 0.9) {
      refX = 1; refY = 0; refZ = 0;
    }

    // majorDir = normalize(cross(up, ref))
    let majX = upY * refZ - upZ * refY;
    let majY = upZ * refX - upX * refZ;
    let majZ = upX * refY - upY * refX;
    let majLen = Math.sqrt(majX * majX + majY * majY + majZ * majZ);
    if (majLen > 0) { majX /= majLen; majY /= majLen; majZ /= majLen; }

    // minorDir = cross(up, majorDir)
    let minX = upY * majZ - upZ * majY;
    let minY = upZ * majX - upX * majZ;
    let minZ = upX * majY - upY * majX;
    const minLen = Math.sqrt(minX * minX + minY * minY + minZ * minZ);
    if (minLen > 0) { minX /= minLen; minY /= minLen; minZ /= minLen; }

    // Apply rotation: rotate majorDir and minorDir around up by 'rotation' radians
    if (rotation !== 0) {
      const cosR = Math.cos(rotation);
      const sinR = Math.sin(rotation);
      const newMajX = majX * cosR + minX * sinR;
      const newMajY = majY * cosR + minY * sinR;
      const newMajZ = majZ * cosR + minZ * sinR;
      const newMinX = -majX * sinR + minX * cosR;
      const newMinY = -majY * sinR + minY * cosR;
      const newMinZ = -majZ * sinR + minZ * cosR;
      majX = newMajX; majY = newMajY; majZ = newMajZ;
      minX = newMinX; minY = newMinY; minZ = newMinZ;
      majLen = 1; // already normalized
    }

    // Vertices: center + numEdgePoints boundary points
    const totalVerts = 1 + numEdgePoints;
    const posValues = new Float32Array(totalVerts * 3);
    const normals = new Float32Array(totalVerts * 3);

    // Center vertex
    posValues[0] = cx;
    posValues[1] = cy;
    posValues[2] = cz;
    normals[0] = upX;
    normals[1] = upY;
    normals[2] = upZ;

    // Boundary vertices
    for (let i = 0; i < numEdgePoints; i++) {
      const angle = (i / numEdgePoints) * TWO_PI;
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);

      const vi = (i + 1) * 3;
      posValues[vi] = cx + cosA * semiMajorAxis * majX + sinA * semiMinorAxis * minX;
      posValues[vi + 1] = cy + cosA * semiMajorAxis * majY + sinA * semiMinorAxis * minY;
      posValues[vi + 2] = cz + cosA * semiMajorAxis * majZ + sinA * semiMinorAxis * minZ;
      normals[vi] = upX;
      normals[vi + 1] = upY;
      normals[vi + 2] = upZ;
    }

    // Fan triangulation: center (0) connects to each consecutive pair of boundary vertices
    const triCount = numEdgePoints;
    const indexCount = triCount * 3;
    const allIndices: number[] = [];
    for (let i = 0; i < numEdgePoints; i++) {
      const curr = i + 1;
      const next = (i + 1) % numEdgePoints + 1;
      allIndices.push(0, curr, next);
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
