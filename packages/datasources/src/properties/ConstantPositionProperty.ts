import type { JulianDateType } from '@vellusion/scene';
import type { Vec3Type } from '@vellusion/math';
import { Vec3 } from '@vellusion/math';
import type { Property } from './Property';

/**
 * A property that always returns the same Vec3 position.
 */
export class ConstantPositionProperty implements Property<Vec3Type> {
  private _value: Vec3Type;

  get isConstant(): boolean {
    return true;
  }

  constructor(value: Vec3Type) {
    this._value = Vec3.clone(value);
  }

  getValue(_time: JulianDateType, result?: Vec3Type): Vec3Type {
    if (result) {
      result[0] = this._value[0];
      result[1] = this._value[1];
      result[2] = this._value[2];
      return result;
    }
    return Vec3.clone(this._value);
  }

  setValue(value: Vec3Type): void {
    this._value = Vec3.clone(value);
  }

  equals(other: Property<Vec3Type>): boolean {
    if (!(other instanceof ConstantPositionProperty)) return false;
    return Vec3.equalsEpsilon(this._value, other._value, 0);
  }
}
