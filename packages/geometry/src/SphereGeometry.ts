import type { Geometry } from './Geometry';

export interface SphereGeometryOptions {
  radius?: number;
  stackCount?: number;
  sliceCount?: number;
}

/**
 * Generates a UV-sphere geometry centered at the origin.
 *
 * Vertex count: (stacks + 1) * (slices + 1)
 * Index count: stacks * slices * 6 (two triangles per grid cell)
 */
export const SphereGeometry = {
  create(options?: SphereGeometryOptions): Geometry {
    const radius = options?.radius ?? 1;
    const stacks = options?.stackCount ?? 16;
    const slices = options?.sliceCount ?? 32;

    const vertexCount = (stacks + 1) * (slices + 1);
    const positions = new Float32Array(vertexCount * 3);
    const normals = new Float32Array(vertexCount * 3);
    const uvs = new Float32Array(vertexCount * 2);

    let vi = 0;
    let ui = 0;

    for (let stack = 0; stack <= stacks; stack++) {
      const phi = (stack / stacks) * Math.PI; // 0..PI (top to bottom)
      const sinPhi = Math.sin(phi);
      const cosPhi = Math.cos(phi);

      for (let slice = 0; slice <= slices; slice++) {
        const theta = (slice / slices) * 2 * Math.PI; // 0..2PI
        const sinTheta = Math.sin(theta);
        const cosTheta = Math.cos(theta);

        // Normal direction
        const nx = sinPhi * cosTheta;
        const ny = cosPhi;
        const nz = sinPhi * sinTheta;

        positions[vi] = radius * nx;
        positions[vi + 1] = radius * ny;
        positions[vi + 2] = radius * nz;

        normals[vi] = nx;
        normals[vi + 1] = ny;
        normals[vi + 2] = nz;

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
