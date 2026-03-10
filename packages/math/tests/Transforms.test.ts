import { describe, it, expect } from 'vitest';
import { Transforms } from '../src/Transforms';
import { Ellipsoid } from '../src/Ellipsoid';
import { Cartographic } from '../src/Cartographic';
import { Vec3 } from '../src/Vec3';
import { Mat4 } from '../src/Mat4';
import { Quaternion } from '../src/Quaternion';
import { VelMath } from '../src/MathUtils';

/**
 * Helper: check that the upper-left 3x3 of a column-major Mat4 is orthonormal.
 *   - Each column vector has unit length.
 *   - Columns are mutually orthogonal (dot products ~ 0).
 *   - Determinant of the 3x3 block ~ +1 (proper rotation, no reflection).
 */
function expectOrthonormal(m: Float64Array, eps: number = VelMath.EPSILON7): void {
  // Extract column vectors (upper 3 components only)
  const c0 = Vec3.create(m[0], m[1], m[2]);
  const c1 = Vec3.create(m[4], m[5], m[6]);
  const c2 = Vec3.create(m[8], m[9], m[10]);

  // Unit length
  expect(Math.abs(Vec3.magnitude(c0) - 1.0)).toBeLessThan(eps);
  expect(Math.abs(Vec3.magnitude(c1) - 1.0)).toBeLessThan(eps);
  expect(Math.abs(Vec3.magnitude(c2) - 1.0)).toBeLessThan(eps);

  // Mutual orthogonality
  expect(Math.abs(Vec3.dot(c0, c1))).toBeLessThan(eps);
  expect(Math.abs(Vec3.dot(c0, c2))).toBeLessThan(eps);
  expect(Math.abs(Vec3.dot(c1, c2))).toBeLessThan(eps);

  // Determinant of 3x3 block ~ +1
  const det3 =
    m[0] * (m[5] * m[10] - m[6] * m[9]) -
    m[4] * (m[1] * m[10] - m[2] * m[9]) +
    m[8] * (m[1] * m[6] - m[2] * m[5]);
  expect(Math.abs(det3 - 1.0)).toBeLessThan(eps);
}

