import type { Vec3Type } from './Vec3';

export type Mat3Type = Float64Array;

export const Mat3 = {
  /**
   * Create from row-order values, stored column-major.
   * Input: (m00, m01, m02, m10, m11, m12, m20, m21, m22)
   */
  create(
    m00: number = 0, m01: number = 0, m02: number = 0,
    m10: number = 0, m11: number = 0, m12: number = 0,
    m20: number = 0, m21: number = 0, m22: number = 0,
  ): Mat3Type {
    const out = new Float64Array(9);
    // Column 0
    out[0] = m00; out[1] = m10; out[2] = m20;
    // Column 1
    out[3] = m01; out[4] = m11; out[5] = m21;
    // Column 2
    out[6] = m02; out[7] = m12; out[8] = m22;
    return out;
  },

  identity(): Mat3Type {
    const out = new Float64Array(9);
    out[0] = 1; out[4] = 1; out[8] = 1;
    return out;
  },

  clone(a: Mat3Type): Mat3Type {
    const out = new Float64Array(9);
    out.set(a);
    return out;
  },

  multiply(a: Mat3Type, b: Mat3Type, result: Mat3Type): Mat3Type {
    const a00 = a[0], a01 = a[3], a02 = a[6];
    const a10 = a[1], a11 = a[4], a12 = a[7];
    const a20 = a[2], a21 = a[5], a22 = a[8];

    const b00 = b[0], b01 = b[3], b02 = b[6];
    const b10 = b[1], b11 = b[4], b12 = b[7];
    const b20 = b[2], b21 = b[5], b22 = b[8];

    result[0] = a00 * b00 + a01 * b10 + a02 * b20;
    result[1] = a10 * b00 + a11 * b10 + a12 * b20;
    result[2] = a20 * b00 + a21 * b10 + a22 * b20;

    result[3] = a00 * b01 + a01 * b11 + a02 * b21;
    result[4] = a10 * b01 + a11 * b11 + a12 * b21;
    result[5] = a20 * b01 + a21 * b11 + a22 * b21;

    result[6] = a00 * b02 + a01 * b12 + a02 * b22;
    result[7] = a10 * b02 + a11 * b12 + a12 * b22;
    result[8] = a20 * b02 + a21 * b12 + a22 * b22;

    return result;
  },

  multiplyByVector(m: Mat3Type, v: Vec3Type, result: Vec3Type): Vec3Type {
    const x = v[0], y = v[1], z = v[2];
    result[0] = m[0] * x + m[3] * y + m[6] * z;
    result[1] = m[1] * x + m[4] * y + m[7] * z;
    result[2] = m[2] * x + m[5] * y + m[8] * z;
    return result;
  },

  multiplyByScalar(m: Mat3Type, scalar: number, result: Mat3Type): Mat3Type {
    for (let i = 0; i < 9; i++) {
      result[i] = m[i] * scalar;
    }
    return result;
  },

  transpose(m: Mat3Type, result: Mat3Type): Mat3Type {
    const m01 = m[3], m02 = m[6], m12 = m[7];
    const m10 = m[1], m20 = m[2], m21 = m[5];

    result[0] = m[0];
    result[1] = m01;
    result[2] = m02;
    result[3] = m10;
    result[4] = m[4];
    result[5] = m12;
    result[6] = m20;
    result[7] = m21;
    result[8] = m[8];
    return result;
  },

  determinant(m: Mat3Type): number {
    const m00 = m[0], m01 = m[3], m02 = m[6];
    const m10 = m[1], m11 = m[4], m12 = m[7];
    const m20 = m[2], m21 = m[5], m22 = m[8];

    return (
      m00 * (m11 * m22 - m12 * m21) -
      m01 * (m10 * m22 - m12 * m20) +
      m02 * (m10 * m21 - m11 * m20)
    );
  },

  inverse(m: Mat3Type, result: Mat3Type): Mat3Type {
    const m00 = m[0], m01 = m[3], m02 = m[6];
    const m10 = m[1], m11 = m[4], m12 = m[7];
    const m20 = m[2], m21 = m[5], m22 = m[8];

    const c00 = m11 * m22 - m12 * m21;
    const c01 = m12 * m20 - m10 * m22;
    const c02 = m10 * m21 - m11 * m20;

    const det = m00 * c00 + m01 * c01 + m02 * c02;
    const invDet = 1.0 / det;

    result[0] = c00 * invDet;
    result[1] = c01 * invDet;
    result[2] = c02 * invDet;
    result[3] = (m02 * m21 - m01 * m22) * invDet;
    result[4] = (m00 * m22 - m02 * m20) * invDet;
    result[5] = (m01 * m20 - m00 * m21) * invDet;
    result[6] = (m01 * m12 - m02 * m11) * invDet;
    result[7] = (m02 * m10 - m00 * m12) * invDet;
    result[8] = (m00 * m11 - m01 * m10) * invDet;
    return result;
  },

  fromScale(scale: Vec3Type, result: Mat3Type): Mat3Type {
    result[0] = scale[0]; result[1] = 0;        result[2] = 0;
    result[3] = 0;        result[4] = scale[1]; result[5] = 0;
    result[6] = 0;        result[7] = 0;        result[8] = scale[2];
    return result;
  },

  fromRotationZ(angle: number, result: Mat3Type): Mat3Type {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    result[0] = c;  result[1] = s;  result[2] = 0;
    result[3] = -s; result[4] = c;  result[5] = 0;
    result[6] = 0;  result[7] = 0;  result[8] = 1;
    return result;
  },

  equalsEpsilon(a: Mat3Type, b: Mat3Type, epsilon: number): boolean {
    for (let i = 0; i < 9; i++) {
      if (Math.abs(a[i] - b[i]) > epsilon) return false;
    }
    return true;
  },
} as const;
