import { describe, it, expect } from 'vitest';
import { Quaternion } from '../src/Quaternion';
import { Vec3 } from '../src/Vec3';
import { Mat3 } from '../src/Mat3';

const EPSILON = 1e-10;

describe('Quaternion', () => {
  it('should create a quaternion with given components', () => {
    const q = Quaternion.create(1, 2, 3, 4);
    expect(q).toBeInstanceOf(Float64Array);
    expect(q.length).toBe(4);
    expect(q[0]).toBe(1);
    expect(q[1]).toBe(2);
    expect(q[2]).toBe(3);
    expect(q[3]).toBe(4);
  });

  it('should create a quaternion with default values (0,0,0,0)', () => {
    const q = Quaternion.create();
    expect(q[0]).toBe(0);
    expect(q[1]).toBe(0);
    expect(q[2]).toBe(0);
    expect(q[3]).toBe(0);
  });

  it('identity creates (0,0,0,1)', () => {
    const q = Quaternion.identity();
    expect(q[0]).toBe(0);
    expect(q[1]).toBe(0);
    expect(q[2]).toBe(0);
    expect(q[3]).toBe(1);
  });

  it('should clone a quaternion', () => {
    const a = Quaternion.create(1, 2, 3, 4);
    const b = Quaternion.clone(a);
    expect(b[0]).toBe(1);
    expect(b[1]).toBe(2);
    expect(b[2]).toBe(3);
    expect(b[3]).toBe(4);
    // Mutating clone does not affect original
    b[0] = 99;
    expect(a[0]).toBe(1);
  });

  describe('fromAxisAngle', () => {
    it('rotate (1,0,0) by 90° around Z gives (0,1,0)', () => {
      const axis = Vec3.unitZ();
      const angle = Math.PI / 2;
      const q = Quaternion.create();
      Quaternion.fromAxisAngle(axis, angle, q);

      const v = Vec3.unitX();
      const result = Vec3.zero();
      Quaternion.rotateVector(q, v, result);

      expect(result[0]).toBeCloseTo(0, 10);
      expect(result[1]).toBeCloseTo(1, 10);
      expect(result[2]).toBeCloseTo(0, 10);
    });

    it('rotate (0,1,0) by 90° around X gives (0,0,1)', () => {
      const axis = Vec3.unitX();
      const angle = Math.PI / 2;
      const q = Quaternion.create();
      Quaternion.fromAxisAngle(axis, angle, q);

      const v = Vec3.unitY();
      const result = Vec3.zero();
      Quaternion.rotateVector(q, v, result);

      expect(result[0]).toBeCloseTo(0, 10);
      expect(result[1]).toBeCloseTo(0, 10);
      expect(result[2]).toBeCloseTo(1, 10);
    });

    it('0° rotation produces identity quaternion', () => {
      const axis = Vec3.unitZ();
      const q = Quaternion.create();
      Quaternion.fromAxisAngle(axis, 0, q);
      expect(q[0]).toBeCloseTo(0);
      expect(q[1]).toBeCloseTo(0);
      expect(q[2]).toBeCloseTo(0);
      expect(q[3]).toBeCloseTo(1);
    });

    it('returns result for chaining', () => {
      const q = Quaternion.create();
      const returned = Quaternion.fromAxisAngle(Vec3.unitZ(), Math.PI / 2, q);
      expect(returned).toBe(q);
    });
  });

  describe('slerp', () => {
    it('t=0 returns a', () => {
      const a = Quaternion.create();
      Quaternion.fromAxisAngle(Vec3.unitZ(), 0, a);
      const b = Quaternion.create();
      Quaternion.fromAxisAngle(Vec3.unitZ(), Math.PI / 2, b);
      const result = Quaternion.create();

      Quaternion.slerp(a, b, 0, result);
      expect(Quaternion.equalsEpsilon(result, a, EPSILON)).toBe(true);
    });

    it('t=1 returns b', () => {
      const a = Quaternion.create();
      Quaternion.fromAxisAngle(Vec3.unitZ(), 0, a);
      const b = Quaternion.create();
      Quaternion.fromAxisAngle(Vec3.unitZ(), Math.PI / 2, b);
      const result = Quaternion.create();

      Quaternion.slerp(a, b, 1, result);
      expect(Quaternion.equalsEpsilon(result, b, EPSILON)).toBe(true);
    });

    it('t=0.5 produces midpoint rotation', () => {
      const a = Quaternion.create();
      Quaternion.fromAxisAngle(Vec3.unitZ(), 0, a);
      const b = Quaternion.create();
      Quaternion.fromAxisAngle(Vec3.unitZ(), Math.PI / 2, b);
      const result = Quaternion.create();

      Quaternion.slerp(a, b, 0.5, result);

      // Midpoint of 0° and 90° around Z = 45° around Z
      const expected = Quaternion.create();
      Quaternion.fromAxisAngle(Vec3.unitZ(), Math.PI / 4, expected);
      expect(Quaternion.equalsEpsilon(result, expected, EPSILON)).toBe(true);
    });

    it('handles nearly identical quaternions (fallback to lerp)', () => {
      const a = Quaternion.identity();
      const b = Quaternion.create(1e-12, 0, 0, 1);
      const nb = Quaternion.create();
      Quaternion.normalize(b, nb);
      const result = Quaternion.create();
      Quaternion.slerp(a, nb, 0.5, result);
      // Should not produce NaN
      expect(Number.isNaN(result[0])).toBe(false);
      expect(Number.isNaN(result[3])).toBe(false);
    });

    it('returns result for chaining', () => {
      const a = Quaternion.identity();
      const b = Quaternion.identity();
      const result = Quaternion.create();
      const returned = Quaternion.slerp(a, b, 0.5, result);
      expect(returned).toBe(result);
    });
  });

  describe('toRotationMatrix + fromRotationMatrix round-trip', () => {
    it('identity quaternion produces identity matrix', () => {
      const q = Quaternion.identity();
      const mat = Mat3.identity();
      Quaternion.toRotationMatrix(q, mat);
      const id = Mat3.identity();
      expect(Mat3.equalsEpsilon(mat, id, EPSILON)).toBe(true);
    });

    it('round-trip preserves quaternion', () => {
      const q = Quaternion.create();
      Quaternion.fromAxisAngle(Vec3.unitZ(), Math.PI / 3, q);

      const mat = Mat3.identity();
      Quaternion.toRotationMatrix(q, mat);

      const q2 = Quaternion.create();
      Quaternion.fromRotationMatrix(mat, q2);

      // Quaternions q and -q represent the same rotation
      const same =
        Quaternion.equalsEpsilon(q, q2, EPSILON) ||
        Quaternion.equalsEpsilon(
          q,
          Quaternion.create(-q2[0], -q2[1], -q2[2], -q2[3]),
          EPSILON,
        );
      expect(same).toBe(true);
    });

    it('round-trip preserves rotation for 90° around X', () => {
      const q = Quaternion.create();
      Quaternion.fromAxisAngle(Vec3.unitX(), Math.PI / 2, q);

      const mat = Mat3.identity();
      Quaternion.toRotationMatrix(q, mat);

      const q2 = Quaternion.create();
      Quaternion.fromRotationMatrix(mat, q2);

      // Both quaternions should produce the same rotation
      const v = Vec3.unitY();
      const r1 = Vec3.zero();
      const r2 = Vec3.zero();
      Quaternion.rotateVector(q, v, r1);
      Quaternion.rotateVector(q2, v, r2);
      expect(Vec3.equalsEpsilon(r1, r2, EPSILON)).toBe(true);
    });

    it('round-trip preserves rotation for arbitrary axis', () => {
      const axis = Vec3.create(1, 1, 1);
      Vec3.normalize(axis, axis);
      const q = Quaternion.create();
      Quaternion.fromAxisAngle(axis, 1.23, q);

      const mat = Mat3.identity();
      Quaternion.toRotationMatrix(q, mat);

      const q2 = Quaternion.create();
      Quaternion.fromRotationMatrix(mat, q2);

      // Verify rotation equivalence
      const v = Vec3.create(1, 2, 3);
      const r1 = Vec3.zero();
      const r2 = Vec3.zero();
      Quaternion.rotateVector(q, v, r1);
      Quaternion.rotateVector(q2, v, r2);
      expect(Vec3.equalsEpsilon(r1, r2, EPSILON)).toBe(true);
    });

    it('returns result for chaining', () => {
      const q = Quaternion.identity();
      const mat = Mat3.identity();
      const returned = Quaternion.toRotationMatrix(q, mat);
      expect(returned).toBe(mat);

      const q2 = Quaternion.create();
      const returned2 = Quaternion.fromRotationMatrix(mat, q2);
      expect(returned2).toBe(q2);
    });
  });

  describe('multiply', () => {
    it('two 90° rotations around Z = 180° rotation', () => {
      const q90 = Quaternion.create();
      Quaternion.fromAxisAngle(Vec3.unitZ(), Math.PI / 2, q90);

      const q180 = Quaternion.create();
      Quaternion.multiply(q90, q90, q180);

      // Rotating (1,0,0) by 180° around Z gives (-1,0,0)
      const v = Vec3.unitX();
      const result = Vec3.zero();
      Quaternion.rotateVector(q180, v, result);
      expect(result[0]).toBeCloseTo(-1, 10);
      expect(result[1]).toBeCloseTo(0, 10);
      expect(result[2]).toBeCloseTo(0, 10);
    });

    it('multiplying by identity produces same quaternion', () => {
      const q = Quaternion.create();
      Quaternion.fromAxisAngle(Vec3.unitX(), Math.PI / 4, q);
      const id = Quaternion.identity();
      const result = Quaternion.create();
      Quaternion.multiply(q, id, result);
      expect(Quaternion.equalsEpsilon(result, q, EPSILON)).toBe(true);
    });

    it('multiplying by inverse produces identity', () => {
      const q = Quaternion.create();
      Quaternion.fromAxisAngle(Vec3.unitY(), Math.PI / 3, q);
      const inv = Quaternion.create();
      Quaternion.inverse(q, inv);
      const result = Quaternion.create();
      Quaternion.multiply(q, inv, result);

      const id = Quaternion.identity();
      expect(Quaternion.equalsEpsilon(result, id, EPSILON)).toBe(true);
    });

    it('returns result for chaining', () => {
      const a = Quaternion.identity();
      const b = Quaternion.identity();
      const result = Quaternion.create();
      const returned = Quaternion.multiply(a, b, result);
      expect(returned).toBe(result);
    });
  });

  describe('conjugate', () => {
    it('negates the imaginary components', () => {
      const q = Quaternion.create(1, 2, 3, 4);
      const result = Quaternion.create();
      Quaternion.conjugate(q, result);
      expect(result[0]).toBe(-1);
      expect(result[1]).toBe(-2);
      expect(result[2]).toBe(-3);
      expect(result[3]).toBe(4);
    });

    it('conjugate of identity is identity', () => {
      const q = Quaternion.identity();
      const result = Quaternion.create();
      Quaternion.conjugate(q, result);
      expect(Quaternion.equalsEpsilon(result, q, EPSILON)).toBe(true);
    });

    it('returns result for chaining', () => {
      const q = Quaternion.create(1, 2, 3, 4);
      const result = Quaternion.create();
      const returned = Quaternion.conjugate(q, result);
      expect(returned).toBe(result);
    });
  });

  describe('inverse', () => {
    it('inverse of unit quaternion equals conjugate', () => {
      const q = Quaternion.create();
      Quaternion.fromAxisAngle(Vec3.unitZ(), Math.PI / 4, q);

      const conj = Quaternion.create();
      Quaternion.conjugate(q, conj);

      const inv = Quaternion.create();
      Quaternion.inverse(q, inv);

      expect(Quaternion.equalsEpsilon(inv, conj, EPSILON)).toBe(true);
    });

    it('q * q^-1 = identity', () => {
      const q = Quaternion.create();
      Quaternion.fromAxisAngle(Vec3.create(1, 1, 0), Math.PI / 3, q);
      Vec3.normalize(Vec3.create(1, 1, 0), Vec3.create(1, 1, 0)); // axis should be normalized for fromAxisAngle
      // Re-create with normalized axis
      const axis = Vec3.create(1, 1, 0);
      Vec3.normalize(axis, axis);
      Quaternion.fromAxisAngle(axis, Math.PI / 3, q);

      const inv = Quaternion.create();
      Quaternion.inverse(q, inv);
      const result = Quaternion.create();
      Quaternion.multiply(q, inv, result);
      const id = Quaternion.identity();
      expect(Quaternion.equalsEpsilon(result, id, EPSILON)).toBe(true);
    });

    it('returns result for chaining', () => {
      const q = Quaternion.identity();
      const result = Quaternion.create();
      const returned = Quaternion.inverse(q, result);
      expect(returned).toBe(result);
    });
  });

  describe('normalize', () => {
    it('normalizes to unit length', () => {
      const q = Quaternion.create(1, 2, 3, 4);
      const result = Quaternion.create();
      Quaternion.normalize(q, result);
      expect(Quaternion.magnitude(result)).toBeCloseTo(1, 10);
    });

    it('preserves direction', () => {
      const q = Quaternion.create(0, 0, 0, 2);
      const result = Quaternion.create();
      Quaternion.normalize(q, result);
      expect(result[0]).toBeCloseTo(0);
      expect(result[1]).toBeCloseTo(0);
      expect(result[2]).toBeCloseTo(0);
      expect(result[3]).toBeCloseTo(1);
    });

    it('returns result for chaining', () => {
      const q = Quaternion.create(1, 2, 3, 4);
      const result = Quaternion.create();
      const returned = Quaternion.normalize(q, result);
      expect(returned).toBe(result);
    });
  });

  describe('magnitude', () => {
    it('identity has magnitude 1', () => {
      const q = Quaternion.identity();
      expect(Quaternion.magnitude(q)).toBeCloseTo(1);
    });

    it('computes correct magnitude', () => {
      const q = Quaternion.create(1, 2, 3, 4);
      // sqrt(1 + 4 + 9 + 16) = sqrt(30)
      expect(Quaternion.magnitude(q)).toBeCloseTo(Math.sqrt(30));
    });
  });

  describe('rotateVector', () => {
    it('identity rotation does not change vector', () => {
      const q = Quaternion.identity();
      const v = Vec3.create(1, 2, 3);
      const result = Vec3.zero();
      Quaternion.rotateVector(q, v, result);
      expect(Vec3.equalsEpsilon(result, v, EPSILON)).toBe(true);
    });

    it('180° around Z rotates (1,0,0) to (-1,0,0)', () => {
      const q = Quaternion.create();
      Quaternion.fromAxisAngle(Vec3.unitZ(), Math.PI, q);
      const v = Vec3.unitX();
      const result = Vec3.zero();
      Quaternion.rotateVector(q, v, result);
      expect(result[0]).toBeCloseTo(-1, 10);
      expect(result[1]).toBeCloseTo(0, 10);
      expect(result[2]).toBeCloseTo(0, 10);
    });

    it('90° around Y rotates (1,0,0) to (0,0,-1)', () => {
      const q = Quaternion.create();
      Quaternion.fromAxisAngle(Vec3.unitY(), Math.PI / 2, q);
      const v = Vec3.unitX();
      const result = Vec3.zero();
      Quaternion.rotateVector(q, v, result);
      expect(result[0]).toBeCloseTo(0, 10);
      expect(result[1]).toBeCloseTo(0, 10);
      expect(result[2]).toBeCloseTo(-1, 10);
    });

    it('returns result for chaining', () => {
      const q = Quaternion.identity();
      const v = Vec3.create(1, 2, 3);
      const result = Vec3.zero();
      const returned = Quaternion.rotateVector(q, v, result);
      expect(returned).toBe(result);
    });
  });

  describe('equalsEpsilon', () => {
    it('equal quaternions within epsilon', () => {
      const a = Quaternion.create(1, 2, 3, 4);
      const b = Quaternion.create(1 + 1e-8, 2, 3, 4);
      expect(Quaternion.equalsEpsilon(a, b, 1e-7)).toBe(true);
      expect(Quaternion.equalsEpsilon(a, b, 1e-9)).toBe(false);
    });

    it('identical quaternions', () => {
      const a = Quaternion.create(1, 2, 3, 4);
      expect(Quaternion.equalsEpsilon(a, a, 0)).toBe(true);
    });
  });

  describe('fromHeadingPitchRoll', () => {
    it('all zeros produces identity', () => {
      const q = Quaternion.create();
      Quaternion.fromHeadingPitchRoll(0, 0, 0, q);
      const id = Quaternion.identity();
      expect(Quaternion.equalsEpsilon(q, id, EPSILON)).toBe(true);
    });

    it('heading of 90° rotates (0,1,0) toward (-1,0,0)', () => {
      // Heading = rotation around Z axis
      const q = Quaternion.create();
      Quaternion.fromHeadingPitchRoll(Math.PI / 2, 0, 0, q);

      // Compare with direct axis-angle around Z
      const qExpected = Quaternion.create();
      Quaternion.fromAxisAngle(Vec3.unitZ(), Math.PI / 2, qExpected);

      // Both should produce the same rotation
      const v = Vec3.unitX();
      const r1 = Vec3.zero();
      const r2 = Vec3.zero();
      Quaternion.rotateVector(q, v, r1);
      Quaternion.rotateVector(qExpected, v, r2);
      expect(Vec3.equalsEpsilon(r1, r2, EPSILON)).toBe(true);
    });

    it('pitch of 90° rotates around Y', () => {
      const q = Quaternion.create();
      Quaternion.fromHeadingPitchRoll(0, Math.PI / 2, 0, q);

      const qExpected = Quaternion.create();
      Quaternion.fromAxisAngle(Vec3.unitY(), Math.PI / 2, qExpected);

      const v = Vec3.unitX();
      const r1 = Vec3.zero();
      const r2 = Vec3.zero();
      Quaternion.rotateVector(q, v, r1);
      Quaternion.rotateVector(qExpected, v, r2);
      expect(Vec3.equalsEpsilon(r1, r2, EPSILON)).toBe(true);
    });

    it('roll of 90° rotates around X', () => {
      const q = Quaternion.create();
      Quaternion.fromHeadingPitchRoll(0, 0, Math.PI / 2, q);

      const qExpected = Quaternion.create();
      Quaternion.fromAxisAngle(Vec3.unitX(), Math.PI / 2, qExpected);

      const v = Vec3.unitY();
      const r1 = Vec3.zero();
      const r2 = Vec3.zero();
      Quaternion.rotateVector(q, v, r1);
      Quaternion.rotateVector(qExpected, v, r2);
      expect(Vec3.equalsEpsilon(r1, r2, EPSILON)).toBe(true);
    });

    it('returns result for chaining', () => {
      const result = Quaternion.create();
      const returned = Quaternion.fromHeadingPitchRoll(0, 0, 0, result);
      expect(returned).toBe(result);
    });
  });

  describe('toRotationMatrix correctness', () => {
    it('90° around Z produces correct rotation matrix', () => {
      const q = Quaternion.create();
      Quaternion.fromAxisAngle(Vec3.unitZ(), Math.PI / 2, q);
      const mat = Mat3.identity();
      Quaternion.toRotationMatrix(q, mat);

      // Apply the matrix to (1,0,0) and verify
      const v = Vec3.unitX();
      const result = Vec3.zero();
      Mat3.multiplyByVector(mat, v, result);
      expect(result[0]).toBeCloseTo(0, 10);
      expect(result[1]).toBeCloseTo(1, 10);
      expect(result[2]).toBeCloseTo(0, 10);
    });
  });
});
