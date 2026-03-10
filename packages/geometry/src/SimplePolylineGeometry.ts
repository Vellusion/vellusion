import type { Geometry } from './Geometry';

export interface SimplePolylineGeometryOptions {
  positions: Float64Array;   // flat xyz, 3 per vertex
  colors?: Float32Array;     // optional per-vertex RGBA, 4 per vertex
}

/**
 * Generates a 1-pixel width line geometry using 'lines' primitive type.
 *
 * Unlike PolylineGeometry (which produces a ribbon mesh), this produces
 * raw line segments connecting consecutive points -- suitable for debug
 * visualization, wireframes, or thin lines that do not need width.
 */
export const SimplePolylineGeometry = {
  create(options: SimplePolylineGeometryOptions): Geometry {
    const { positions, colors } = options;
    const pointCount = positions.length / 3;

    if (pointCount < 2) {
      return {
        attributes: {
          position: {
            values: new Float32Array(0),
            componentsPerAttribute: 3,
            componentDatatype: 'float32',
          },
        },
        indices: new Uint16Array(0),
        primitiveType: 'lines',
      };
    }

    // Copy positions to Float32Array
    const posValues = new Float32Array(pointCount * 3);
    for (let i = 0; i < pointCount * 3; i++) {
      posValues[i] = positions[i];
    }

    // Generate line-segment indices: each consecutive pair forms a line
    const segmentCount = pointCount - 1;
    const indexCount = segmentCount * 2;
    const allIndices: number[] = [];
    for (let i = 0; i < segmentCount; i++) {
      allIndices.push(i, i + 1);
    }

    const indices = indexCount > 65535
      ? new Uint32Array(allIndices)
      : new Uint16Array(allIndices);

    const geometry: Geometry = {
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

    // Attach per-vertex colors if provided
    if (colors && colors.length === pointCount * 4) {
      geometry.attributes.color = {
        values: new Float32Array(colors),
        componentsPerAttribute: 4,
        componentDatatype: 'float32',
      };
    }

    return geometry;
  },
} as const;
