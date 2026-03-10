import { Vec3 } from './Vec3';
import type { Vec3Type } from './Vec3';
import type { Mat4Type } from './Mat4';
import type { Mat3Type } from './Mat3';
import { Quaternion } from './Quaternion';
import type { QuaternionType } from './Quaternion';
import { Ellipsoid } from './Ellipsoid';
import type { EllipsoidType } from './Ellipsoid';
import { VelMath } from './MathUtils';

// Scratch variables to avoid per-call allocations
const scratchUp = new Float64Array(3);
const scratchEast = new Float64Array(3);
const scratchNorth = new Float64Array(3);
const scratchZAxis = new Float64Array(3) as Vec3Type;
scratchZAxis[2] = 1.0;
const scratchXAxis = new Float64Array(3) as Vec3Type;
scratchXAxis[0] = 1.0;

const scratchQHeading = new Float64Array(4);
const scratchQPitch = new Float64Array(4);
const scratchQRoll = new Float64Array(4);
const scratchQTemp = new Float64Array(4);
const scratchRotMat3 = new Float64Array(9);
const scratchRotMat4 = new Float64Array(16);
const scratchEnuMat4 = new Float64Array(16);

/**
 * Compute ENU (East-North-Up) axes at a given ECEF position on an ellipsoid.
 *
 * Up = geodetic surface normal at the position.
 * East = cross(north_approx, up) where north_approx comes from cross(up, zAxis).
 * At poles the cross product with Z-axis degenerates, so X-axis is used as fallback.
 */
function computeENUAxes(
  origin: Vec3Type,
  ellipsoid: EllipsoidType,
  east: Vec3Type,
  north: Vec3Type,
  up: Vec3Type,
): void {
  // Up = geodetic surface normal
  Ellipsoid.geodeticSurfaceNormal(ellipsoid, origin, up);

  // Attempt east = cross(zAxis, up) -- this gives an "eastward" direction
  // except at poles where up is parallel to Z.
  Vec3.cross(scratchZAxis, up, east);

  const eastMagSq = Vec3.magnitudeSquared(east);

  if (eastMagSq < VelMath.EPSILON14) {
    // At or near a pole: up is nearly (0,0,+/-1), so cross(Z, up) ~ 0.
    // Use X-axis as fallback: east = cross(xAxis, up)
    Vec3.cross(scratchXAxis, up, east);
  }

  Vec3.normalize(east, east);

  // North = cross(up, east)
  Vec3.cross(up, east, north);
  Vec3.normalize(north, north);
}

/**
 * Write ENU column vectors + origin into a column-major 4x4 matrix.
 * Columns: [east | north | up | origin]
 */
function setMat4FromENUOrigin(
  east: Vec3Type,
  north: Vec3Type,
  up: Vec3Type,
  origin: Vec3Type,
  result: Mat4Type,
): Mat4Type {
  // Column 0: east
  result[0] = east[0];
  result[1] = east[1];
  result[2] = east[2];
  result[3] = 0;
  // Column 1: north
  result[4] = north[0];
  result[5] = north[1];
  result[6] = north[2];
  result[7] = 0;
  // Column 2: up
  result[8] = up[0];
  result[9] = up[1];
  result[10] = up[2];
  result[11] = 0;
  // Column 3: origin
  result[12] = origin[0];
  result[13] = origin[1];
  result[14] = origin[2];
  result[15] = 1;
  return result;
}

export const Transforms = {
  /**
   * Build a 4x4 transform from ENU (East-North-Up) local frame at `origin` to ECEF.
   *
   * Matrix columns in ECEF: [east, north, up, origin].
   * Handles polar singularity by falling back to X-axis when Z-axis cross product degenerates.
   */
  eastNorthUpToFixedFrame(
    origin: Vec3Type,
    ellipsoid: EllipsoidType,
    result: Mat4Type,
  ): Mat4Type {
    computeENUAxes(origin, ellipsoid, scratchEast, scratchNorth, scratchUp);
    return setMat4FromENUOrigin(scratchEast, scratchNorth, scratchUp, origin, result);
  },

  /**
   * Build a 4x4 transform from NED (North-East-Down) local frame at `origin` to ECEF.
   *
   * Matrix columns in ECEF: [north, east, -up, origin].
   */
  northEastDownToFixedFrame(
    origin: Vec3Type,
    ellipsoid: EllipsoidType,
    result: Mat4Type,
  ): Mat4Type {
    computeENUAxes(origin, ellipsoid, scratchEast, scratchNorth, scratchUp);

    // Column 0: north
    result[0] = scratchNorth[0];
    result[1] = scratchNorth[1];
    result[2] = scratchNorth[2];
    result[3] = 0;
    // Column 1: east
    result[4] = scratchEast[0];
    result[5] = scratchEast[1];
    result[6] = scratchEast[2];
    result[7] = 0;
    // Column 2: down = -up
    result[8] = -scratchUp[0];
    result[9] = -scratchUp[1];
    result[10] = -scratchUp[2];
    result[11] = 0;
    // Column 3: origin
    result[12] = origin[0];
    result[13] = origin[1];
    result[14] = origin[2];
    result[15] = 1;

    return result;
  },

  /**
   * Build a model-to-ECEF matrix at `origin` with heading/pitch/roll applied
   * on top of the ENU frame.
   *
   * In the ENU local frame:
   *   - heading = rotation about Up (Z-local, positive clockwise from North)
   *   - pitch   = rotation about East (X-local after heading)
   *   - roll    = rotation about North (Y-local after heading+pitch)
   *
   * result = ENU * RotationMatrix(HPR)
   */
  headingPitchRollToFixedFrame(
    origin: Vec3Type,
    heading: number,
    pitch: number,
    roll: number,
    ellipsoid: EllipsoidType,
    result: Mat4Type,
  ): Mat4Type {
    // Build ENU frame
    Transforms.eastNorthUpToFixedFrame(origin, ellipsoid, scratchEnuMat4);

    // Build HPR rotation as a quaternion, then expand to a 4x4 matrix.
    // In local ENU space: X=east, Y=north, Z=up
    //   heading = rotation about local Z (up)
    //   pitch   = rotation about local X (east) after heading
    //   roll    = rotation about local Y (north) after heading+pitch
    // Combined: q = qHeading * qPitch * qRoll
    Quaternion.fromHeadingPitchRoll(heading, pitch, roll, scratchQHeading);
    Quaternion.toRotationMatrix(scratchQHeading, scratchRotMat3);

    // Embed 3x3 rotation into a 4x4 identity
    mat4FromMat3(scratchRotMat3, scratchRotMat4);

    // result = enu * hpr
    return mat4Multiply(scratchEnuMat4, scratchRotMat4, result);
  },

  /**
   * Compute the quaternion representing the rotation of
   * headingPitchRollToFixedFrame (the full orientation from local frame to ECEF).
   *
   * This is the quaternion equivalent of the upper-left 3x3 of the matrix
   * produced by headingPitchRollToFixedFrame.
   */
  headingPitchRollQuaternion(
    origin: Vec3Type,
    heading: number,
    pitch: number,
    roll: number,
    ellipsoid: EllipsoidType,
    result: QuaternionType,
  ): QuaternionType {
    // Build the full ENU frame
    Transforms.eastNorthUpToFixedFrame(origin, ellipsoid, scratchEnuMat4);

    // Extract 3x3 rotation of ENU frame (upper-left block)
    extractMat3(scratchEnuMat4, scratchRotMat3);
    const qEnu = Quaternion.fromRotationMatrix(scratchRotMat3, scratchQTemp);

    // Build HPR quaternion in local ENU space
    Quaternion.fromHeadingPitchRoll(heading, pitch, roll, scratchQHeading);

    // Combined rotation: qEnu * qHPR
    Quaternion.multiply(qEnu, scratchQHeading, result);

    return result;
  },
} as const;

