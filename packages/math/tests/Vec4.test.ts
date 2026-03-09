import { describe, it, expect } from 'vitest';
import { Vec4 } from '../src/Vec4';

describe('Vec4', () => {
  it('should create from components', () => {
    const v = Vec4.create(1, 2, 3, 4);
    expect(v[0]).toBe(1);
    expect(v[1]).toBe(2);
    expect(v[2]).toBe(3);
    expect(v[3]).toBe(4);
    expect(v).toBeInstanceOf(Float64Array);
  });

  it('should create zero vector', () => {
    const v = Vec4.zero();
    expect(v[0]).toBe(0);
    expect(v[1]).toBe(0);
    expect(v[2]).toBe(0);
    expect(v[3]).toBe(0);
  });

  it('should clone', () => {
    const a = Vec4.create(1, 2, 3, 4);
    const b = Vec4.clone(a);
    expect(b[0]).toBe(1); expect(b[1]).toBe(2); expect(b[2]).toBe(3); expect(b[3]).toBe(4);
    b[0] = 99;
    expect(a[0]).toBe(1);
  });

  it('should add', () => {
    const a = Vec4.create(1, 2, 3, 4);
    const b = Vec4.create(5, 6, 7, 8);
    const r = Vec4.zero();
    Vec4.add(a, b, r);
    expect(r[0]).toBe(6); expect(r[1]).toBe(8); expect(r[2]).toBe(10); expect(r[3]).toBe(12);
  });

  it('should subtract', () => {
    const a = Vec4.create(5, 6, 7, 8);
    const b = Vec4.create(1, 2, 3, 4);
    const r = Vec4.zero();
    Vec4.subtract(a, b, r);
    expect(r[0]).toBe(4); expect(r[1]).toBe(4); expect(r[2]).toBe(4); expect(r[3]).toBe(4);
  });

  it('should scale', () => {
    const a = Vec4.create(1, 2, 3, 4);
    const r = Vec4.zero();
    Vec4.scale(a, 2, r);
    expect(r[0]).toBe(2); expect(r[1]).toBe(4); expect(r[2]).toBe(6); expect(r[3]).toBe(8);
  });

  it('should compute dot product', () => {
    const a = Vec4.create(1, 2, 3, 4);
    const b = Vec4.create(5, 6, 7, 8);
    expect(Vec4.dot(a, b)).toBe(70); // 5+12+21+32
  });

  it('should compute magnitude', () => {
    const a = Vec4.create(1, 2, 2, 4);
    expect(Vec4.magnitude(a)).toBeCloseTo(5); // sqrt(1+4+4+16)=5
  });

  it('should compute squared magnitude', () => {
    const a = Vec4.create(1, 2, 2, 4);
    expect(Vec4.magnitudeSquared(a)).toBe(25);
  });

  it('should normalize', () => {
    const a = Vec4.create(0, 0, 0, 5);
    const r = Vec4.zero();
    Vec4.normalize(a, r);
    expect(r[0]).toBeCloseTo(0);
    expect(r[1]).toBeCloseTo(0);
    expect(r[2]).toBeCloseTo(0);
    expect(r[3]).toBeCloseTo(1);
    expect(Vec4.magnitude(r)).toBeCloseTo(1);
  });

  it('should negate', () => {
    const a = Vec4.create(1, -2, 3, -4);
    const r = Vec4.zero();
    Vec4.negate(a, r);
    expect(r[0]).toBe(-1); expect(r[1]).toBe(2); expect(r[2]).toBe(-3); expect(r[3]).toBe(4);
  });

  it('should lerp', () => {
    const a = Vec4.create(0, 0, 0, 0);
    const b = Vec4.create(10, 20, 30, 40);
    const r = Vec4.zero();
    Vec4.lerp(a, b, 0.5, r);
    expect(r[0]).toBeCloseTo(5);
    expect(r[1]).toBeCloseTo(10);
    expect(r[2]).toBeCloseTo(15);
    expect(r[3]).toBeCloseTo(20);
  });

  it('should check equality with epsilon', () => {
    const a = Vec4.create(1, 2, 3, 4);
    const b = Vec4.create(1 + 1e-8, 2, 3, 4);
    expect(Vec4.equalsEpsilon(a, b, 1e-7)).toBe(true);
    expect(Vec4.equalsEpsilon(a, b, 1e-9)).toBe(false);
  });
});
