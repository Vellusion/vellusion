import { describe, it, expect } from 'vitest';
import { Vec3 } from '../src/Vec3';
import { LinearSpline, HermiteSpline, CatmullRomSpline } from '../src/Spline';

describe('LinearSpline', () => {
  it('should return exact values at control points', () => {
    const times = [0, 1, 2];
    const points = [
      Vec3.create(0, 0, 0),
      Vec3.create(10, 0, 0),
      Vec3.create(10, 10, 0),
    ];
    const spline = LinearSpline.create(times, points);
    const result = Vec3.zero();

    spline.evaluate(0, result);
    expect(result[0]).toBeCloseTo(0);
    expect(result[1]).toBeCloseTo(0);
    expect(result[2]).toBeCloseTo(0);

    spline.evaluate(1, result);
    expect(result[0]).toBeCloseTo(10);
    expect(result[1]).toBeCloseTo(0);
    expect(result[2]).toBeCloseTo(0);

    spline.evaluate(2, result);
    expect(result[0]).toBeCloseTo(10);
    expect(result[1]).toBeCloseTo(10);
    expect(result[2]).toBeCloseTo(0);
  });

  it('should interpolate between control points', () => {
    const times = [0, 1];
    const points = [
      Vec3.create(0, 0, 0),
      Vec3.create(10, 20, 30),
    ];
    const spline = LinearSpline.create(times, points);
    const result = Vec3.zero();

    spline.evaluate(0.5, result);
    expect(result[0]).toBeCloseTo(5);
    expect(result[1]).toBeCloseTo(10);
    expect(result[2]).toBeCloseTo(15);
  });

  it('should clamp to first point before start', () => {
    const times = [1, 2];
    const points = [
      Vec3.create(5, 5, 5),
      Vec3.create(10, 10, 10),
    ];
    const spline = LinearSpline.create(times, points);
    const result = Vec3.zero();

    spline.evaluate(0, result);
    expect(result[0]).toBeCloseTo(5);
    expect(result[1]).toBeCloseTo(5);
    expect(result[2]).toBeCloseTo(5);
  });

  it('should clamp to last point after end', () => {
    const times = [0, 1];
    const points = [
      Vec3.create(0, 0, 0),
      Vec3.create(10, 10, 10),
    ];
    const spline = LinearSpline.create(times, points);
    const result = Vec3.zero();

    spline.evaluate(5, result);
    expect(result[0]).toBeCloseTo(10);
    expect(result[1]).toBeCloseTo(10);
    expect(result[2]).toBeCloseTo(10);
  });
});

describe('HermiteSpline', () => {
  it('should interpolate between control points', () => {
    const times = [0, 1];
    const points = [
      Vec3.create(0, 0, 0),
      Vec3.create(10, 0, 0),
    ];
    const inTangents = [
      Vec3.create(10, 0, 0),
      Vec3.create(10, 0, 0),
    ];
    const outTangents = [
      Vec3.create(10, 0, 0),
      Vec3.create(10, 0, 0),
    ];
    const spline = HermiteSpline.create(times, points, inTangents, outTangents);
    const result = Vec3.zero();

    // At t=0, should be at first point
    spline.evaluate(0, result);
    expect(result[0]).toBeCloseTo(0);

    // At t=1, should be at second point
    spline.evaluate(1, result);
    expect(result[0]).toBeCloseTo(10);

    // At t=0.5, should be somewhere in between
    spline.evaluate(0.5, result);
    expect(result[0]).toBeCloseTo(5);
  });

  it('should return exact values at endpoints', () => {
    const times = [0, 1, 2];
    const points = [
      Vec3.create(0, 0, 0),
      Vec3.create(5, 5, 0),
      Vec3.create(10, 0, 0),
    ];
    const tangents = [
      Vec3.create(5, 5, 0),
      Vec3.create(5, 0, 0),
      Vec3.create(5, -5, 0),
    ];
    const spline = HermiteSpline.create(times, points, tangents, tangents);
    const result = Vec3.zero();

    spline.evaluate(0, result);
    expect(result[0]).toBeCloseTo(0);
    expect(result[1]).toBeCloseTo(0);

    spline.evaluate(2, result);
    expect(result[0]).toBeCloseTo(10);
    expect(result[1]).toBeCloseTo(0);
  });
});

describe('CatmullRomSpline', () => {
  it('should pass through all control points', () => {
    const times = [0, 1, 2, 3];
    const points = [
      Vec3.create(0, 0, 0),
      Vec3.create(1, 2, 0),
      Vec3.create(3, 1, 0),
      Vec3.create(4, 3, 0),
    ];
    const spline = CatmullRomSpline.create(times, points);
    const result = Vec3.zero();

    for (let i = 0; i < times.length; i++) {
      spline.evaluate(times[i], result);
      expect(result[0]).toBeCloseTo(points[i][0]);
      expect(result[1]).toBeCloseTo(points[i][1]);
      expect(result[2]).toBeCloseTo(points[i][2]);
    }
  });

  it('should produce smooth curve between points', () => {
    const times = [0, 1, 2];
    const points = [
      Vec3.create(0, 0, 0),
      Vec3.create(5, 10, 0),
      Vec3.create(10, 0, 0),
    ];
    const spline = CatmullRomSpline.create(times, points);
    const result = Vec3.zero();

    // At midpoint of first segment, result should be between p0 and p1
    spline.evaluate(0.5, result);
    expect(result[0]).toBeGreaterThan(0);
    expect(result[0]).toBeLessThan(5);
    expect(result[1]).toBeGreaterThan(0);
  });
});
