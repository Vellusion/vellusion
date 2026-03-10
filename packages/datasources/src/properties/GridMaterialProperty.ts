import type { JulianDateType } from '@vellusion/scene';
import type { Vec4Type } from '@vellusion/math';
import { Vec4 } from '@vellusion/math';
import type { Vec2Type } from '@vellusion/math';
import { Vec2 } from '@vellusion/math';
import type { Property } from './Property';
import { ConstantProperty } from './ConstantProperty';

export interface GridMaterialValue {
  color: Vec4Type;
  cellAlpha: number;
  lineCount: Vec2Type;
  lineThickness: Vec2Type;
}

/**
 * Describes a grid material with configurable line color, cell transparency,
 * line count, and line thickness.
 */
export class GridMaterialProperty implements Property<GridMaterialValue> {
  color: Property<Vec4Type>;
  cellAlpha: Property<number>;
  lineCount: Property<Vec2Type>;
  lineThickness: Property<Vec2Type>;

  get isConstant(): boolean {
    return (
      this.color.isConstant &&
      this.cellAlpha.isConstant &&
      this.lineCount.isConstant &&
      this.lineThickness.isConstant
    );
  }

  constructor(options?: {
    color?: Property<Vec4Type> | Vec4Type;
    cellAlpha?: Property<number> | number;
    lineCount?: Property<Vec2Type> | Vec2Type;
    lineThickness?: Property<Vec2Type> | Vec2Type;
  }) {
    this.color = _wrapIfNeeded(options?.color ?? Vec4.create(1, 1, 1, 1));
    this.cellAlpha = _wrapIfNeeded(options?.cellAlpha ?? 0.1);
    this.lineCount = _wrapIfNeeded(options?.lineCount ?? Vec2.create(8, 8));
    this.lineThickness = _wrapIfNeeded(options?.lineThickness ?? Vec2.create(1, 1));
  }

  getValue(time: JulianDateType): GridMaterialValue {
    return {
      color: this.color.getValue(time),
      cellAlpha: this.cellAlpha.getValue(time),
      lineCount: this.lineCount.getValue(time),
      lineThickness: this.lineThickness.getValue(time),
    };
  }

  equals(other: Property<GridMaterialValue>): boolean {
    if (!(other instanceof GridMaterialProperty)) return false;
    return (
      this.color.equals(other.color) &&
      this.cellAlpha.equals(other.cellAlpha) &&
      this.lineCount.equals(other.lineCount) &&
      this.lineThickness.equals(other.lineThickness)
    );
  }
}

function _wrapIfNeeded<T>(value: Property<T> | T): Property<T> {
  if (value != null && typeof (value as any).getValue === 'function') {
    return value as Property<T>;
  }
  return new ConstantProperty(value as T);
}
