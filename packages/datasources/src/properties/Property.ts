import type { JulianDateType } from '@vellusion/scene';

/**
 * Base interface for all time-dynamic properties.
 *
 * A Property represents a value that can vary over time.
 * Constant properties always return the same value regardless of time.
 */
export interface Property<T = any> {
  /** Whether this property is constant (value never changes with time). */
  readonly isConstant: boolean;

  /**
   * Returns the value at the given time.
   * @param time - The Julian date at which to evaluate.
   * @param result - Optional pre-allocated object to store the result.
   * @returns The value at the given time.
   */
  getValue(time: JulianDateType, result?: T): T;

  /**
   * Compares this property to another for equality.
   */
  equals(other: Property<T>): boolean;
}
