import type { Geometry } from './Geometry';

export interface CylinderGeometryOptions {
  topRadius?: number;
  bottomRadius?: number;
  height?: number;
  sliceCount?: number;
}

/**
 * Generates a cylinder geometry centered at the origin, extending along the Y axis.
 *
 * Includes side faces and top/bottom caps. Supports different top and bottom
 * radii (frustum shapes). When topRadius is 0, this produces a cone.
 */
export const CylinderGeometry = {
  create(options?: CylinderGeometryOptions): Geometry {
    const topRadius = options?.topRadius ?? 1;
    const bottomRadius = options?.bottomRadius ?? 1;
    const height = options?.height ?? 1;
    const slices = options?.sliceCount ?? 32;

    const halfH = height / 2;

    // Vertex layout:
    // Side: 2 * (slices + 1) vertices (top ring + bottom ring, with seam duplication)
    // Top cap (if topRadius > 0): slices + 1 (ring) + 1 (center) = slices + 2
    // Bottom cap (if bottomRadius > 0): slices + 2
    const hasTopCap = topRadius > 0;
    const hasBottomCap = bottomRadius > 0;

    const sideVertexCount = 2 * (slices + 1);
    const topCapVertexCount = hasTopCap ? slices + 2 : 0;
    const bottomCapVertexCount = hasBottomCap ? slices + 2 : 0;
    const vertexCount = sideVertexCount + topCapVertexCount + bottomCapVertexCount;

    const sideIndexCount = slices * 6;
    const topCapIndexCount = hasTopCap ? slices * 3 : 0;
    const bottomCapIndexCount = hasBottomCap ? slices * 3 : 0;
    const indexCount = sideIndexCount + topCapIndexCount + bottomCapIndexCount;

    const positions = new Float32Array(vertexCount * 3);
    const normals = new Float32Array(vertexCount * 3);
    const uvs = new Float32Array(vertexCount * 2);
    const indices =
      vertexCount > 65535
        ? new Uint32Array(indexCount)
        : new Uint16Array(indexCount);

    let vi = 0; // position/normal index (counts by 3)
    let ui = 0; // uv index (counts by 2)
    let ii = 0; // index buffer index

    // --- Side faces ---
    // The side normal slope accounts for the radius difference
    const sideLen = Math.sqrt(
      (bottomRadius - topRadius) * (bottomRadius - topRadius) + height * height,
    );
    const sideNy = (bottomRadius - topRadius) / sideLen;
    const sideNr = height / sideLen; // radial component magnitude

    for (let i = 0; i <= slices; i++) {
      const theta = (i / slices) * 2 * Math.PI;
      const cosT = Math.cos(theta);
      const sinT = Math.sin(theta);

      const u = i / slices;

      // Top vertex
      positions[vi] = topRadius * cosT;
      positions[vi + 1] = halfH;
      positions[vi + 2] = topRadius * sinT;

      normals[vi] = sideNr * cosT;
      normals[vi + 1] = sideNy;
      normals[vi + 2] = sideNr * sinT;

      uvs[ui] = u;
      uvs[ui + 1] = 1;

      vi += 3;
      ui += 2;

      // Bottom vertex
      positions[vi] = bottomRadius * cosT;
      positions[vi + 1] = -halfH;
      positions[vi + 2] = bottomRadius * sinT;

      normals[vi] = sideNr * cosT;
      normals[vi + 1] = sideNy;
      normals[vi + 2] = sideNr * sinT;

      uvs[ui] = u;
      uvs[ui + 1] = 0;

      vi += 3;
      ui += 2;
    }

    // Side indices
    for (let i = 0; i < slices; i++) {
      const top0 = i * 2;
      const bot0 = i * 2 + 1;
      const top1 = (i + 1) * 2;
      const bot1 = (i + 1) * 2 + 1;

      indices[ii++] = top0;
      indices[ii++] = bot0;
      indices[ii++] = top1;

      indices[ii++] = top1;
      indices[ii++] = bot0;
      indices[ii++] = bot1;
    }

    // --- Top cap ---
    if (hasTopCap) {
      const capBaseVertex = sideVertexCount;

      // Center vertex
      positions[vi] = 0;
      positions[vi + 1] = halfH;
      positions[vi + 2] = 0;

      normals[vi] = 0;
      normals[vi + 1] = 1;
      normals[vi + 2] = 0;

      uvs[ui] = 0.5;
      uvs[ui + 1] = 0.5;

      vi += 3;
      ui += 2;

      // Ring vertices
      for (let i = 0; i <= slices; i++) {
        const theta = (i / slices) * 2 * Math.PI;
        const cosT = Math.cos(theta);
        const sinT = Math.sin(theta);

        positions[vi] = topRadius * cosT;
        positions[vi + 1] = halfH;
        positions[vi + 2] = topRadius * sinT;

        normals[vi] = 0;
        normals[vi + 1] = 1;
        normals[vi + 2] = 0;

        uvs[ui] = cosT * 0.5 + 0.5;
        uvs[ui + 1] = sinT * 0.5 + 0.5;

        vi += 3;
        ui += 2;
      }

      // Top cap indices (CCW when viewed from +Y)
      const centerIdx = capBaseVertex;
      for (let i = 0; i < slices; i++) {
        indices[ii++] = centerIdx;
        indices[ii++] = capBaseVertex + 1 + i;
        indices[ii++] = capBaseVertex + 1 + i + 1;
      }
    }

    // --- Bottom cap ---
    if (hasBottomCap) {
      const capBaseVertex = sideVertexCount + topCapVertexCount;

      // Center vertex
      positions[vi] = 0;
      positions[vi + 1] = -halfH;
      positions[vi + 2] = 0;

      normals[vi] = 0;
      normals[vi + 1] = -1;
      normals[vi + 2] = 0;

      uvs[ui] = 0.5;
      uvs[ui + 1] = 0.5;

      vi += 3;
      ui += 2;

      // Ring vertices
      for (let i = 0; i <= slices; i++) {
        const theta = (i / slices) * 2 * Math.PI;
        const cosT = Math.cos(theta);
        const sinT = Math.sin(theta);

        positions[vi] = bottomRadius * cosT;
        positions[vi + 1] = -halfH;
        positions[vi + 2] = bottomRadius * sinT;

        normals[vi] = 0;
        normals[vi + 1] = -1;
        normals[vi + 2] = 0;

        uvs[ui] = cosT * 0.5 + 0.5;
        uvs[ui + 1] = sinT * 0.5 + 0.5;

        vi += 3;
        ui += 2;
      }

      // Bottom cap indices (CW when viewed from +Y => CCW from -Y)
      const centerIdx = capBaseVertex;
      for (let i = 0; i < slices; i++) {
        indices[ii++] = centerIdx;
        indices[ii++] = capBaseVertex + 1 + i + 1;
        indices[ii++] = capBaseVertex + 1 + i;
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
