import { describe, it, expect } from 'vitest';
import { Mat4 } from '../src/Mat4';
import { Vec3 } from '../src/Vec3';
import { Vec4 } from '../src/Vec4';
import { Mat3 } from '../src/Mat3';

describe('Mat4', () => {
  it('should create identity matrix', () => {
    const m = Mat4.identity();
    expect(m).toBeInstanceOf(Float64Array);
    expect(m.length).toBe(16);
    // Column-major: diagonal is 1, rest is 0
    // [m00, m10, m20, m30, m01, m11, m21, m31, m02, m12, m22, m32, m03, m13, m23, m33]
    expect(m[0]).toBe(1); expect(m[1]).toBe(0); expect(m[2]).toBe(0); expect(m[3]).toBe(0);
    expect(m[4]).toBe(0); expect(m[5]).toBe(1); expect(m[6]).toBe(0); expect(m[7]).toBe(0);
    expect(m[8]).toBe(0); expect(m[9]).toBe(0); expect(m[10]).toBe(1); expect(m[11]).toBe(0);
    expect(m[12]).toBe(0); expect(m[13]).toBe(0); expect(m[14]).toBe(0); expect(m[15]).toBe(1);
  });

  it('should create from row-order values stored column-major', () => {
    const m = Mat4.create(
      1, 2, 3, 4,
      5, 6, 7, 8,
      9, 10, 11, 12,
      13, 14, 15, 16,
    );
    // Column 0: [1, 5, 9, 13]
    expect(m[0]).toBe(1); expect(m[1]).toBe(5); expect(m[2]).toBe(9); expect(m[3]).toBe(13);
    // Column 1: [2, 6, 10, 14]
    expect(m[4]).toBe(2); expect(m[5]).toBe(6); expect(m[6]).toBe(10); expect(m[7]).toBe(14);
    // Column 2: [3, 7, 11, 15]
    expect(m[8]).toBe(3); expect(m[9]).toBe(7); expect(m[10]).toBe(11); expect(m[11]).toBe(15);
    // Column 3: [4, 8, 12, 16]
    expect(m[12]).toBe(4); expect(m[13]).toBe(8); expect(m[14]).toBe(12); expect(m[15]).toBe(16);
  });

  it('should create with defaults to zero', () => {
    const m = Mat4.create();
    for (let i = 0; i < 16; i++) {
      expect(m[i]).toBe(0);
    }
  });

  it('should clone', () => {
    const a = Mat4.identity();
    const b = Mat4.clone(a);
    b[0] = 99;
    expect(a[0]).toBe(1);
  });

  it('should multiply with identity', () => {
    const a = Mat4.create(
      1, 2, 3, 4,
      5, 6, 7, 8,
      9, 10, 11, 12,
      13, 14, 15, 16,
    );
    const id = Mat4.identity();
    const r = Mat4.identity();
    Mat4.multiply(a, id, r);
    for (let i = 0; i < 16; i++) {
      expect(r[i]).toBeCloseTo(a[i]);
    }
  });

  it('should multiply associativity: (A*B)*C = A*(B*C)', () => {
    const a = Mat4.create(
      1, 2, 3, 4,
      5, 6, 7, 8,
      9, 10, 11, 12,
      13, 14, 15, 16,
    );
    const b = Mat4.create(
      16, 15, 14, 13,
      12, 11, 10, 9,
      8, 7, 6, 5,
      4, 3, 2, 1,
    );
    const c = Mat4.create(
      2, 0, 0, 1,
      0, 3, 0, 2,
      0, 0, 4, 3,
      0, 0, 0, 1,
    );

    // (A * B) * C
    const ab = Mat4.identity();
    Mat4.multiply(a, b, ab);
    const abc1 = Mat4.identity();
    Mat4.multiply(ab, c, abc1);

    // A * (B * C)
    const bc = Mat4.identity();
    Mat4.multiply(b, c, bc);
    const abc2 = Mat4.identity();
    Mat4.multiply(a, bc, abc2);

    for (let i = 0; i < 16; i++) {
      expect(abc1[i]).toBeCloseTo(abc2[i], 10);
    }
  });

  it('should multiply by vector (Mat4 x Vec4)', () => {
    const m = Mat4.identity();
    const v = Vec4.create(1, 2, 3, 1);
    const r = Vec4.zero();
    Mat4.multiplyByVector(m, v, r);
    expect(r[0]).toBeCloseTo(1);
    expect(r[1]).toBeCloseTo(2);
    expect(r[2]).toBeCloseTo(3);
    expect(r[3]).toBeCloseTo(1);
  });

  it('should multiply by vector with translation matrix', () => {
    const m = Mat4.identity();
    Mat4.fromTranslation(Vec3.create(10, 20, 30), m);
    const v = Vec4.create(1, 2, 3, 1);
    const r = Vec4.zero();
    Mat4.multiplyByVector(m, v, r);
    expect(r[0]).toBeCloseTo(11);
    expect(r[1]).toBeCloseTo(22);
    expect(r[2]).toBeCloseTo(33);
    expect(r[3]).toBeCloseTo(1);
  });

  it('should multiply by point (Mat4 x Vec3 with w=1, perspective divide)', () => {
    const m = Mat4.identity();
    Mat4.fromTranslation(Vec3.create(10, 20, 30), m);
    const p = Vec3.create(1, 2, 3);
    const r = Vec3.zero();
    Mat4.multiplyByPoint(m, p, r);
    expect(r[0]).toBeCloseTo(11);
    expect(r[1]).toBeCloseTo(22);
    expect(r[2]).toBeCloseTo(33);
  });

  it('should transpose', () => {
    const m = Mat4.create(
      1, 2, 3, 4,
      5, 6, 7, 8,
      9, 10, 11, 12,
      13, 14, 15, 16,
    );
    const r = Mat4.identity();
    Mat4.transpose(m, r);
    const expected = Mat4.create(
      1, 5, 9, 13,
      2, 6, 10, 14,
      3, 7, 11, 15,
      4, 8, 12, 16,
    );
    for (let i = 0; i < 16; i++) {
      expect(r[i]).toBeCloseTo(expected[i]);
    }
  });

  it('should compute determinant of identity as 1', () => {
    const m = Mat4.identity();
    expect(Mat4.determinant(m)).toBeCloseTo(1);
  });

  it('should compute determinant', () => {
    const m = Mat4.create(
      1, 0, 2, -1,
      3, 0, 0, 5,
      2, 1, 4, -3,
      1, 0, 5, 0,
    );
    // Known determinant = 30
    expect(Mat4.determinant(m)).toBeCloseTo(30);
  });

  it('should compute inverse (A * A^-1 = I)', () => {
    const m = Mat4.create(
      1, 0, 2, -1,
      3, 0, 0, 5,
      2, 1, 4, -3,
      1, 0, 5, 0,
    );
    const inv = Mat4.identity();
    Mat4.inverse(m, inv);
    const product = Mat4.identity();
    Mat4.multiply(m, inv, product);
    const id = Mat4.identity();
    for (let i = 0; i < 16; i++) {
      expect(product[i]).toBeCloseTo(id[i], 10);
    }
  });

  it('should compute inverse of identity as identity', () => {
    const id = Mat4.identity();
    const inv = Mat4.identity();
    Mat4.inverse(id, inv);
    for (let i = 0; i < 16; i++) {
      expect(inv[i]).toBeCloseTo(id[i]);
    }
  });

  it('should create translation matrix', () => {
    const t = Vec3.create(5, 10, 15);
    const m = Mat4.identity();
    Mat4.fromTranslation(t, m);
    // Translation is in column 3 (indices 12, 13, 14)
    expect(m[0]).toBe(1); expect(m[5]).toBe(1); expect(m[10]).toBe(1); expect(m[15]).toBe(1);
    expect(m[12]).toBe(5); expect(m[13]).toBe(10); expect(m[14]).toBe(15);
  });

  it('should create scale matrix', () => {
    const s = Vec3.create(2, 3, 4);
    const m = Mat4.identity();
    Mat4.fromScale(s, m);
    expect(m[0]).toBe(2); expect(m[5]).toBe(3); expect(m[10]).toBe(4); expect(m[15]).toBe(1);
    // Off-diagonals zero
    expect(m[1]).toBe(0); expect(m[4]).toBe(0); expect(m[12]).toBe(0);
  });

  it('should create rotation X matrix (90 degrees rotates Y to Z)', () => {
    const angle = Math.PI / 2;
    const m = Mat4.identity();
    Mat4.fromRotationX(angle, m);
    const v = Vec4.create(0, 1, 0, 1);
    const r = Vec4.zero();
    Mat4.multiplyByVector(m, v, r);
    expect(r[0]).toBeCloseTo(0);
    expect(r[1]).toBeCloseTo(0);
    expect(r[2]).toBeCloseTo(1);
    expect(r[3]).toBeCloseTo(1);
  });

  it('should create rotation Y matrix (90 degrees rotates Z to X)', () => {
    const angle = Math.PI / 2;
    const m = Mat4.identity();
    Mat4.fromRotationY(angle, m);
    const v = Vec4.create(0, 0, 1, 1);
    const r = Vec4.zero();
    Mat4.multiplyByVector(m, v, r);
    expect(r[0]).toBeCloseTo(1);
    expect(r[1]).toBeCloseTo(0);
    expect(r[2]).toBeCloseTo(0);
    expect(r[3]).toBeCloseTo(1);
  });

  it('should create rotation Z matrix (90 degrees rotates X to Y)', () => {
    const angle = Math.PI / 2;
    const m = Mat4.identity();
    Mat4.fromRotationZ(angle, m);
    const v = Vec4.create(1, 0, 0, 1);
    const r = Vec4.zero();
    Mat4.multiplyByVector(m, v, r);
    expect(r[0]).toBeCloseTo(0);
    expect(r[1]).toBeCloseTo(1);
    expect(r[2]).toBeCloseTo(0);
    expect(r[3]).toBeCloseTo(1);
  });

  it('should create rotation X with known angle (180 degrees)', () => {
    const m = Mat4.identity();
    Mat4.fromRotationX(Math.PI, m);
    const v = Vec4.create(0, 1, 0, 1);
    const r = Vec4.zero();
    Mat4.multiplyByVector(m, v, r);
    expect(r[0]).toBeCloseTo(0);
    expect(r[1]).toBeCloseTo(-1);
    expect(r[2]).toBeCloseTo(0);
    expect(r[3]).toBeCloseTo(1);
  });

  it('should create rotation Y with known angle (180 degrees)', () => {
    const m = Mat4.identity();
    Mat4.fromRotationY(Math.PI, m);
    const v = Vec4.create(1, 0, 0, 1);
    const r = Vec4.zero();
    Mat4.multiplyByVector(m, v, r);
    expect(r[0]).toBeCloseTo(-1);
    expect(r[1]).toBeCloseTo(0);
    expect(r[2]).toBeCloseTo(0);
    expect(r[3]).toBeCloseTo(1);
  });

  it('should create rotation Z with known angle (180 degrees)', () => {
    const m = Mat4.identity();
    Mat4.fromRotationZ(Math.PI, m);
    const v = Vec4.create(1, 0, 0, 1);
    const r = Vec4.zero();
    Mat4.multiplyByVector(m, v, r);
    expect(r[0]).toBeCloseTo(-1);
    expect(r[1]).toBeCloseTo(0);
    expect(r[2]).toBeCloseTo(0);
    expect(r[3]).toBeCloseTo(1);
  });

  it('should round-trip fromTranslation + getTranslation', () => {
    const t = Vec3.create(3, 7, -11);
    const m = Mat4.identity();
    Mat4.fromTranslation(t, m);
    const extracted = Vec3.zero();
    Mat4.getTranslation(m, extracted);
    expect(extracted[0]).toBeCloseTo(3);
    expect(extracted[1]).toBeCloseTo(7);
    expect(extracted[2]).toBeCloseTo(-11);
  });

  it('should get translation from a complex matrix', () => {
    const m = Mat4.create(
      1, 0, 0, 10,
      0, 1, 0, 20,
      0, 0, 1, 30,
      0, 0, 0, 1,
    );
    const t = Vec3.zero();
    Mat4.getTranslation(m, t);
    expect(t[0]).toBeCloseTo(10);
    expect(t[1]).toBeCloseTo(20);
    expect(t[2]).toBeCloseTo(30);
  });

  it('should get rotation (upper-left 3x3)', () => {
    const angle = Math.PI / 4;
    const m = Mat4.identity();
    Mat4.fromRotationZ(angle, m);
    const rot = Mat3.identity();
    Mat4.getRotation(m, rot);
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    // Column-major 3x3: col0=[c,s,0], col1=[-s,c,0], col2=[0,0,1]
    expect(rot[0]).toBeCloseTo(c);
    expect(rot[1]).toBeCloseTo(s);
    expect(rot[2]).toBeCloseTo(0);
    expect(rot[3]).toBeCloseTo(-s);
    expect(rot[4]).toBeCloseTo(c);
    expect(rot[5]).toBeCloseTo(0);
    expect(rot[6]).toBeCloseTo(0);
    expect(rot[7]).toBeCloseTo(0);
    expect(rot[8]).toBeCloseTo(1);
  });

  it('should compute perspective projection (near plane maps correctly)', () => {
    const fovY = Math.PI / 2; // 90 degrees
    const aspect = 1.0;
    const near = 0.1;
    const far = 100.0;
    const m = Mat4.identity();
    Mat4.computePerspectiveFieldOfView(fovY, aspect, near, far, m);

    // A point at the near plane center should map to z = 0 in NDC (WebGPU: [0, 1])
    const nearPoint = Vec4.create(0, 0, -near, 1);
    const r = Vec4.zero();
    Mat4.multiplyByVector(m, nearPoint, r);
    const ndcZ = r[2] / r[3];
    expect(ndcZ).toBeCloseTo(0);

    // A point at the far plane should map to z = 1 in NDC
    const farPoint = Vec4.create(0, 0, -far, 1);
    Mat4.multiplyByVector(m, farPoint, r);
    const ndcZFar = r[2] / r[3];
    expect(ndcZFar).toBeCloseTo(1);
  });

  it('should compute perspective projection field of view', () => {
    const fovY = Math.PI / 4; // 45 degrees
    const aspect = 16.0 / 9.0;
    const near = 1.0;
    const far = 1000.0;
    const m = Mat4.identity();
    Mat4.computePerspectiveFieldOfView(fovY, aspect, near, far, m);

    // m[0] = 1 / (aspect * tan(fovY/2))
    // m[5] = 1 / tan(fovY/2)
    const tanHalfFov = Math.tan(fovY / 2);
    expect(m[0]).toBeCloseTo(1.0 / (aspect * tanHalfFov));
    expect(m[5]).toBeCloseTo(1.0 / tanHalfFov);
    // m[15] should be 0 for perspective (w = -z)
    expect(m[15]).toBe(0);
    expect(m[11]).toBe(-1);
  });

  it('should compute orthographic projection', () => {
    const left = -10, right = 10, bottom = -5, top = 5, near = 0.1, far = 100;
    const m = Mat4.identity();
    Mat4.computeOrthographic(left, right, bottom, top, near, far, m);

    // Center point should map to origin in NDC
    const center = Vec4.create(0, 0, -(near + far) / 2, 1);
    const r = Vec4.zero();
    Mat4.multiplyByVector(m, center, r);
    expect(r[0] / r[3]).toBeCloseTo(0);
    expect(r[1] / r[3]).toBeCloseTo(0);
    expect(r[2] / r[3]).toBeCloseTo(0.5); // WebGPU: midpoint maps to 0.5

    // Near plane center maps to z=0
    const nearPoint = Vec4.create(0, 0, -near, 1);
    Mat4.multiplyByVector(m, nearPoint, r);
    expect(r[2] / r[3]).toBeCloseTo(0);

    // Far plane center maps to z=1
    const farPoint = Vec4.create(0, 0, -far, 1);
    Mat4.multiplyByVector(m, farPoint, r);
    expect(r[2] / r[3]).toBeCloseTo(1);
  });

  it('should compute lookAt (eye on z-axis looking at origin)', () => {
    const eye = Vec3.create(0, 0, 5);
    const target = Vec3.create(0, 0, 0);
    const up = Vec3.create(0, 1, 0);
    const m = Mat4.identity();
    Mat4.lookAt(eye, target, up, m);

    // The origin (target) should be at (0, 0, -5) in view space
    const origin = Vec4.create(0, 0, 0, 1);
    const r = Vec4.zero();
    Mat4.multiplyByVector(m, origin, r);
    expect(r[0]).toBeCloseTo(0);
    expect(r[1]).toBeCloseTo(0);
    expect(r[2]).toBeCloseTo(-5);
    expect(r[3]).toBeCloseTo(1);

    // The eye itself should be at origin in view space
    const eyeV = Vec4.create(0, 0, 5, 1);
    Mat4.multiplyByVector(m, eyeV, r);
    expect(r[0]).toBeCloseTo(0);
    expect(r[1]).toBeCloseTo(0);
    expect(r[2]).toBeCloseTo(0);
    expect(r[3]).toBeCloseTo(1);
  });

  it('should compute lookAt with off-axis eye', () => {
    const eye = Vec3.create(1, 0, 0);
    const target = Vec3.create(0, 0, 0);
    const up = Vec3.create(0, 1, 0);
    const m = Mat4.identity();
    Mat4.lookAt(eye, target, up, m);

    // Eye should map to origin in view space
    const eyeV = Vec4.create(1, 0, 0, 1);
    const r = Vec4.zero();
    Mat4.multiplyByVector(m, eyeV, r);
    expect(r[0]).toBeCloseTo(0);
    expect(r[1]).toBeCloseTo(0);
    expect(r[2]).toBeCloseTo(0);
    expect(r[3]).toBeCloseTo(1);
  });

  it('should build fromTranslationRotationScale basic case', () => {
    // Translation only (identity rotation, unit scale)
    const t = Vec3.create(1, 2, 3);
    const qIdentity = new Float64Array([0, 0, 0, 1]); // identity quaternion [x,y,z,w]
    const s = Vec3.create(1, 1, 1);
    const m = Mat4.identity();
    Mat4.fromTranslationRotationScale(t, qIdentity, s, m);

    // Should be equivalent to a pure translation matrix
    const expected = Mat4.identity();
    Mat4.fromTranslation(t, expected);
    for (let i = 0; i < 16; i++) {
      expect(m[i]).toBeCloseTo(expected[i], 10);
    }
  });

  it('should build fromTranslationRotationScale with scale', () => {
    const t = Vec3.create(0, 0, 0);
    const qIdentity = new Float64Array([0, 0, 0, 1]);
    const s = Vec3.create(2, 3, 4);
    const m = Mat4.identity();
    Mat4.fromTranslationRotationScale(t, qIdentity, s, m);

    // Should be equivalent to a pure scale matrix
    const expected = Mat4.identity();
    Mat4.fromScale(s, expected);
    for (let i = 0; i < 16; i++) {
      expect(m[i]).toBeCloseTo(expected[i], 10);
    }
  });

  it('should build fromTranslationRotationScale with 90-degree Z rotation', () => {
    const t = Vec3.create(0, 0, 0);
    // Quaternion for 90-degree rotation around Z: [0, 0, sin(45), cos(45)]
    const halfAngle = Math.PI / 4;
    const q = new Float64Array([0, 0, Math.sin(halfAngle), Math.cos(halfAngle)]);
    const s = Vec3.create(1, 1, 1);
    const m = Mat4.identity();
    Mat4.fromTranslationRotationScale(t, q, s, m);

    // Apply to (1, 0, 0) should give (0, 1, 0)
    const v = Vec4.create(1, 0, 0, 1);
    const r = Vec4.zero();
    Mat4.multiplyByVector(m, v, r);
    expect(r[0]).toBeCloseTo(0);
    expect(r[1]).toBeCloseTo(1);
    expect(r[2]).toBeCloseTo(0);
  });

  it('should check equality with epsilon', () => {
    const a = Mat4.identity();
    const b = Mat4.identity();
    b[0] = 1 + 1e-8;
    expect(Mat4.equalsEpsilon(a, b, 1e-7)).toBe(true);
    expect(Mat4.equalsEpsilon(a, b, 1e-9)).toBe(false);
  });

  it('should support in-place transpose', () => {
    const m = Mat4.create(
      1, 2, 3, 4,
      5, 6, 7, 8,
      9, 10, 11, 12,
      13, 14, 15, 16,
    );
    Mat4.transpose(m, m);
    const expected = Mat4.create(
      1, 5, 9, 13,
      2, 6, 10, 14,
      3, 7, 11, 15,
      4, 8, 12, 16,
    );
    for (let i = 0; i < 16; i++) {
      expect(m[i]).toBeCloseTo(expected[i]);
    }
  });

  it('should return result for chaining', () => {
    const m = Mat4.identity();
    const r = Mat4.identity();
    const returned = Mat4.transpose(m, r);
    expect(returned).toBe(r);

    const r2 = Mat4.identity();
    const returned2 = Mat4.multiply(m, r, r2);
    expect(returned2).toBe(r2);
  });
});
