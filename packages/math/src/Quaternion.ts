import type { Vec3Type } from './Vec3';
import type { Mat3Type } from './Mat3';

export type QuaternionType = Float64Array;

export const Quaternion = {
  create(x: number = 0, y: number = 0, z: number = 0, w: number = 0): QuaternionType {
    const out = new Float64Array(4);
    out[0] = x; out[1] = y; out[2] = z; out[3] = w;
    return out;
  },

  identity(): QuaternionType {
    const out = new Float64Array(4);
    out[3] = 1;
    return out;
  },

  clone(q: QuaternionType): QuaternionType {
    const out = new Float64Array(4);
    out[0] = q[0]; out[1] = q[1]; out[2] = q[2]; out[3] = q[3];
    return out;
  },

  fromAxisAngle(axis: Vec3Type, angle: number, result: QuaternionType): QuaternionType {
    const halfAngle = angle * 0.5;
    const s = Math.sin(halfAngle);
    result[0] = axis[0] * s;
    result[1] = axis[1] * s;
    result[2] = axis[2] * s;
    result[3] = Math.cos(halfAngle);
    return result;
  },

  fromRotationMatrix(mat3: Mat3Type, result: QuaternionType): QuaternionType {
    // Mat3 is column-major: [m00, m10, m20, m01, m11, m21, m02, m12, m22]
    // Indices:               [0,   1,   2,   3,   4,   5,   6,   7,   8]
    const m00 = mat3[0], m10 = mat3[1], m20 = mat3[2];
    const m01 = mat3[3], m11 = mat3[4], m21 = mat3[5];
    const m02 = mat3[6], m12 = mat3[7], m22 = mat3[8];

    const trace = m00 + m11 + m22;

    if (trace > 0) {
      const s = 0.5 / Math.sqrt(trace + 1.0);
      result[3] = 0.25 / s;
      result[0] = (m21 - m12) * s;
      result[1] = (m02 - m20) * s;
      result[2] = (m10 - m01) * s;
    } else if (m00 > m11 && m00 > m22) {
      const s = 2.0 * Math.sqrt(1.0 + m00 - m11 - m22);
      result[3] = (m21 - m12) / s;
      result[0] = 0.25 * s;
      result[1] = (m01 + m10) / s;
      result[2] = (m02 + m20) / s;
    } else if (m11 > m22) {
      const s = 2.0 * Math.sqrt(1.0 + m11 - m00 - m22);
      result[3] = (m02 - m20) / s;
      result[0] = (m01 + m10) / s;
      result[1] = 0.25 * s;
      result[2] = (m12 + m21) / s;
    } else {
      const s = 2.0 * Math.sqrt(1.0 + m22 - m00 - m11);
      result[3] = (m10 - m01) / s;
      result[0] = (m02 + m20) / s;
      result[1] = (m12 + m21) / s;
      result[2] = 0.25 * s;
    }

    return result;
  },

  fromHeadingPitchRoll(heading: number, pitch: number, roll: number, result: QuaternionType): QuaternionType {
    // Heading = rotation around Z, Pitch = rotation around Y, Roll = rotation around X
    // Combined: q = qHeading * qPitch * qRoll
    const hh = heading * 0.5;
    const hp = pitch * 0.5;
    const hr = roll * 0.5;

    const sh = Math.sin(hh), ch = Math.cos(hh);
    const sp = Math.sin(hp), cp = Math.cos(hp);
    const sr = Math.sin(hr), cr = Math.cos(hr);

    // qHeading = (0, 0, sin(h/2), cos(h/2))
    // qPitch   = (0, sin(p/2), 0, cos(p/2))
    // qRoll    = (sin(r/2), 0, 0, cos(r/2))
    // result = qHeading * qPitch * qRoll
    result[0] = ch * cp * sr - sh * sp * cr;
    result[1] = ch * sp * cr + sh * cp * sr;
    result[2] = sh * cp * cr - ch * sp * sr;
    result[3] = ch * cp * cr + sh * sp * sr;

    return result;
  },

  toRotationMatrix(q: QuaternionType, result: Mat3Type): Mat3Type {
    const x = q[0], y = q[1], z = q[2], w = q[3];
    const x2 = x + x, y2 = y + y, z2 = z + z;
    const xx = x * x2, xy = x * y2, xz = x * z2;
    const yy = y * y2, yz = y * z2, zz = z * z2;
    const wx = w * x2, wy = w * y2, wz = w * z2;

    // Column-major storage: [m00, m10, m20, m01, m11, m21, m02, m12, m22]
    // Column 0
    result[0] = 1 - (yy + zz);
    result[1] = xy + wz;
    result[2] = xz - wy;
    // Column 1
    result[3] = xy - wz;
    result[4] = 1 - (xx + zz);
    result[5] = yz + wx;
    // Column 2
    result[6] = xz + wy;
    result[7] = yz - wx;
    result[8] = 1 - (xx + yy);

    return result;
  },

  multiply(a: QuaternionType, b: QuaternionType, result: QuaternionType): QuaternionType {
    const ax = a[0], ay = a[1], az = a[2], aw = a[3];
    const bx = b[0], by = b[1], bz = b[2], bw = b[3];

    result[0] = aw * bx + ax * bw + ay * bz - az * by;
    result[1] = aw * by - ax * bz + ay * bw + az * bx;
    result[2] = aw * bz + ax * by - ay * bx + az * bw;
    result[3] = aw * bw - ax * bx - ay * by - az * bz;

    return result;
  },

  conjugate(q: QuaternionType, result: QuaternionType): QuaternionType {
    result[0] = -q[0];
    result[1] = -q[1];
    result[2] = -q[2];
    result[3] = q[3];
    return result;
  },

  inverse(q: QuaternionType, result: QuaternionType): QuaternionType {
    const x = q[0], y = q[1], z = q[2], w = q[3];
    const dot = x * x + y * y + z * z + w * w;
    const invDot = 1.0 / dot;
    result[0] = -x * invDot;
    result[1] = -y * invDot;
    result[2] = -z * invDot;
    result[3] = w * invDot;
    return result;
  },

  normalize(q: QuaternionType, result: QuaternionType): QuaternionType {
    const mag = Quaternion.magnitude(q);
    result[0] = q[0] / mag;
    result[1] = q[1] / mag;
    result[2] = q[2] / mag;
    result[3] = q[3] / mag;
    return result;
  },

  magnitude(q: QuaternionType): number {
    return Math.sqrt(q[0] * q[0] + q[1] * q[1] + q[2] * q[2] + q[3] * q[3]);
  },

  slerp(a: QuaternionType, b: QuaternionType, t: number, result: QuaternionType): QuaternionType {
    let bx = b[0], by = b[1], bz = b[2], bw = b[3];

    let cosOmega = a[0] * bx + a[1] * by + a[2] * bz + a[3] * bw;

    // If the dot product is negative, negate one quaternion to take the shorter path
    if (cosOmega < 0) {
      cosOmega = -cosOmega;
      bx = -bx; by = -by; bz = -bz; bw = -bw;
    }

    let k0: number, k1: number;

    if (cosOmega > 0.9999) {
      // Very close: use linear interpolation to avoid division by near-zero sin
      k0 = 1 - t;
      k1 = t;
    } else {
      const omega = Math.acos(cosOmega);
      const sinOmega = Math.sin(omega);
      k0 = Math.sin((1 - t) * omega) / sinOmega;
      k1 = Math.sin(t * omega) / sinOmega;
    }

    result[0] = k0 * a[0] + k1 * bx;
    result[1] = k0 * a[1] + k1 * by;
    result[2] = k0 * a[2] + k1 * bz;
    result[3] = k0 * a[3] + k1 * bw;

    return result;
  },

  rotateVector(q: QuaternionType, v: Vec3Type, result: Vec3Type): Vec3Type {
    // v' = q * v * q^-1, optimized formula for unit quaternions
    const qx = q[0], qy = q[1], qz = q[2], qw = q[3];
    const vx = v[0], vy = v[1], vz = v[2];

    // t = 2 * cross(q.xyz, v)
    const tx = 2 * (qy * vz - qz * vy);
    const ty = 2 * (qz * vx - qx * vz);
    const tz = 2 * (qx * vy - qy * vx);

    // result = v + w * t + cross(q.xyz, t)
    result[0] = vx + qw * tx + (qy * tz - qz * ty);
    result[1] = vy + qw * ty + (qz * tx - qx * tz);
    result[2] = vz + qw * tz + (qx * ty - qy * tx);

    return result;
  },

  equalsEpsilon(a: QuaternionType, b: QuaternionType, epsilon: number): boolean {
    return (
      Math.abs(a[0] - b[0]) <= epsilon &&
      Math.abs(a[1] - b[1]) <= epsilon &&
      Math.abs(a[2] - b[2]) <= epsilon &&
      Math.abs(a[3] - b[3]) <= epsilon
    );
  },
} as const;
