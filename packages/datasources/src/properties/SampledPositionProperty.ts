import { JulianDate, type JulianDateType } from '@vellusion/scene';
import { Vec3 } from '@vellusion/math';
import type { Vec3Type } from '@vellusion/math';
import type { Property } from './Property';
import { SampledProperty } from './SampledProperty';

/**
 * A property that interpolates Vec3 positions over time using three
 * independent {@link SampledProperty} channels (x, y, z).
 */
export class SampledPositionProperty implements Property<Vec3Type> {
  private _x = new SampledProperty();
  private _y = new SampledProperty();
  private _z = new SampledProperty();

  get isConstant(): boolean {
    return false;
  }

  /**
   * Adds a position sample at the given time.
   */
  addSample(time: JulianDateType, position: Vec3Type): void {
    this._x.addSample(time, position[0]);
    this._y.addSample(time, position[1]);
    this._z.addSample(time, position[2]);
  }

  /**
   * Adds multiple position samples at once.
   */
  addSamples(times: JulianDateType[], positions: Vec3Type[]): void {
    for (let i = 0; i < times.length; i++) {
      this.addSample(times[i], positions[i]);
    }
  }

  /**
   * Returns the interpolated position at the given time.
   */
  getValue(time: JulianDateType, result?: Vec3Type): Vec3Type {
    const x = this._x.getValue(time);
    const y = this._y.getValue(time);
    const z = this._z.getValue(time);
    if (result) {
      result[0] = x;
      result[1] = y;
      result[2] = z;
      return result;
    }
    return Vec3.create(x, y, z);
  }

  equals(other: Property<Vec3Type>): boolean {
    if (!(other instanceof SampledPositionProperty)) return false;
    return (
      this._x.equals(other._x) &&
      this._y.equals(other._y) &&
      this._z.equals(other._z)
    );
  }
}
