import { describe, it, expect } from 'vitest';
import { Vec3 } from '../src/Vec3';

describe('Vec3', () => {
  it('should create from components', () => {
    const v = Vec3.create(1, 2, 3);
    expect(v[0]).toBe(1);
    expect(v[1]).toBe(2);
    expect(v[2]).toBe(3);
    expect(v).toBeInstanceOf(Float64Array);
  });

  it('should create zero vector', () => {
    const v = Vec3.zero();
    expect(v[0]).toBe(0);
    expect(v[1]).toBe(0);
    expect(v[2]).toBe(0);
  });

  it('should create unit vectors', () => {
    const x = Vec3.unitX();
    expect(x[0]).toBe(1); expect(x[1]).toBe(0); expect(x[2]).toBe(0);
    const y = Vec3.unitY();
    expect(y[0]).toBe(0); expect(y[1]).toBe(1); expect(y[2]).toBe(0);
    const z = Vec3.unitZ();
    expect(z[0]).toBe(0); expect(z[1]).toBe(0); expect(z[2]).toBe(1);
  });

  it('should clone', () => {
    const a = Vec3.create(1, 2, 3);
    const b = Vec3.clone(a);
    expect(b[0]).toBe(1); expect(b[1]).toBe(2); expect(b[2]).toBe(3);
    b[0] = 99;
    expect(a[0]).toBe(1);
  });

  it('should add', () => {
    const a = Vec3.create(1, 2, 3);
    const b = Vec3.create(4, 5, 6);
    const r = Vec3.zero();
    Vec3.add(a, b, r);
    expect(r[0]).toBe(5); expect(r[1]).toBe(7); expect(r[2]).toBe(9);
  });

  it('should subtract', () => {
    const a = Vec3.create(4, 5, 6);
    const b = Vec3.create(1, 2, 3);
    const r = Vec3.zero();
    Vec3.subtract(a, b, r);
    expect(r[0]).toBe(3); expect(r[1]).toBe(3); expect(r[2]).toBe(3);
  });

  it('should scale', () => {
    const a = Vec3.create(1, 2, 3);
    const r = Vec3.zero();
    Vec3.scale(a, 2, r);
    expect(r[0]).toBe(2); expect(r[1]).toBe(4); expect(r[2]).toBe(6);
  });

  it('should multiplyComponents', () => {
    const a = Vec3.create(2, 3, 4);
    const b = Vec3.create(5, 6, 7);
    const r = Vec3.zero();
    Vec3.multiplyComponents(a, b, r);
    expect(r[0]).toBe(10); expect(r[1]).toBe(18); expect(r[2]).toBe(28);
  });

  it('should compute dot product', () => {
    const a = Vec3.create(1, 2, 3);
    const b = Vec3.create(4, 5, 6);
    expect(Vec3.dot(a, b)).toBe(32);
  });

  it('should compute cross product', () => {
    const x = Vec3.unitX();
    const y = Vec3.unitY();
    const r = Vec3.zero();
    Vec3.cross(x, y, r);
    expect(r[0]).toBeCloseTo(0);
    expect(r[1]).toBeCloseTo(0);
    expect(r[2]).toBeCloseTo(1);
  });

  it('should compute magnitude', () => {
    expect(Vec3.magnitude(Vec3.create(1, 2, 2))).toBeCloseTo(3);
  });

  it('should normalize', () => {
    const a = Vec3.create(0, 0, 5);
    const r = Vec3.zero();
    Vec3.normalize(a, r);
    expect(r[0]).toBeCloseTo(0);
    expect(r[1]).toBeCloseTo(0);
    expect(r[2]).toBeCloseTo(1);
  });

  it('should negate', () => {
    const a = Vec3.create(1, -2, 3);
    const r = Vec3.zero();
    Vec3.negate(a, r);
    expect(r[0]).toBe(-1); expect(r[1]).toBe(2); expect(r[2]).toBe(-3);
  });

  it('should compute distance', () => {
    const a = Vec3.create(0, 0, 0);
    const b = Vec3.create(1, 2, 2);
    expect(Vec3.distance(a, b)).toBeCloseTo(3);
  });

  it('should lerp', () => {
    const a = Vec3.create(0, 0, 0);
    const b = Vec3.create(10, 20, 30);
    const r = Vec3.zero();
    Vec3.lerp(a, b, 0.5, r);
    expect(r[0]).toBeCloseTo(5);
    expect(r[1]).toBeCloseTo(10);
    expect(r[2]).toBeCloseTo(15);
  });

  it('should check equality with epsilon', () => {
    const a = Vec3.create(1, 2, 3);
    const b = Vec3.create(1 + 1e-8, 2, 3);
    expect(Vec3.equalsEpsilon(a, b, 1e-7)).toBe(true);
    expect(Vec3.equalsEpsilon(a, b, 1e-9)).toBe(false);
  });
});