// ---- Internal helpers (not exported) ----

/** Embed a column-major Mat3 into a column-major Mat4 (with translation = 0). */
function mat4FromMat3(m3: Mat3Type, result: Mat4Type): Mat4Type {
  // Column 0
  result[0] = m3[0]; result[1] = m3[1]; result[2] = m3[2]; result[3] = 0;
  // Column 1
  result[4] = m3[3]; result[5] = m3[4]; result[6] = m3[5]; result[7] = 0;
  // Column 2
  result[8] = m3[6]; result[9] = m3[7]; result[10] = m3[8]; result[11] = 0;
  // Column 3
  result[12] = 0; result[13] = 0; result[14] = 0; result[15] = 1;
  return result;
}

/** Extract upper-left 3x3 from a column-major 4x4. */
function extractMat3(m4: Mat4Type, result: Mat3Type): Mat3Type {
  result[0] = m4[0]; result[1] = m4[1]; result[2] = m4[2];
  result[3] = m4[4]; result[4] = m4[5]; result[5] = m4[6];
  result[6] = m4[8]; result[7] = m4[9]; result[8] = m4[10];
  return result;
}

/** Multiply two column-major 4x4 matrices: result = a * b. Safe when result aliases a or b. */
function mat4Multiply(a: Mat4Type, b: Mat4Type, result: Mat4Type): Mat4Type {
  const a00 = a[0], a01 = a[4], a02 = a[8],  a03 = a[12];
  const a10 = a[1], a11 = a[5], a12 = a[9],  a13 = a[13];
  const a20 = a[2], a21 = a[6], a22 = a[10], a23 = a[14];
  const a30 = a[3], a31 = a[7], a32 = a[11], a33 = a[15];

  const b00 = b[0], b01 = b[4], b02 = b[8],  b03 = b[12];
  const b10 = b[1], b11 = b[5], b12 = b[9],  b13 = b[13];
  const b20 = b[2], b21 = b[6], b22 = b[10], b23 = b[14];
  const b30 = b[3], b31 = b[7], b32 = b[11], b33 = b[15];

  result[0]  = a00 * b00 + a01 * b10 + a02 * b20 + a03 * b30;
  result[1]  = a10 * b00 + a11 * b10 + a12 * b20 + a13 * b30;
  result[2]  = a20 * b00 + a21 * b10 + a22 * b20 + a23 * b30;
  result[3]  = a30 * b00 + a31 * b10 + a32 * b20 + a33 * b30;

  result[4]  = a00 * b01 + a01 * b11 + a02 * b21 + a03 * b31;
  result[5]  = a10 * b01 + a11 * b11 + a12 * b21 + a13 * b31;
  result[6]  = a20 * b01 + a21 * b11 + a22 * b21 + a23 * b31;
  result[7]  = a30 * b01 + a31 * b11 + a32 * b21 + a33 * b31;

  result[8]  = a00 * b02 + a01 * b12 + a02 * b22 + a03 * b32;
  result[9]  = a10 * b02 + a11 * b12 + a12 * b22 + a13 * b32;
  result[10] = a20 * b02 + a21 * b12 + a22 * b22 + a23 * b32;
  result[11] = a30 * b02 + a31 * b12 + a32 * b22 + a33 * b32;

  result[12] = a00 * b03 + a01 * b13 + a02 * b23 + a03 * b33;
  result[13] = a10 * b03 + a11 * b13 + a12 * b23 + a13 * b33;
  result[14] = a20 * b03 + a21 * b13 + a22 * b23 + a23 * b33;
  result[15] = a30 * b03 + a31 * b13 + a32 * b23 + a33 * b33;

  return result;
}
