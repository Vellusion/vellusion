import type { Geometry } from './Geometry';

export interface FrustumGeometryOptions {
  fov: number;     // vertical field of view in radians
  aspect: number;  // width / height
  near: number;    // near plane distance
  far: number;     // far plane distance
}

/**
 * Generates a wireframe frustum geometry using 'lines' primitive type.
 *
 * Useful for visualizing camera frustums, viewsheds, spotlights, etc.
 * The frustum is centered at the origin looking down -Z, matching the
 * standard camera convention. Eight corner vertices are computed from
 * the FOV, aspect ratio, and near/far distances, then connected with
 * 12 edges (4 near, 4 far, 4 connecting near to far).
 */
export const FrustumGeometry = {
  create(options: FrustumGeometryOptions): Geometry {
    const { fov, aspect, near, far } = options;

    // Half-heights and half-widths at near and far planes
    const nearHalfH = Math.tan(fov * 0.5) * near;
    const nearHalfW = nearHalfH * aspect;
    const farHalfH = Math.tan(fov * 0.5) * far;
    const farHalfW = farHalfH * aspect;

    // 8 corner vertices (looking down -Z)
    // Near plane corners (z = -near)
    // 0: near top-left
    // 1: near top-right
    // 2: near bottom-right
    // 3: near bottom-left
    // Far plane corners (z = -far)
    // 4: far top-left
    // 5: far top-right
    // 6: far bottom-right
    // 7: far bottom-left
    const posValues = new Float32Array([
      // Near plane
      -nearHalfW,  nearHalfH, -near,  // 0: top-left
       nearHalfW,  nearHalfH, -near,  // 1: top-right
       nearHalfW, -nearHalfH, -near,  // 2: bottom-right
      -nearHalfW, -nearHalfH, -near,  // 3: bottom-left
      // Far plane
      -farHalfW,   farHalfH,  -far,   // 4: top-left
       farHalfW,   farHalfH,  -far,   // 5: top-right
       farHalfW,  -farHalfH,  -far,   // 6: bottom-right
      -farHalfW,  -farHalfH,  -far,   // 7: bottom-left
    ]);

    // 12 edges (each edge = 2 indices)
    const indices = new Uint16Array([
      // Near plane edges (4 edges)
      0, 1,
      1, 2,
      2, 3,
      3, 0,
      // Far plane edges (4 edges)
      4, 5,
      5, 6,
      6, 7,
      7, 4,
      // Connecting edges near-to-far (4 edges)
      0, 4,
      1, 5,
      2, 6,
      3, 7,
    ]);

    return {
      attributes: {
        position: {
          values: posValues,
          componentsPerAttribute: 3,
          componentDatatype: 'float32',
        },
      },
      indices,
      primitiveType: 'lines',
    };
  },
} as const;
