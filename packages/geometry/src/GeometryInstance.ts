import { Mat4, type Mat4Type, type Vec4Type } from '@vellusion/math';
import type { Geometry } from './Geometry';

export interface GeometryInstanceAttributes {
  color?: Vec4Type;
  show?: boolean;
}

export interface GeometryInstanceOptions {
  geometry: Geometry;
  modelMatrix?: Mat4Type;
  id?: string;
  attributes?: GeometryInstanceAttributes;
}

export class GeometryInstance {
  geometry: Geometry;
  modelMatrix: Mat4Type;
  id: string;
  attributes: GeometryInstanceAttributes;

  private static _nextId = 0;

  constructor(options: GeometryInstanceOptions) {
    this.geometry = options.geometry;
    this.modelMatrix = options.modelMatrix ?? Mat4.identity();
    this.id = options.id ?? `instance_${GeometryInstance._nextId++}`;
    this.attributes = options.attributes ?? {};
  }
}
