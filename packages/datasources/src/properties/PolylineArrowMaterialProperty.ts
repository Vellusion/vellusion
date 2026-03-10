import type { JulianDateType } from '@vellusion/scene';
import type { Vec4Type } from '@vellusion/math';
import { Vec4 } from '@vellusion/math';
import type { Property } from './Property';
import { ConstantProperty } from './ConstantProperty';

export interface PolylineArrowMaterialValue {
  color: Vec4Type;
}

/**
 * Describes a polyline material rendered as an arrow.
 */
export class PolylineArrowMaterialProperty implements Property<PolylineArrowMaterialValue> {
  color: Property<Vec4Type>;

  get isConstant(): boolean {
    return this.color.isConstant;
  }

  constructor(options?: { color?: Property<Vec4Type> | Vec4Type }) {
    this.color = _wrapIfNeeded(options?.color ?? Vec4.create(1, 1, 1, 1));
  }

  getValue(time: JulianDateType): PolylineArrowMaterialValue {
    return {
      color: this.color.getValue(time),
    };
  }

  equals(other: Property<PolylineArrowMaterialValue>): boolean {
    if (!(other instanceof PolylineArrowMaterialProperty)) return false;
    return this.color.equals(other.color);
  }
}

function _wrapIfNeeded<T>(value: Property<T> | T): Property<T> {
  if (value != null && typeof (value as any).getValue === 'function') {
    return value as Property<T>;
  }
  return new ConstantProperty(value as T);
}
