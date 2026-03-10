import type { JulianDateType } from '@vellusion/scene';
import type { Property } from './Property';

/**
 * A property whose value is computed by a user-supplied callback function.
 */
export class CallbackProperty<T> implements Property<T> {
  private _callback: (time: JulianDateType) => T;
  private _isConstant: boolean;

  get isConstant(): boolean {
    return this._isConstant;
  }

  /**
   * @param callback - Function that computes the property value for a given time.
   * @param isConstant - Whether this callback always returns the same value.
   */
  constructor(callback: (time: JulianDateType) => T, isConstant: boolean) {
    this._callback = callback;
    this._isConstant = isConstant;
  }

  getValue(time: JulianDateType): T {
    return this._callback(time);
  }

  equals(other: Property<T>): boolean {
    if (!(other instanceof CallbackProperty)) return false;
    return this._callback === other._callback && this._isConstant === other._isConstant;
  }
}
