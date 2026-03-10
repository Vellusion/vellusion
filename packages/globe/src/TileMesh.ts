import { Ellipsoid, type EllipsoidType, Cartographic, Vec3 } from '@vellusion/math';

export interface GeographicExtent {
  west: number;    // radians
  south: number;
  east: number;
  north: number;
}

export interface TileMeshData {
  positions: Float64Array;   // xyz ECEF positions, 3 values per vertex
  normals: Float32Array;     // xyz normals, 3 values per vertex
  uvs: Float32Array;         // uv coordinates, 2 values per vertex
  indices: Uint16Array;      // triangle indices
  vertexCount: number;
  indexCount: number;
}

export const TileMesh = {
  create(
    extent: GeographicExtent,
    ellipsoid: EllipsoidType,
    segmentsX: number = 16,
    segmentsY: number = 16,
  ): TileMeshData {
    const vertexCount = (segmentsX + 1) * (segmentsY + 1);
    const indexCount = segmentsX * segmentsY * 6;

    const positions = new Float64Array(vertexCount * 3);
    const normals = new Float32Array(vertexCount * 3);
    const uvs = new Float32Array(vertexCount * 2);
    const indices = new Uint16Array(indexCount);

    const cart = Cartographic.create(0, 0, 0);
    const pos = Vec3.zero();
    const normal = Vec3.zero();

    let vIdx = 0;
    let uvIdx = 0;

    for (let j = 0; j <= segmentsY; j++) {
      const v = j / segmentsY;
      const lat = extent.south + v * (extent.north - extent.south);

      for (let i = 0; i <= segmentsX; i++) {
        const u = i / segmentsX;
        const lon = extent.west + u * (extent.east - extent.west);

        cart[0] = lon;
        cart[1] = lat;
        cart[2] = 0;

        Ellipsoid.cartographicToCartesian(ellipsoid, cart, pos);
        Ellipsoid.geodeticSurfaceNormal(ellipsoid, pos, normal);

        positions[vIdx * 3]     = pos[0];
        positions[vIdx * 3 + 1] = pos[1];
        positions[vIdx * 3 + 2] = pos[2];

        normals[vIdx * 3]     = normal[0];
        normals[vIdx * 3 + 1] = normal[1];
        normals[vIdx * 3 + 2] = normal[2];

        uvs[uvIdx]     = u;
        uvs[uvIdx + 1] = v;

        vIdx++;
        uvIdx += 2;
      }
    }

    // Generate indices
    let idx = 0;
    for (let j = 0; j < segmentsY; j++) {
      for (let i = 0; i < segmentsX; i++) {
        const topLeft = j * (segmentsX + 1) + i;
        const topRight = topLeft + 1;
        const bottomLeft = topLeft + (segmentsX + 1);
        const bottomRight = bottomLeft + 1;

        indices[idx++] = topLeft;
        indices[idx++] = bottomLeft;
        indices[idx++] = topRight;

        indices[idx++] = topRight;
        indices[idx++] = bottomLeft;
        indices[idx++] = bottomRight;
      }
    }

    return { positions, normals, uvs, indices, vertexCount, indexCount };
  },
} as const;