describe('Transforms', () => {
  // ---- eastNorthUpToFixedFrame ----
  describe('eastNorthUpToFixedFrame', () => {
    it('at equator (0, 0): east should point roughly toward +Y in ECEF', () => {
      const origin = Vec3.zero();
      Ellipsoid.cartographicToCartesian(
        Ellipsoid.WGS84,
        Cartographic.fromDegrees(0, 0, 0),
        origin,
      );

      const result = new Float64Array(16);
      Transforms.eastNorthUpToFixedFrame(origin, Ellipsoid.WGS84, result);

      // Column 0 = east direction in ECEF
      const eastX = result[0];
      const eastY = result[1];
      const eastZ = result[2];

      // At (lon=0, lat=0), east should be ~(0, 1, 0) in ECEF
      expect(Math.abs(eastX)).toBeLessThan(VelMath.EPSILON7);
      expect(eastY).toBeGreaterThan(0.99);
      expect(Math.abs(eastZ)).toBeLessThan(VelMath.EPSILON7);
    });

    it('at equator (0, 0): north should point roughly toward -Z in ECEF (toward north pole along surface)', () => {
      const origin = Vec3.zero();
      Ellipsoid.cartographicToCartesian(
        Ellipsoid.WGS84,
        Cartographic.fromDegrees(0, 0, 0),
        origin,
      );

      const result = new Float64Array(16);
      Transforms.eastNorthUpToFixedFrame(origin, Ellipsoid.WGS84, result);

      // Column 1 = north direction in ECEF
      // At (lon=0, lat=0): north is tangent to surface pointing toward the pole.
      // On an oblate spheroid it should be dominantly +Z with a small -X component.
      const northX = result[4];
      const northY = result[5];
      const northZ = result[6];

      // North should have a positive Z component (pointing up toward north pole)
      expect(northZ).toBeGreaterThan(0.99);
      expect(Math.abs(northY)).toBeLessThan(VelMath.EPSILON7);
      // Small negative X component due to oblate shape is acceptable
      expect(Math.abs(northX)).toBeLessThan(0.01);
    });

    it('at equator (0, 0): up should point roughly toward +X in ECEF', () => {
      const origin = Vec3.zero();
      Ellipsoid.cartographicToCartesian(
        Ellipsoid.WGS84,
        Cartographic.fromDegrees(0, 0, 0),
        origin,
      );

      const result = new Float64Array(16);
      Transforms.eastNorthUpToFixedFrame(origin, Ellipsoid.WGS84, result);

      // Column 2 = up direction in ECEF
      const upX = result[8];
      const upY = result[9];
      const upZ = result[10];

      // At (lon=0, lat=0), surface normal (up) ~ (1, 0, 0) in ECEF
      expect(upX).toBeGreaterThan(0.99);
      expect(Math.abs(upY)).toBeLessThan(VelMath.EPSILON7);
      expect(Math.abs(upZ)).toBeLessThan(0.01);
    });

    it('produces an orthonormal matrix at equator (0, 0)', () => {
      const origin = Vec3.zero();
      Ellipsoid.cartographicToCartesian(
        Ellipsoid.WGS84,
        Cartographic.fromDegrees(0, 0, 0),
        origin,
      );

      const result = new Float64Array(16);
      Transforms.eastNorthUpToFixedFrame(origin, Ellipsoid.WGS84, result);

      expectOrthonormal(result);
    });

    it('at north pole: produces valid orthonormal frame (not NaN)', () => {
      const origin = Vec3.zero();
      Ellipsoid.cartographicToCartesian(
        Ellipsoid.WGS84,
        Cartographic.fromDegrees(0, 90, 0),
        origin,
      );

      const result = new Float64Array(16);
      Transforms.eastNorthUpToFixedFrame(origin, Ellipsoid.WGS84, result);

      // No NaN values
      for (let i = 0; i < 16; i++) {
        expect(Number.isNaN(result[i])).toBe(false);
      }

      // Still orthonormal
      expectOrthonormal(result);

      // Up at north pole should be ~(0, 0, 1)
      const upX = result[8];
      const upY = result[9];
      const upZ = result[10];
      expect(Math.abs(upX)).toBeLessThan(VelMath.EPSILON7);
      expect(Math.abs(upY)).toBeLessThan(VelMath.EPSILON7);
      expect(Math.abs(upZ - 1.0)).toBeLessThan(VelMath.EPSILON7);
    });

    it('at south pole: produces valid orthonormal frame', () => {
      const origin = Vec3.zero();
      Ellipsoid.cartographicToCartesian(
        Ellipsoid.WGS84,
        Cartographic.fromDegrees(0, -90, 0),
        origin,
      );

      const result = new Float64Array(16);
      Transforms.eastNorthUpToFixedFrame(origin, Ellipsoid.WGS84, result);

      // No NaN
      for (let i = 0; i < 16; i++) {
        expect(Number.isNaN(result[i])).toBe(false);
      }

      expectOrthonormal(result);

      // Up at south pole should be ~(0, 0, -1)
      const upZ = result[10];
      expect(Math.abs(upZ - (-1.0))).toBeLessThan(VelMath.EPSILON7);
    });

    it('translation column equals origin', () => {
      const origin = Vec3.zero();
      Ellipsoid.cartographicToCartesian(
        Ellipsoid.WGS84,
        Cartographic.fromDegrees(30, 45, 100),
        origin,
      );

      const result = new Float64Array(16);
      Transforms.eastNorthUpToFixedFrame(origin, Ellipsoid.WGS84, result);

      expect(result[12]).toBeCloseTo(origin[0], 6);
      expect(result[13]).toBeCloseTo(origin[1], 6);
      expect(result[14]).toBeCloseTo(origin[2], 6);
      expect(result[15]).toBe(1);
    });
  });

  // ---- northEastDownToFixedFrame ----
  describe('northEastDownToFixedFrame', () => {
    it('at equator (0, 0): columns are [north, east, down]', () => {
      const origin = Vec3.zero();
      Ellipsoid.cartographicToCartesian(
        Ellipsoid.WGS84,
        Cartographic.fromDegrees(0, 0, 0),
        origin,
      );

      const enu = new Float64Array(16);
      const ned = new Float64Array(16);
      Transforms.eastNorthUpToFixedFrame(origin, Ellipsoid.WGS84, enu);
      Transforms.northEastDownToFixedFrame(origin, Ellipsoid.WGS84, ned);

      // NED column 0 (north) should equal ENU column 1 (north)
      expect(ned[0]).toBeCloseTo(enu[4], 10);
      expect(ned[1]).toBeCloseTo(enu[5], 10);
      expect(ned[2]).toBeCloseTo(enu[6], 10);

      // NED column 1 (east) should equal ENU column 0 (east)
      expect(ned[4]).toBeCloseTo(enu[0], 10);
      expect(ned[5]).toBeCloseTo(enu[1], 10);
      expect(ned[6]).toBeCloseTo(enu[2], 10);

      // NED column 2 (down) should equal -ENU column 2 (up)
      expect(ned[8]).toBeCloseTo(-enu[8], 10);
      expect(ned[9]).toBeCloseTo(-enu[9], 10);
      expect(ned[10]).toBeCloseTo(-enu[10], 10);
    });

    it('produces an orthonormal matrix', () => {
      const origin = Vec3.zero();
      Ellipsoid.cartographicToCartesian(
        Ellipsoid.WGS84,
        Cartographic.fromDegrees(45, 30, 0),
        origin,
      );

      const result = new Float64Array(16);
      Transforms.northEastDownToFixedFrame(origin, Ellipsoid.WGS84, result);

      expectOrthonormal(result);
    });
  });

  // ---- headingPitchRollToFixedFrame ----
  describe('headingPitchRollToFixedFrame', () => {
    it('with heading=0, pitch=0, roll=0 at equator: should equal ENU frame', () => {
      const origin = Vec3.zero();
      Ellipsoid.cartographicToCartesian(
        Ellipsoid.WGS84,
        Cartographic.fromDegrees(0, 0, 0),
        origin,
      );

      const enu = new Float64Array(16);
      Transforms.eastNorthUpToFixedFrame(origin, Ellipsoid.WGS84, enu);

      const hpr = new Float64Array(16);
      Transforms.headingPitchRollToFixedFrame(origin, 0, 0, 0, Ellipsoid.WGS84, hpr);

      expect(Mat4.equalsEpsilon(enu, hpr, VelMath.EPSILON7)).toBe(true);
    });

    it('produces an orthonormal matrix with non-zero heading', () => {
      const origin = Vec3.zero();
      Ellipsoid.cartographicToCartesian(
        Ellipsoid.WGS84,
        Cartographic.fromDegrees(0, 0, 0),
        origin,
      );

      const result = new Float64Array(16);
      Transforms.headingPitchRollToFixedFrame(
        origin, Math.PI / 4, 0, 0, Ellipsoid.WGS84, result,
      );

      expectOrthonormal(result);
    });

    it('produces an orthonormal matrix with heading, pitch, and roll', () => {
      const origin = Vec3.zero();
      Ellipsoid.cartographicToCartesian(
        Ellipsoid.WGS84,
        Cartographic.fromDegrees(45, 30, 500),
        origin,
      );

      const result = new Float64Array(16);
      Transforms.headingPitchRollToFixedFrame(
        origin,
        VelMath.toRadians(45),
        VelMath.toRadians(10),
        VelMath.toRadians(-5),
        Ellipsoid.WGS84,
        result,
      );

      expectOrthonormal(result);
    });

    it('translation column equals origin', () => {
      const origin = Vec3.zero();
      Ellipsoid.cartographicToCartesian(
        Ellipsoid.WGS84,
        Cartographic.fromDegrees(0, 0, 0),
        origin,
      );

      const result = new Float64Array(16);
      Transforms.headingPitchRollToFixedFrame(
        origin, Math.PI / 6, Math.PI / 12, 0, Ellipsoid.WGS84, result,
      );

      expect(result[12]).toBeCloseTo(origin[0], 6);
      expect(result[13]).toBeCloseTo(origin[1], 6);
      expect(result[14]).toBeCloseTo(origin[2], 6);
      expect(result[15]).toBe(1);
    });

    it('determinant of 4x4 matrix is ~ +1 (no scale)', () => {
      const origin = Vec3.zero();
      Ellipsoid.cartographicToCartesian(
        Ellipsoid.WGS84,
        Cartographic.fromDegrees(120, -35, 200),
        origin,
      );

      const result = new Float64Array(16);
      Transforms.headingPitchRollToFixedFrame(
        origin,
        VelMath.toRadians(90),
        VelMath.toRadians(20),
        VelMath.toRadians(-10),
        Ellipsoid.WGS84,
        result,
      );

      expect(Math.abs(Mat4.determinant(result) - 1.0)).toBeLessThan(VelMath.EPSILON7);
    });
  });

  // ---- headingPitchRollQuaternion ----
  describe('headingPitchRollQuaternion', () => {
    it('produces a unit quaternion', () => {
      const origin = Vec3.zero();
      Ellipsoid.cartographicToCartesian(
        Ellipsoid.WGS84,
        Cartographic.fromDegrees(0, 0, 0),
        origin,
      );

      const q = new Float64Array(4);
      Transforms.headingPitchRollQuaternion(origin, 0, 0, 0, Ellipsoid.WGS84, q);

      expect(Math.abs(Quaternion.magnitude(q) - 1.0)).toBeLessThan(VelMath.EPSILON7);
    });

    it('is consistent with headingPitchRollToFixedFrame rotation at equator', () => {
      const origin = Vec3.zero();
      Ellipsoid.cartographicToCartesian(
        Ellipsoid.WGS84,
        Cartographic.fromDegrees(0, 0, 0),
        origin,
      );

      const heading = VelMath.toRadians(30);
      const pitch = VelMath.toRadians(15);
      const roll = VelMath.toRadians(-5);

      // Get matrix from headingPitchRollToFixedFrame
      const mat = new Float64Array(16);
      Transforms.headingPitchRollToFixedFrame(origin, heading, pitch, roll, Ellipsoid.WGS84, mat);

      // Get quaternion
      const q = new Float64Array(4);
      Transforms.headingPitchRollQuaternion(origin, heading, pitch, roll, Ellipsoid.WGS84, q);

      // Convert quaternion back to Mat3
      const rot3 = new Float64Array(9);
      Quaternion.toRotationMatrix(q, rot3);

      // The upper-left 3x3 of the matrix should match the quaternion rotation matrix.
      // Column 0
      expect(Math.abs(mat[0] - rot3[0])).toBeLessThan(VelMath.EPSILON7);
      expect(Math.abs(mat[1] - rot3[1])).toBeLessThan(VelMath.EPSILON7);
      expect(Math.abs(mat[2] - rot3[2])).toBeLessThan(VelMath.EPSILON7);
      // Column 1
      expect(Math.abs(mat[4] - rot3[3])).toBeLessThan(VelMath.EPSILON7);
      expect(Math.abs(mat[5] - rot3[4])).toBeLessThan(VelMath.EPSILON7);
      expect(Math.abs(mat[6] - rot3[5])).toBeLessThan(VelMath.EPSILON7);
      // Column 2
      expect(Math.abs(mat[8] - rot3[6])).toBeLessThan(VelMath.EPSILON7);
      expect(Math.abs(mat[9] - rot3[7])).toBeLessThan(VelMath.EPSILON7);
      expect(Math.abs(mat[10] - rot3[8])).toBeLessThan(VelMath.EPSILON7);
    });

    it('is consistent with headingPitchRollToFixedFrame at an arbitrary location', () => {
      const origin = Vec3.zero();
      Ellipsoid.cartographicToCartesian(
        Ellipsoid.WGS84,
        Cartographic.fromDegrees(120, -35, 200),
        origin,
      );

      const heading = VelMath.toRadians(90);
      const pitch = VelMath.toRadians(20);
      const roll = VelMath.toRadians(-10);

      const mat = new Float64Array(16);
      Transforms.headingPitchRollToFixedFrame(origin, heading, pitch, roll, Ellipsoid.WGS84, mat);

      const q = new Float64Array(4);
      Transforms.headingPitchRollQuaternion(origin, heading, pitch, roll, Ellipsoid.WGS84, q);

      const rot3 = new Float64Array(9);
      Quaternion.toRotationMatrix(q, rot3);

      // Check each element of the 3x3 rotation block
      const eps = VelMath.EPSILON7;
      expect(Math.abs(mat[0] - rot3[0])).toBeLessThan(eps);
      expect(Math.abs(mat[1] - rot3[1])).toBeLessThan(eps);
      expect(Math.abs(mat[2] - rot3[2])).toBeLessThan(eps);
      expect(Math.abs(mat[4] - rot3[3])).toBeLessThan(eps);
      expect(Math.abs(mat[5] - rot3[4])).toBeLessThan(eps);
      expect(Math.abs(mat[6] - rot3[5])).toBeLessThan(eps);
      expect(Math.abs(mat[8] - rot3[6])).toBeLessThan(eps);
      expect(Math.abs(mat[9] - rot3[7])).toBeLessThan(eps);
      expect(Math.abs(mat[10] - rot3[8])).toBeLessThan(eps);
    });

    it('with all-zero HPR produces same quaternion as the ENU frame rotation', () => {
      const origin = Vec3.zero();
      Ellipsoid.cartographicToCartesian(
        Ellipsoid.WGS84,
        Cartographic.fromDegrees(0, 0, 0),
        origin,
      );

      const q = new Float64Array(4);
      Transforms.headingPitchRollQuaternion(origin, 0, 0, 0, Ellipsoid.WGS84, q);

      // Build ENU matrix and extract quaternion from its 3x3
      const enu = new Float64Array(16);
      Transforms.eastNorthUpToFixedFrame(origin, Ellipsoid.WGS84, enu);

      const enuRot3 = new Float64Array(9);
      Mat4.getRotation(enu, enuRot3);
      const qEnu = Quaternion.create();
      Quaternion.fromRotationMatrix(enuRot3, qEnu);

      // Quaternions q and -q represent the same rotation, so compare with sign flexibility
      const sameSign = Quaternion.equalsEpsilon(q, qEnu, VelMath.EPSILON7);
      const negQ = Quaternion.create(-qEnu[0], -qEnu[1], -qEnu[2], -qEnu[3]);
      const oppositeSign = Quaternion.equalsEpsilon(q, negQ, VelMath.EPSILON7);
      expect(sameSign || oppositeSign).toBe(true);
    });
  });
});
