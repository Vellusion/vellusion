export type ComponentDatatype = 'float32' | 'float64' | 'uint16' | 'uint32';

export interface GeometryAttribute {
  values: Float32Array | Float64Array | Uint16Array | Uint32Array;
  componentsPerAttribute: number; // 1, 2, 3, or 4
  componentDatatype: ComponentDatatype;
}
