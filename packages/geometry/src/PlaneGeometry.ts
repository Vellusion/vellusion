import type { Geometry } from './Geometry';

export interface PlaneGeometryOptions {
  width?: number;
  height?: number;
}

/**
 * Generates a flat plane geometry in the XZ plane, centered at the origin,
 * with the normal pointing in the +Y direction.
 *
 * 4 vertices, 6 indices (2 triangles).
 */
export const PlaneGeometry = {
  create(options?: PlaneGeometryOptions): Geometry {
    const w = (options?.width ?? 1) / 2;
    const h = (options?.height ?? 1) / 2;

    // Vertices in XZ plane, normal pointing +Y
    // Layout:  3---2
    //          |   |
    //          0---1
    const positions = new Float32Array([
      -w, 0, h,   // 0: front-left
      w, 0, h,    // 1: front-right
      w, 0, -h,   // 2: back-right
      -w, 0, -h,  // 3: back-left
    ]);

    const normals = new Float32Array([
      0, 1, 0,
      0, 1, 0,
      0, 1, 0,
      0, 1, 0,
    ]);

    const uvs = new Float32Array([
      0, 1,
      1, 1,
      1, 0,
      0, 0,
    ]);

    const indices = new Uint16Array([
      0, 1, 2,
      0, 2, 3,
    ]);

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
