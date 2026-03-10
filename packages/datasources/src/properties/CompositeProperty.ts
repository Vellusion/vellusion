import { JulianDate, type JulianDateType } from '@vellusion/scene';
import type { Property } from './Property';

interface CompositeInterval {
  start: JulianDateType;
  stop: JulianDateType;
  property: Property;
}

/**
 * A property that delegates to different sub-properties for different time
 * ranges. This allows composing a single property from multiple property
 * sources, each covering a different span of time.
 */
export class CompositeProperty<T = any> implements Property<T> {
  private _intervals: CompositeInterval[] = [];

  get isConstant(): boolean {
    return false;
  }

  /**
   * Adds a sub-property that is valid during the given time range.
   */
  addInterval(start: JulianDateType, stop: JulianDateType, property: Property<T>): void {
    this._intervals.push({
      start: JulianDate.clone(start),
      stop: JulianDate.clone(stop),
      property,
    });
  }

  /**
   * Returns the value from the sub-property whose interval contains the given
   * time, or `undefined` if no interval matches.
   */
  getValue(time: JulianDateType, result?: T): T | undefined {
    for (const interval of this._intervals) {
      const afterStart = JulianDate.secondsDifference(time, interval.start) >= 0;
      const beforeStop = JulianDate.secondsDifference(time, interval.stop) <= 0;
      if (afterStart && beforeStop) {
        return interval.property.getValue(time, result);
      }
    }
    return undefined;
  }

  equals(other: Property<T>): boolean {
    if (!(other instanceof CompositeProperty)) return false;
    if (this._intervals.length !== other._intervals.length) return false;
    for (let i = 0; i < this._intervals.length; i++) {
      const a = this._intervals[i];
      const b = other._intervals[i];
      if (!JulianDate.equals(a.start, b.start)) return false;
      if (!JulianDate.equals(a.stop, b.stop)) return false;
      if (!a.property.equals(b.property)) return false;
    }
    return true;
  }
}
