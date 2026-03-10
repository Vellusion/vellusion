import { JulianDate, type JulianDateType } from '@vellusion/scene';
import type { Property } from './Property';

interface TimeInterval<T> {
  start: JulianDateType;
  stop: JulianDateType;
  data: T;
}

/**
 * A property whose value is determined by a set of non-overlapping time
 * intervals, each associated with a constant data value.
 */
export class TimeIntervalCollectionProperty<T> implements Property<T> {
  private _intervals: TimeInterval<T>[] = [];

  get isConstant(): boolean {
    return false;
  }

  /**
   * Adds a time interval with associated data.
   * The interval is inclusive on both ends: [start, stop].
   */
  addInterval(start: JulianDateType, stop: JulianDateType, data: T): void {
    this._intervals.push({
      start: JulianDate.clone(start),
      stop: JulianDate.clone(stop),
      data,
    });
  }

  /**
   * Returns the data value for the interval containing the given time,
   * or `undefined` if no interval contains it.
   */
  getValue(time: JulianDateType): T | undefined {
    for (const interval of this._intervals) {
      const afterStart = JulianDate.secondsDifference(time, interval.start) >= 0;
      const beforeStop = JulianDate.secondsDifference(time, interval.stop) <= 0;
      if (afterStart && beforeStop) {
        return interval.data;
      }
    }
    return undefined;
  }

  equals(other: Property<T>): boolean {
    if (!(other instanceof TimeIntervalCollectionProperty)) return false;
    if (this._intervals.length !== other._intervals.length) return false;
    for (let i = 0; i < this._intervals.length; i++) {
      const a = this._intervals[i];
      const b = other._intervals[i];
      if (!JulianDate.equals(a.start, b.start)) return false;
      if (!JulianDate.equals(a.stop, b.stop)) return false;
      if (a.data !== b.data) return false;
    }
    return true;
  }
}
