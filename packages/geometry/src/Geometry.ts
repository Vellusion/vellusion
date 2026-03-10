import type { BoundingSphereType } from '@vellusion/math';
import type { GeometryAttribute } from './GeometryAttribute';

export type PrimitiveType = 'triangles' | 'lines' | 'points' | 'line-strip' | 'triangle-strip';

export interface GeometryAttributes {
  position: GeometryAttribute;
  normal?: GeometryAttribute;
  st?: GeometryAttribute;
  color?: GeometryAttribute;
}

export interface Geometry {
  attributes: GeometryAttributes;
  indices?: Uint16Array | Uint32Array;
  primitiveType: PrimitiveType;
  boundingSphere?: BoundingSphereType;
}
