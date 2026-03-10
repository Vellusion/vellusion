import { JulianDate, type JulianDateType } from '@vellusion/scene';
import type { Property } from './Property';

/**
 * A property whose value is determined by interpolating time-stamped samples.
 *
 * Uses binary search to find the two bracketing samples and then performs
 * linear interpolation between them. Returns the boundary value when the
 * requested time falls before the first sample or after the last.
 */
export class SampledProperty implements Property<number> {
  private _times: JulianDateType[] = [];
  private _values: number[] = [];

  get isConstant(): boolean {
    return false;
  }

  /**
   * Adds a single time-value sample.
   */
  addSample(time: JulianDateType, value: number): void {
    // Insert in sorted order by time
    const idx = this._findInsertIndex(time);
    this._times.splice(idx, 0, JulianDate.clone(time));
    this._values.splice(idx, 0, value);
  }

  /**
   * Adds multiple time-value samples at once.
   */
  addSamples(times: JulianDateType[], values: number[]): void {
    for (let i = 0; i < times.length; i++) {
      this.addSample(times[i], values[i]);
    }
  }

  /**
   * Evaluates the property at the given time via linear interpolation.
   */
  getValue(time: JulianDateType): number {
    const len = this._times.length;
    if (len === 0) return 0;
    if (len === 1) return this._values[0];

    // Before first sample
    const diffFirst = JulianDate.secondsDifference(time, this._times[0]);
    if (diffFirst <= 0) return this._values[0];

    // After last sample
    const diffLast = JulianDate.secondsDifference(time, this._times[len - 1]);
    if (diffLast >= 0) return this._values[len - 1];

    // Binary search for bracketing interval
    const idx = this._findBracketIndex(time);
    const t0 = this._times[idx];
    const t1 = this._times[idx + 1];
    const v0 = this._values[idx];
    const v1 = this._values[idx + 1];

    const interval = JulianDate.secondsDifference(t1, t0);
    const elapsed = JulianDate.secondsDifference(time, t0);
    const t = interval === 0 ? 0 : elapsed / interval;

    return v0 + t * (v1 - v0);
  }

  equals(other: Property<number>): boolean {
    if (!(other instanceof SampledProperty)) return false;
    if (this._times.length !== other._times.length) return false;
    for (let i = 0; i < this._times.length; i++) {
      if (!JulianDate.equals(this._times[i], other._times[i])) return false;
      if (this._values[i] !== other._values[i]) return false;
    }
    return true;
  }

  /**
   * Finds the insertion index so that the times array stays sorted.
   */
  private _findInsertIndex(time: JulianDateType): number {
    let lo = 0;
    let hi = this._times.length;
    while (lo < hi) {
      const mid = (lo + hi) >>> 1;
      if (JulianDate.secondsDifference(time, this._times[mid]) > 0) {
        lo = mid + 1;
      } else {
        hi = mid;
      }
    }
    return lo;
  }

  /**
   * Finds the index of the lower bracket (i such that times[i] <= time < times[i+1]).
   */
  private _findBracketIndex(time: JulianDateType): number {
    let lo = 0;
    let hi = this._times.length - 2;
    while (lo < hi) {
      const mid = (lo + hi + 1) >>> 1;
      if (JulianDate.secondsDifference(time, this._times[mid]) >= 0) {
        lo = mid;
      } else {
        hi = mid - 1;
      }
    }
    return lo;
  }
}
