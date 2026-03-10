import { describe, it, expect } from 'vitest';
import { Cartographic } from '../src/Cartographic';
import { VelMath } from '../src/MathUtils';

describe('Cartographic', () => {
  it('should create from radians', () => {
    const c = Cartographic.create(0.5, 0.3, 100);
    expect(c[0]).toBe(0.5);
    expect(c[1]).toBe(0.3);
    expect(c[2]).toBe(100);
    expect(c).toBeInstanceOf(Float64Array);
  });

  it('should default height to 0', () => {
    const c = Cartographic.create(0.1, 0.2);
    expect(c[0]).toBe(0.1);
    expect(c[1]).toBe(0.2);
    expect(c[2]).toBe(0);
  });

  it('should create from degrees', () => {
    const c = Cartographic.fromDegrees(180, 90, 50);
    expect(c[0]).toBeCloseTo(Math.PI);
    expect(c[1]).toBeCloseTo(Math.PI / 2);
    expect(c[2]).toBe(50);
  });

  it('fromDegrees(0, 0, 0) should produce longitude=0 and latitude=0', () => {
    const c = Cartographic.fromDegrees(0, 0, 0);
    expect(c[0]).toBe(0);
    expect(c[1]).toBe(0);
    expect(c[2]).toBe(0);
  });

  it('should default height to 0 in fromDegrees', () => {
    const c = Cartographic.fromDegrees(45, 30);
    expect(c[0]).toBeCloseTo(VelMath.toRadians(45));
    expect(c[1]).toBeCloseTo(VelMath.toRadians(30));
    expect(c[2]).toBe(0);
  });

  it('should clone', () => {
    const a = Cartographic.create(0.5, 0.3, 100);
    const b = Cartographic.clone(a);
    expect(b[0]).toBe(0.5);
    expect(b[1]).toBe(0.3);
    expect(b[2]).toBe(100);
    b[0] = 99;
    expect(a[0]).toBe(0.5);
  });

  it('should check equality with epsilon', () => {
    const a = Cartographic.create(1, 2, 3);
    const b = Cartographic.create(1 + 1e-8, 2, 3);
    expect(Cartographic.equalsEpsilon(a, b, 1e-7)).toBe(true);
    expect(Cartographic.equalsEpsilon(a, b, 1e-9)).toBe(false);
  });

  it('should detect unequal latitude with epsilon', () => {
    const a = Cartographic.create(1, 2, 3);
    const b = Cartographic.create(1, 2.1, 3);
    expect(Cartographic.equalsEpsilon(a, b, 1e-7)).toBe(false);
  });

  it('should detect unequal height with epsilon', () => {
    const a = Cartographic.create(1, 2, 3);
    const b = Cartographic.create(1, 2, 3.5);
    expect(Cartographic.equalsEpsilon(a, b, 1e-7)).toBe(false);
  });
});
