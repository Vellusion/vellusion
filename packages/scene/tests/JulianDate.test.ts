import { describe, it, expect } from 'vitest';
import { JulianDate } from '../src/JulianDate';

describe('JulianDate', () => {
  it('fromDate/toDate round-trip preserves timestamp within 1ms', () => {
    const original = new Date('2024-06-15T10:30:00.000Z');
    const jd = JulianDate.fromDate(original);
    const restored = JulianDate.toDate(jd);

    expect(Math.abs(restored.getTime() - original.getTime())).toBeLessThan(1);
  });

  it('addSeconds: adding 3600 seconds advances by 1 hour', () => {
    const date = new Date('2024-01-01T00:00:00.000Z');
    const jd = JulianDate.fromDate(date);
    const result = { dayNumber: 0, secondsOfDay: 0 };
    JulianDate.addSeconds(jd, 3600, result);
    const advanced = JulianDate.toDate(result);

    // Verify the result is exactly 1 hour (3600000ms) ahead of the original
    const diffMs = advanced.getTime() - date.getTime();
    expect(Math.abs(diffMs - 3600000)).toBeLessThan(2);
  });

  it('secondsDifference: correct for same day', () => {
    const a = JulianDate.create(2460000, 7200);  // 2 hours in
    const b = JulianDate.create(2460000, 3600);  // 1 hour in

    expect(JulianDate.secondsDifference(a, b)).toBe(3600);
  });

  it('secondsDifference: correct for cross-day', () => {
    const a = JulianDate.create(2460001, 0);     // next day, 0 seconds
    const b = JulianDate.create(2460000, 82800); // previous day, 23 hours

    // difference = 1 day - 23 hours = 1 hour = 3600 seconds
    expect(JulianDate.secondsDifference(a, b)).toBe(3600);
  });

  it('now returns reasonable day number (> 2460000 for 2023+)', () => {
    const jd = JulianDate.now();

    expect(jd.dayNumber).toBeGreaterThan(2460000);
  });

  it('create normalizes secondsOfDay > 86400', () => {
    const jd = JulianDate.create(2460000, 90000); // 86400 + 3600

    expect(jd.dayNumber).toBe(2460001);
    expect(jd.secondsOfDay).toBe(3600);
  });

  it('clone creates an independent copy', () => {
    const original = JulianDate.create(2460000, 43200);
    const copy = JulianDate.clone(original);

    expect(copy.dayNumber).toBe(original.dayNumber);
    expect(copy.secondsOfDay).toBe(original.secondsOfDay);

    copy.dayNumber = 0;
    expect(original.dayNumber).toBe(2460000);
  });

  it('equals returns true for identical values', () => {
    const a = JulianDate.create(2460000, 43200);
    const b = JulianDate.create(2460000, 43200);

    expect(JulianDate.equals(a, b)).toBe(true);
  });

  it('equals returns false for different values', () => {
    const a = JulianDate.create(2460000, 43200);
    const b = JulianDate.create(2460000, 43201);

    expect(JulianDate.equals(a, b)).toBe(false);
  });
});
