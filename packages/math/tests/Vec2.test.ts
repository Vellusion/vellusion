import { describe, it, expect } from 'vitest';
import { Vec2 } from '../src/Vec2';

describe('Vec2', () => {
  it('should create from components', () => {
    const v = Vec2.create(1, 2);
    expect(v[0]).toBe(1);
    expect(v[1]).toBe(2);
    expect(v).toBeInstanceOf(Float64Array);
  });

  it('should create zero vector', () => {
    const v = Vec2.zero();
    expect(v[0]).toBe(0);
    expect(v[1]).toBe(0);
  });

  it('should clone', () => {
    const a = Vec2.create(1, 2);
    const b = Vec2.clone(a);
    expect(b[0]).toBe(1);
    expect(b[1]).toBe(2);
    b[0] = 99;
    expect(a[0]).toBe(1); // original unchanged
  });

  it('should add', () => {
    const a = Vec2.create(1, 2);
    const b = Vec2.create(3, 4);
    const result = Vec2.create(0, 0);
    Vec2.add(a, b, result);
    expect(result[0]).toBe(4);
    expect(result[1]).toBe(6);
  });

  it('should subtract', () => {
    const a = Vec2.create(3, 4);
    const b = Vec2.create(1, 2);
    const result = Vec2.create(0, 0);
    Vec2.subtract(a, b, result);
    expect(result[0]).toBe(2);
    expect(result[1]).toBe(2);
  });

  it('should scale', () => {
    const a = Vec2.create(2, 3);
    const result = Vec2.create(0, 0);
    Vec2.scale(a, 3, result);
    expect(result[0]).toBe(6);
    expect(result[1]).toBe(9);
  });

  it('should compute dot product', () => {
    const a = Vec2.create(1, 2);
    const b = Vec2.create(3, 4);
    expect(Vec2.dot(a, b)).toBe(11);
  });

  it('should compute magnitude', () => {
    const a = Vec2.create(3, 4);
    expect(Vec2.magnitude(a)).toBeCloseTo(5);
  });

  it('should compute squared magnitude', () => {
    const a = Vec2.create(3, 4);
    expect(Vec2.magnitudeSquared(a)).toBe(25);
  });

  it('should normalize', () => {
    const a = Vec2.create(3, 4);
    const result = Vec2.create(0, 0);
    Vec2.normalize(a, result);
    expect(result[0]).toBeCloseTo(0.6);
    expect(result[1]).toBeCloseTo(0.8);
    expect(Vec2.magnitude(result)).toBeCloseTo(1);
  });

  it('should negate', () => {
    const a = Vec2.create(1, -2);
    const result = Vec2.create(0, 0);
    Vec2.negate(a, result);
    expect(result[0]).toBe(-1);
    expect(result[1]).toBe(2);
  });

  it('should compute distance', () => {
    const a = Vec2.create(0, 0);
    const b = Vec2.create(3, 4);
    expect(Vec2.distance(a, b)).toBeCloseTo(5);
  });

  it('should lerp', () => {
    const a = Vec2.create(0, 0);
    const b = Vec2.create(10, 20);
    const result = Vec2.create(0, 0);
    Vec2.lerp(a, b, 0.5, result);
    expect(result[0]).toBeCloseTo(5);
    expect(result[1]).toBeCloseTo(10);
  });

  it('should check equality with epsilon', () => {
    const a = Vec2.create(1, 2);
    const b = Vec2.create(1 + 1e-8, 2 + 1e-8);
    expect(Vec2.equalsEpsilon(a, b, 1e-7)).toBe(true);
    expect(Vec2.equalsEpsilon(a, b, 1e-9)).toBe(false);
  });
});
