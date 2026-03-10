import type { JulianDateType } from '@vellusion/scene';
import type { Vec4Type } from '@vellusion/math';
import { Vec4 } from '@vellusion/math';
import type { Property } from './Property';
import { ConstantProperty } from './ConstantProperty';

export interface PolylineDashMaterialValue {
  color: Vec4Type;
  gapColor: Vec4Type;
  dashLength: number;
}

/**
 * Describes a polyline material rendered as a dashed line.
 */
export class PolylineDashMaterialProperty implements Property<PolylineDashMaterialValue> {
  color: Property<Vec4Type>;
  gapColor: Property<Vec4Type>;
  dashLength: Property<number>;

  get isConstant(): boolean {
    return (
      this.color.isConstant &&
      this.gapColor.isConstant &&
      this.dashLength.isConstant
    );
  }

  constructor(options?: {
    color?: Property<Vec4Type> | Vec4Type;
    gapColor?: Property<Vec4Type> | Vec4Type;
    dashLength?: Property<number> | number;
  }) {
    this.color = _wrapIfNeeded(options?.color ?? Vec4.create(1, 1, 1, 1));
    this.gapColor = _wrapIfNeeded(options?.gapColor ?? Vec4.create(0, 0, 0, 0));
    this.dashLength = _wrapIfNeeded(options?.dashLength ?? 16);
  }

  getValue(time: JulianDateType): PolylineDashMaterialValue {
    return {
      color: this.color.getValue(time),
      gapColor: this.gapColor.getValue(time),
      dashLength: this.dashLength.getValue(time),
    };
  }

  equals(other: Property<PolylineDashMaterialValue>): boolean {
    if (!(other instanceof PolylineDashMaterialProperty)) return false;
    return (
      this.color.equals(other.color) &&
      this.gapColor.equals(other.gapColor) &&
      this.dashLength.equals(other.dashLength)
    );
  }
}

function _wrapIfNeeded<T>(value: Property<T> | T): Property<T> {
  if (value != null && typeof (value as any).getValue === 'function') {
    return value as Property<T>;
  }
  return new ConstantProperty(value as T);
}
