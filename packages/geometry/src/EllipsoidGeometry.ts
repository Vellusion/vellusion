import type { Geometry } from './Geometry';

export interface EllipsoidGeometryOptions {
  radii?: [number, number, number];
  stackCount?: number;
  sliceCount?: number;
}

/**
 * Generates an ellipsoid geometry centered at the origin.
 *
 * Same algorithm as SphereGeometry but scales each axis independently by the
 * given radii. Normals are adjusted to remain perpendicular to the surface
 * (scaled by the inverse of the radii and re-normalized).
 */
export const EllipsoidGeometry = {
  create(options?: EllipsoidGeometryOptions): Geometry {
    const radii = options?.radii ?? [1, 1, 1];
    const rx = radii[0];
    const ry = radii[1];
    const rz = radii[2];
    const stacks = options?.stackCount ?? 16;
    const slices = options?.sliceCount ?? 32;

    const vertexCount = (stacks + 1) * (slices + 1);
    const positions = new Float32Array(vertexCount * 3);
    const normals = new Float32Array(vertexCount * 3);
    const uvs = new Float32Array(vertexCount * 2);

    let vi = 0;
    let ui = 0;

    for (let stack = 0; stack <= stacks; stack++) {
      const phi = (stack / stacks) * Math.PI;
      const sinPhi = Math.sin(phi);
      const cosPhi = Math.cos(phi);

      for (let slice = 0; slice <= slices; slice++) {
        const theta = (slice / slices) * 2 * Math.PI;
        const sinTheta = Math.sin(theta);
        const cosTheta = Math.cos(theta);

        // Unit sphere direction
        const dx = sinPhi * cosTheta;
        const dy = cosPhi;
        const dz = sinPhi * sinTheta;

        // Position on ellipsoid
        positions[vi] = rx * dx;
        positions[vi + 1] = ry * dy;
        positions[vi + 2] = rz * dz;

        // Normal: gradient of (x/rx)^2 + (y/ry)^2 + (z/rz)^2 = 1
        // Proportional to (x/rx^2, y/ry^2, z/rz^2), then normalized
        const gx = dx / rx;
        const gy = dy / ry;
        const gz = dz / rz;
        const invLen = 1 / Math.sqrt(gx * gx + gy * gy + gz * gz);

        normals[vi] = gx * invLen;
        normals[vi + 1] = gy * invLen;
        normals[vi + 2] = gz * invLen;

        uvs[ui] = slice / slices;
        uvs[ui + 1] = stack / stacks;

        vi += 3;
        ui += 2;
      }
    }

    // Indices
    const indexCount = stacks * slices * 6;
    const indices =
      vertexCount > 65535
        ? new Uint32Array(indexCount)
        : new Uint16Array(indexCount);

    let ii = 0;
    for (let stack = 0; stack < stacks; stack++) {
      for (let slice = 0; slice < slices; slice++) {
        const first = stack * (slices + 1) + slice;
        const second = first + slices + 1;

        indices[ii++] = first;
        indices[ii++] = second;
        indices[ii++] = first + 1;

        indices[ii++] = first + 1;
        indices[ii++] = second;
        indices[ii++] = second + 1;
      }
    }

    return {
      attributes: {
        position: {
          values: positions,
          componentsPerAttribute: 3,
          componentDatatype: 'float32',
        },
        normal: {
          values: normals,
          componentsPerAttribute: 3,
          componentDatatype: 'float32',
        },
        st: {
          values: uvs,
          componentsPerAttribute: 2,
          componentDatatype: 'float32',
        },
      },
      indices,
      primitiveType: 'triangles',
    };
  },
} as const;
