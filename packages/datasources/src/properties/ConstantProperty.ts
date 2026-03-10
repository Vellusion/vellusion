import type { JulianDateType } from '@vellusion/scene';
import type { Property } from './Property';

/**
 * A property whose value never changes with time.
 */
export class ConstantProperty<T> implements Property<T> {
  private _value: T;

  get isConstant(): boolean {
    return true;
  }

  constructor(value: T) {
    this._value = value;
  }

  getValue(_time: JulianDateType): T {
    return this._value;
  }

  setValue(value: T): void {
    this._value = value;
  }

  equals(other: Property<T>): boolean {
    return other instanceof ConstantProperty && this._value === other._value;
  }
}
