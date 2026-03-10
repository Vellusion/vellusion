import type { JulianDateType } from '@vellusion/scene';
import type { Vec4Type } from '@vellusion/math';
import { Vec4 } from '@vellusion/math';
import type { Property } from './Property';
import { ConstantProperty } from './ConstantProperty';

export interface PolylineGlowMaterialValue {
  color: Vec4Type;
  glowPower: number;
}

/**
 * Describes a polyline material rendered with a glowing effect.
 */
export class PolylineGlowMaterialProperty implements Property<PolylineGlowMaterialValue> {
  color: Property<Vec4Type>;
  glowPower: Property<number>;

  get isConstant(): boolean {
    return this.color.isConstant && this.glowPower.isConstant;
  }

  constructor(options?: {
    color?: Property<Vec4Type> | Vec4Type;
    glowPower?: Property<number> | number;
  }) {
    this.color = _wrapIfNeeded(options?.color ?? Vec4.create(1, 1, 1, 1));
    this.glowPower = _wrapIfNeeded(options?.glowPower ?? 0.25);
  }

  getValue(time: JulianDateType): PolylineGlowMaterialValue {
    return {
      color: this.color.getValue(time),
      glowPower: this.glowPower.getValue(time),
    };
  }

  equals(other: Property<PolylineGlowMaterialValue>): boolean {
    if (!(other instanceof PolylineGlowMaterialProperty)) return false;
    return this.color.equals(other.color) && this.glowPower.equals(other.glowPower);
  }
}

function _wrapIfNeeded<T>(value: Property<T> | T): Property<T> {
  if (value != null && typeof (value as any).getValue === 'function') {
    return value as Property<T>;
  }
  return new ConstantProperty(value as T);
}
