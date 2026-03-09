import { describe, it, expect } from 'vitest';
import { Mat3 } from '../src/Mat3';
import { Vec3 } from '../src/Vec3';

describe('Mat3', () => {
  it('should create identity matrix', () => {
    const m = Mat3.identity();
    expect(m).toBeInstanceOf(Float64Array);
    expect(m.length).toBe(9);
    // Column-major: [m00, m10, m20, m01, m11, m21, m02, m12, m22]
    expect(m[0]).toBe(1); expect(m[1]).toBe(0); expect(m[2]).toBe(0);
    expect(m[3]).toBe(0); expect(m[4]).toBe(1); expect(m[5]).toBe(0);
    expect(m[6]).toBe(0); expect(m[7]).toBe(0); expect(m[8]).toBe(1);
  });

  it('should create from values', () => {
    // Row-order input, stored column-major
    const m = Mat3.create(
      1, 2, 3,
      4, 5, 6,
      7, 8, 9,
    );
    // Column 0: [1, 4, 7], Column 1: [2, 5, 8], Column 2: [3, 6, 9]
    expect(m[0]).toBe(1); expect(m[1]).toBe(4); expect(m[2]).toBe(7);
    expect(m[3]).toBe(2); expect(m[4]).toBe(5); expect(m[5]).toBe(8);
    expect(m[6]).toBe(3); expect(m[7]).toBe(6); expect(m[8]).toBe(9);
  });

  it('should clone', () => {
    const a = Mat3.identity();
    const b = Mat3.clone(a);
    b[0] = 99;
    expect(a[0]).toBe(1);
  });

  it('should multiply with identity', () => {
    const a = Mat3.create(
      1, 2, 3,
      4, 5, 6,
      7, 8, 9,
    );
    const id = Mat3.identity();
    const r = Mat3.identity();
    Mat3.multiply(a, id, r);
    for (let i = 0; i < 9; i++) {
      expect(r[i]).toBeCloseTo(a[i]);
    }
  });

  it('should multiply two matrices', () => {
    const a = Mat3.create(
      1, 2, 3,
      4, 5, 6,
      7, 8, 9,
    );
    const b = Mat3.create(
      9, 8, 7,
      6, 5, 4,
      3, 2, 1,
    );
    const r = Mat3.identity();
    Mat3.multiply(a, b, r);
    // Row 0: [1*9+2*6+3*3, 1*8+2*5+3*2, 1*7+2*4+3*1] = [30, 24, 18]
    // Row 1: [4*9+5*6+6*3, 4*8+5*5+6*2, 4*7+5*4+6*1] = [84, 69, 54]
    // Row 2: [7*9+8*6+9*3, 7*8+8*5+9*2, 7*7+8*4+9*1] = [138, 114, 90]
    // Column-major: col0=[30,84,138], col1=[24,69,114], col2=[18,54,90]
    expect(r[0]).toBeCloseTo(30);  expect(r[1]).toBeCloseTo(84);  expect(r[2]).toBeCloseTo(138);
    expect(r[3]).toBeCloseTo(24);  expect(r[4]).toBeCloseTo(69);  expect(r[5]).toBeCloseTo(114);
    expect(r[6]).toBeCloseTo(18);  expect(r[7]).toBeCloseTo(54);  expect(r[8]).toBeCloseTo(90);
  });

  it('should multiply by vector', () => {
    const m = Mat3.create(
      1, 0, 0,
      0, 1, 0,
      0, 0, 1,
    );
    const v = Vec3.create(1, 2, 3);
    const r = Vec3.zero();
    Mat3.multiplyByVector(m, v, r);
    expect(r[0]).toBeCloseTo(1);
    expect(r[1]).toBeCloseTo(2);
    expect(r[2]).toBeCloseTo(3);
  });

  it('should multiply by scalar', () => {
    const m = Mat3.identity();
    const r = Mat3.identity();
    Mat3.multiplyByScalar(m, 3, r);
    expect(r[0]).toBe(3); expect(r[4]).toBe(3); expect(r[8]).toBe(3);
    expect(r[1]).toBe(0); expect(r[3]).toBe(0);
  });

  it('should transpose', () => {
    const m = Mat3.create(
      1, 2, 3,
      4, 5, 6,
      7, 8, 9,
    );
    const r = Mat3.identity();
    Mat3.transpose(m, r);
    // Transposed: rows become columns
    const expected = Mat3.create(
      1, 4, 7,
      2, 5, 8,
      3, 6, 9,
    );
    for (let i = 0; i < 9; i++) {
      expect(r[i]).toBeCloseTo(expected[i]);
    }
  });

  it('should compute determinant', () => {
    const m = Mat3.create(
      1, 2, 3,
      0, 1, 4,
      5, 6, 0,
    );
    // det = 1*(1*0-4*6) - 2*(0*0-4*5) + 3*(0*6-1*5)
    // = 1*(-24) - 2*(-20) + 3*(-5)
    // = -24 + 40 - 15 = 1
    expect(Mat3.determinant(m)).toBeCloseTo(1);
  });

  it('should compute inverse (A * A^-1 = I)', () => {
    const m = Mat3.create(
      1, 2, 3,
      0, 1, 4,
      5, 6, 0,
    );
    const inv = Mat3.identity();
    Mat3.inverse(m, inv);
    const product = Mat3.identity();
    Mat3.multiply(m, inv, product);
    const id = Mat3.identity();
    for (let i = 0; i < 9; i++) {
      expect(product[i]).toBeCloseTo(id[i]);
    }
  });

  it('should create scale matrix', () => {
    const s = Vec3.create(2, 3, 4);
    const r = Mat3.identity();
    Mat3.fromScale(s, r);
    expect(r[0]).toBe(2); expect(r[4]).toBe(3); expect(r[8]).toBe(4);
  });

  it('should create rotation Z matrix (90° rotates (1,0) to (0,1))', () => {
    const r = Mat3.identity();
    Mat3.fromRotationZ(Math.PI / 2, r);
    const v = Vec3.create(1, 0, 0);
    const out = Vec3.zero();
    Mat3.multiplyByVector(r, v, out);
    expect(out[0]).toBeCloseTo(0);
    expect(out[1]).toBeCloseTo(1);
    expect(out[2]).toBeCloseTo(0);
  });

  it('should check equality with epsilon', () => {
    const a = Mat3.identity();
    const b = Mat3.identity();
    b[0] = 1 + 1e-8;
    expect(Mat3.equalsEpsilon(a, b, 1e-7)).toBe(true);
    expect(Mat3.equalsEpsilon(a, b, 1e-9)).toBe(false);
  });
});
