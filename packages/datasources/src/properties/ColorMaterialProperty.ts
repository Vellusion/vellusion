import type { JulianDateType } from '@vellusion/scene';
import type { Vec4Type } from '@vellusion/math';
import type { Property } from './Property';
import { ConstantProperty } from './ConstantProperty';

/**
 * Describes a uniform-color material. The `color` parameter is expressed
 * as a Vec4 property (RGBA, each component in [0,1]).
 */
export class ColorMaterialProperty implements Property<{ color: Vec4Type }> {
  color: Property<Vec4Type>;

  get isConstant(): boolean {
    return this.color.isConstant;
  }

  /**
   * @param color - A Property evaluating to Vec4Type (RGBA), or a raw Vec4Type
   *                which will be wrapped in a ConstantProperty.
   */
  constructor(color: Property<Vec4Type> | Vec4Type) {
    this.color = _wrapIfNeeded(color);
  }

  getValue(time: JulianDateType): { color: Vec4Type } {
    return { color: this.color.getValue(time) };
  }

  equals(other: Property<{ color: Vec4Type }>): boolean {
    if (!(other instanceof ColorMaterialProperty)) return false;
    return this.color.equals(other.color);
  }
}

/** Wraps a raw value in a ConstantProperty if it is not already a Property. */
function _wrapIfNeeded<T>(value: Property<T> | T): Property<T> {
  if (value != null && typeof (value as any).getValue === 'function') {
    return value as Property<T>;
  }
  return new ConstantProperty(value as T);
}
