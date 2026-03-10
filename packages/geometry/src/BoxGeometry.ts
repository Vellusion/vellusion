import type { Geometry } from './Geometry';

export interface BoxGeometryOptions {
  width?: number;
  height?: number;
  depth?: number;
}

/**
 * Generates an axis-aligned box geometry centered at the origin.
 *
 * Produces 24 vertices (4 per face with unique normals), 36 indices, and
 * per-vertex position, normal, and UV attributes.
 */
export const BoxGeometry = {
  create(options?: BoxGeometryOptions): Geometry {
    const w = (options?.width ?? 1) / 2;
    const h = (options?.height ?? 1) / 2;
    const d = (options?.depth ?? 1) / 2;

    // 6 faces * 4 verts = 24 vertices
    const positions = new Float32Array(24 * 3);
    const normals = new Float32Array(24 * 3);
    const uvs = new Float32Array(24 * 2);
    const indices = new Uint16Array(36);

    // Each face: [positions (4x3), normal (3), uvs (4x2)]
    const faces: Array<{
      positions: number[][];
      normal: number[];
    }> = [
      // +Z face (front)
      {
        positions: [
          [-w, -h, d],
          [w, -h, d],
          [w, h, d],
          [-w, h, d],
        ],
        normal: [0, 0, 1],
      },
      // -Z face (back)
      {
        positions: [
          [w, -h, -d],
          [-w, -h, -d],
          [-w, h, -d],
          [w, h, -d],
        ],
        normal: [0, 0, -1],
      },
      // +Y face (top)
      {
        positions: [
          [-w, h, d],
          [w, h, d],
          [w, h, -d],
          [-w, h, -d],
        ],
        normal: [0, 1, 0],
      },
      // -Y face (bottom)
      {
        positions: [
          [-w, -h, -d],
          [w, -h, -d],
          [w, -h, d],
          [-w, -h, d],
        ],
        normal: [0, -1, 0],
      },
      // +X face (right)
      {
        positions: [
          [w, -h, d],
          [w, -h, -d],
          [w, h, -d],
          [w, h, d],
        ],
        normal: [1, 0, 0],
      },
      // -X face (left)
      {
        positions: [
          [-w, -h, -d],
          [-w, -h, d],
          [-w, h, d],
          [-w, h, -d],
        ],
        normal: [-1, 0, 0],
      },
    ];

    const faceUVs = [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
    ];

    for (let f = 0; f < 6; f++) {
      const face = faces[f];
      const base = f * 4;

      for (let v = 0; v < 4; v++) {
        const vi = base + v;
        positions[vi * 3] = face.positions[v][0];
        positions[vi * 3 + 1] = face.positions[v][1];
        positions[vi * 3 + 2] = face.positions[v][2];

        normals[vi * 3] = face.normal[0];
        normals[vi * 3 + 1] = face.normal[1];
        normals[vi * 3 + 2] = face.normal[2];

        uvs[vi * 2] = faceUVs[v][0];
        uvs[vi * 2 + 1] = faceUVs[v][1];
      }

      // Two triangles per face
      const ii = f * 6;
      indices[ii] = base;
      indices[ii + 1] = base + 1;
      indices[ii + 2] = base + 2;
      indices[ii + 3] = base;
      indices[ii + 4] = base + 2;
      indices[ii + 5] = base + 3;
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
