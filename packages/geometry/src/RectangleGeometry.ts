import { Ellipsoid, Cartographic } from '@vellusion/math';
import type { Geometry } from './Geometry';

export interface RectangleGeometryOptions {
  west: number;
  south: number;
  east: number;
  north: number;     // all in radians
  height?: number;           // default 0
  granularity?: number;      // subdivision step in radians
}

/**
 * Generates a subdivided rectangle on the WGS84 ellipsoid surface.
 *
 * The rectangle is specified in cartographic coordinates (radians) and
 * subdivided according to granularity. Each grid point is projected
 * to Cartesian coordinates on the ellipsoid surface.
 */
export const RectangleGeometry = {
  create(options: RectangleGeometryOptions): Geometry {
    const {
      west,
      south,
      east,
      north,
      height = 0,
      granularity = Math.PI / 180,
    } = options;

    const lonRange = east - west;
    const latRange = north - south;

    // Determine subdivision counts
    const lonSteps = Math.max(1, Math.ceil(Math.abs(lonRange) / granularity));
    const latSteps = Math.max(1, Math.ceil(Math.abs(latRange) / granularity));

    const cols = lonSteps + 1;
    const rows = latSteps + 1;
    const vertexCount = cols * rows;
    const posValues = new Float32Array(vertexCount * 3);
    const normals = new Float32Array(vertexCount * 3);
    const stValues = new Float32Array(vertexCount * 2);

    const ellipsoid = Ellipsoid.WGS84;
    const cartographic = Cartographic.create();
    const cartesian = new Float64Array(3);

    // Generate grid vertices
    for (let row = 0; row < rows; row++) {
      const lat = south + (row / latSteps) * latRange;
      const v = row / latSteps;

      for (let col = 0; col < cols; col++) {
        const lon = west + (col / lonSteps) * lonRange;
        const u = col / lonSteps;

        const idx = row * cols + col;

        // Convert to cartesian
        cartographic[0] = lon;
        cartographic[1] = lat;
        cartographic[2] = height;
        Ellipsoid.cartographicToCartesian(ellipsoid, cartographic, cartesian);

        posValues[idx * 3] = cartesian[0];
        posValues[idx * 3 + 1] = cartesian[1];
        posValues[idx * 3 + 2] = cartesian[2];

        // Surface normal (geodetic)
        const normal = new Float64Array(3);
        Ellipsoid.geodeticSurfaceNormal(ellipsoid, cartesian, normal);
        normals[idx * 3] = normal[0];
        normals[idx * 3 + 1] = normal[1];
        normals[idx * 3 + 2] = normal[2];

        // Texture coordinates
        stValues[idx * 2] = u;
        stValues[idx * 2 + 1] = v;
      }
    }

    // Generate triangle indices
    const quadCount = latSteps * lonSteps;
    const indexCount = quadCount * 6;
    const allIndices: number[] = [];

    for (let row = 0; row < latSteps; row++) {
      for (let col = 0; col < lonSteps; col++) {
        const tl = row * cols + col;
        const tr = tl + 1;
        const bl = (row + 1) * cols + col;
        const br = bl + 1;

        allIndices.push(tl, bl, tr);
        allIndices.push(tr, bl, br);
      }
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
        st: {
          values: stValues,
          componentsPerAttribute: 2,
          componentDatatype: 'float32',
        },
      },
      indices,
      primitiveType: 'triangles',
    };
  },
} as const;
