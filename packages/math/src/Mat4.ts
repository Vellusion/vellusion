import type { Vec3Type } from './Vec3';
import type { Vec4Type } from './Vec4';
import type { Mat3Type } from './Mat3';

export type Mat4Type = Float64Array;

export const Mat4 = {
  /**
   * Create from row-order values, stored column-major.
   * Input: (m00, m01, m02, m03, m10, m11, m12, m13, m20, m21, m22, m23, m30, m31, m32, m33)
   */
  create(
    m00: number = 0, m01: number = 0, m02: number = 0, m03: number = 0,
    m10: number = 0, m11: number = 0, m12: number = 0, m13: number = 0,
    m20: number = 0, m21: number = 0, m22: number = 0, m23: number = 0,
    m30: number = 0, m31: number = 0, m32: number = 0, m33: number = 0,
  ): Mat4Type {
    const out = new Float64Array(16);
    // Column 0
    out[0] = m00; out[1] = m10; out[2] = m20; out[3] = m30;
    // Column 1
    out[4] = m01; out[5] = m11; out[6] = m21; out[7] = m31;
    // Column 2
    out[8] = m02; out[9] = m12; out[10] = m22; out[11] = m32;
    // Column 3
    out[12] = m03; out[13] = m13; out[14] = m23; out[15] = m33;
    return out;
  },

  identity(): Mat4Type {
    const out = new Float64Array(16);
    out[0] = 1; out[5] = 1; out[10] = 1; out[15] = 1;
    return out;
  },

  clone(a: Mat4Type): Mat4Type {
    const out = new Float64Array(16);
    out.set(a);
    return out;
  },

  multiply(a: Mat4Type, b: Mat4Type, result: Mat4Type): Mat4Type {
    const a00 = a[0], a01 = a[4], a02 = a[8],  a03 = a[12];
    const a10 = a[1], a11 = a[5], a12 = a[9],  a13 = a[13];
    const a20 = a[2], a21 = a[6], a22 = a[10], a23 = a[14];
    const a30 = a[3], a31 = a[7], a32 = a[11], a33 = a[15];

    const b00 = b[0], b01 = b[4], b02 = b[8],  b03 = b[12];
    const b10 = b[1], b11 = b[5], b12 = b[9],  b13 = b[13];
    const b20 = b[2], b21 = b[6], b22 = b[10], b23 = b[14];
    const b30 = b[3], b31 = b[7], b32 = b[11], b33 = b[15];

    // Column 0
    result[0]  = a00 * b00 + a01 * b10 + a02 * b20 + a03 * b30;
    result[1]  = a10 * b00 + a11 * b10 + a12 * b20 + a13 * b30;
    result[2]  = a20 * b00 + a21 * b10 + a22 * b20 + a23 * b30;
    result[3]  = a30 * b00 + a31 * b10 + a32 * b20 + a33 * b30;

    // Column 1
    result[4]  = a00 * b01 + a01 * b11 + a02 * b21 + a03 * b31;
    result[5]  = a10 * b01 + a11 * b11 + a12 * b21 + a13 * b31;
    result[6]  = a20 * b01 + a21 * b11 + a22 * b21 + a23 * b31;
    result[7]  = a30 * b01 + a31 * b11 + a32 * b21 + a33 * b31;

    // Column 2
    result[8]  = a00 * b02 + a01 * b12 + a02 * b22 + a03 * b32;
    result[9]  = a10 * b02 + a11 * b12 + a12 * b22 + a13 * b32;
    result[10] = a20 * b02 + a21 * b12 + a22 * b22 + a23 * b32;
    result[11] = a30 * b02 + a31 * b12 + a32 * b22 + a33 * b32;

    // Column 3
    result[12] = a00 * b03 + a01 * b13 + a02 * b23 + a03 * b33;
    result[13] = a10 * b03 + a11 * b13 + a12 * b23 + a13 * b33;
    result[14] = a20 * b03 + a21 * b13 + a22 * b23 + a23 * b33;
    result[15] = a30 * b03 + a31 * b13 + a32 * b23 + a33 * b33;

    return result;
  },

  multiplyByVector(m: Mat4Type, v: Vec4Type, result: Vec4Type): Vec4Type {
    const x = v[0], y = v[1], z = v[2], w = v[3];
    result[0] = m[0] * x + m[4] * y + m[8]  * z + m[12] * w;
    result[1] = m[1] * x + m[5] * y + m[9]  * z + m[13] * w;
    result[2] = m[2] * x + m[6] * y + m[10] * z + m[14] * w;
    result[3] = m[3] * x + m[7] * y + m[11] * z + m[15] * w;
    return result;
  },

  multiplyByPoint(m: Mat4Type, p: Vec3Type, result: Vec3Type): Vec3Type {
    const x = p[0], y = p[1], z = p[2];
    const rx = m[0] * x + m[4] * y + m[8]  * z + m[12];
    const ry = m[1] * x + m[5] * y + m[9]  * z + m[13];
    const rz = m[2] * x + m[6] * y + m[10] * z + m[14];
    const rw = m[3] * x + m[7] * y + m[11] * z + m[15];
    const invW = 1.0 / rw;
    result[0] = rx * invW;
    result[1] = ry * invW;
    result[2] = rz * invW;
    return result;
  },

  transpose(m: Mat4Type, result: Mat4Type): Mat4Type {
    if (m === result) {
      const m01 = m[4],  m02 = m[8],  m03 = m[12];
      const m10 = m[1],  m12 = m[9],  m13 = m[13];
      const m20 = m[2],  m21 = m[6],  m23 = m[14];
      const m30 = m[3],  m31 = m[7],  m32 = m[11];

      result[1]  = m01; result[2]  = m02; result[3]  = m03;
      result[4]  = m10; result[6]  = m12; result[7]  = m13;
      result[8]  = m20; result[9]  = m21; result[11] = m23;
      result[12] = m30; result[13] = m31; result[14] = m32;
    } else {
      result[0]  = m[0];  result[1]  = m[4];  result[2]  = m[8];  result[3]  = m[12];
      result[4]  = m[1];  result[5]  = m[5];  result[6]  = m[9];  result[7]  = m[13];
      result[8]  = m[2];  result[9]  = m[6];  result[10] = m[10]; result[11] = m[14];
      result[12] = m[3];  result[13] = m[7];  result[14] = m[11]; result[15] = m[15];
    }
    return result;
  },

  determinant(m: Mat4Type): number {
    const m00 = m[0], m01 = m[4], m02 = m[8],  m03 = m[12];
    const m10 = m[1], m11 = m[5], m12 = m[9],  m13 = m[13];
    const m20 = m[2], m21 = m[6], m22 = m[10], m23 = m[14];
    const m30 = m[3], m31 = m[7], m32 = m[11], m33 = m[15];

    const b00 = m00 * m11 - m01 * m10;
    const b01 = m00 * m12 - m02 * m10;
    const b02 = m00 * m13 - m03 * m10;
    const b03 = m01 * m12 - m02 * m11;
    const b04 = m01 * m13 - m03 * m11;
    const b05 = m02 * m13 - m03 * m12;
    const b06 = m20 * m31 - m21 * m30;
    const b07 = m20 * m32 - m22 * m30;
    const b08 = m20 * m33 - m23 * m30;
    const b09 = m21 * m32 - m22 * m31;
    const b10 = m21 * m33 - m23 * m31;
    const b11 = m22 * m33 - m23 * m32;

    return b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
  },

  inverse(m: Mat4Type, result: Mat4Type): Mat4Type {
    const m00 = m[0], m01 = m[4], m02 = m[8],  m03 = m[12];
    const m10 = m[1], m11 = m[5], m12 = m[9],  m13 = m[13];
    const m20 = m[2], m21 = m[6], m22 = m[10], m23 = m[14];
    const m30 = m[3], m31 = m[7], m32 = m[11], m33 = m[15];

    const b00 = m00 * m11 - m01 * m10;
    const b01 = m00 * m12 - m02 * m10;
    const b02 = m00 * m13 - m03 * m10;
    const b03 = m01 * m12 - m02 * m11;
    const b04 = m01 * m13 - m03 * m11;
    const b05 = m02 * m13 - m03 * m12;
    const b06 = m20 * m31 - m21 * m30;
    const b07 = m20 * m32 - m22 * m30;
    const b08 = m20 * m33 - m23 * m30;
    const b09 = m21 * m32 - m22 * m31;
    const b10 = m21 * m33 - m23 * m31;
    const b11 = m22 * m33 - m23 * m32;

    const det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
    const invDet = 1.0 / det;

    result[0]  = (m11 * b11 - m12 * b10 + m13 * b09) * invDet;
    result[1]  = (m12 * b08 - m10 * b11 - m13 * b07) * invDet;
    result[2]  = (m10 * b10 - m11 * b08 + m13 * b06) * invDet;
    result[3]  = (m11 * b07 - m10 * b09 - m12 * b06) * invDet;
    result[4]  = (m02 * b10 - m01 * b11 - m03 * b09) * invDet;
    result[5]  = (m00 * b11 - m02 * b08 + m03 * b07) * invDet;
    result[6]  = (m01 * b08 - m00 * b10 - m03 * b06) * invDet;
    result[7]  = (m00 * b09 - m01 * b07 + m02 * b06) * invDet;
    result[8]  = (m31 * b05 - m32 * b04 + m33 * b03) * invDet;
    result[9]  = (m32 * b02 - m30 * b05 - m33 * b01) * invDet;
    result[10] = (m30 * b04 - m31 * b02 + m33 * b00) * invDet;
    result[11] = (m31 * b01 - m30 * b03 - m32 * b00) * invDet;
    result[12] = (m22 * b04 - m21 * b05 - m23 * b03) * invDet;
    result[13] = (m20 * b05 - m22 * b02 + m23 * b01) * invDet;
    result[14] = (m21 * b02 - m20 * b04 - m23 * b00) * invDet;
    result[15] = (m20 * b03 - m21 * b01 + m22 * b00) * invDet;

    return result;
  },

  fromTranslation(translation: Vec3Type, result: Mat4Type): Mat4Type {
    result[0]  = 1; result[1]  = 0; result[2]  = 0; result[3]  = 0;
    result[4]  = 0; result[5]  = 1; result[6]  = 0; result[7]  = 0;
    result[8]  = 0; result[9]  = 0; result[10] = 1; result[11] = 0;
    result[12] = translation[0]; result[13] = translation[1]; result[14] = translation[2]; result[15] = 1;
    return result;
  },

  fromScale(scale: Vec3Type, result: Mat4Type): Mat4Type {
    result[0]  = scale[0]; result[1]  = 0;        result[2]  = 0;        result[3]  = 0;
    result[4]  = 0;        result[5]  = scale[1]; result[6]  = 0;        result[7]  = 0;
    result[8]  = 0;        result[9]  = 0;        result[10] = scale[2]; result[11] = 0;
    result[12] = 0;        result[13] = 0;        result[14] = 0;        result[15] = 1;
    return result;
  },

  fromRotationX(angle: number, result: Mat4Type): Mat4Type {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    result[0]  = 1; result[1]  = 0; result[2]  = 0; result[3]  = 0;
    result[4]  = 0; result[5]  = c; result[6]  = s; result[7]  = 0;
    result[8]  = 0; result[9]  = -s; result[10] = c; result[11] = 0;
    result[12] = 0; result[13] = 0; result[14] = 0; result[15] = 1;
    return result;
  },

  fromRotationY(angle: number, result: Mat4Type): Mat4Type {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    result[0]  = c; result[1]  = 0; result[2]  = -s; result[3]  = 0;
    result[4]  = 0; result[5]  = 1; result[6]  = 0;  result[7]  = 0;
    result[8]  = s; result[9]  = 0; result[10] = c;  result[11] = 0;
    result[12] = 0; result[13] = 0; result[14] = 0;  result[15] = 1;
    return result;
  },

  fromRotationZ(angle: number, result: Mat4Type): Mat4Type {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    result[0]  = c;  result[1]  = s; result[2]  = 0; result[3]  = 0;
    result[4]  = -s; result[5]  = c; result[6]  = 0; result[7]  = 0;
    result[8]  = 0;  result[9]  = 0; result[10] = 1; result[11] = 0;
    result[12] = 0;  result[13] = 0; result[14] = 0; result[15] = 1;
    return result;
  },

  fromTranslationRotationScale(
    t: Vec3Type,
    r: Float64Array, // quaternion [x, y, z, w]
    s: Vec3Type,
    result: Mat4Type,
  ): Mat4Type {
    const x = r[0], y = r[1], z = r[2], w = r[3];

    const x2 = x + x, y2 = y + y, z2 = z + z;
    const xx = x * x2, xy = x * y2, xz = x * z2;
    const yy = y * y2, yz = y * z2, zz = z * z2;
    const wx = w * x2, wy = w * y2, wz = w * z2;

    const sx = s[0], sy = s[1], sz = s[2];

    result[0]  = (1 - (yy + zz)) * sx;
    result[1]  = (xy + wz) * sx;
    result[2]  = (xz - wy) * sx;
    result[3]  = 0;

    result[4]  = (xy - wz) * sy;
    result[5]  = (1 - (xx + zz)) * sy;
    result[6]  = (yz + wx) * sy;
    result[7]  = 0;

    result[8]  = (xz + wy) * sz;
    result[9]  = (yz - wx) * sz;
    result[10] = (1 - (xx + yy)) * sz;
    result[11] = 0;

    result[12] = t[0];
    result[13] = t[1];
    result[14] = t[2];
    result[15] = 1;

    return result;
  },

  /**
   * Perspective projection for WebGPU (z maps to [0, 1], left-handed NDC).
   * Assumes right-handed world with camera looking down -Z.
   */
  computePerspectiveFieldOfView(
    fovY: number,
    aspect: number,
    near: number,
    far: number,
    result: Mat4Type,
  ): Mat4Type {
    const tanHalfFov = Math.tan(fovY / 2);

    result[0]  = 1.0 / (aspect * tanHalfFov);
    result[1]  = 0;
    result[2]  = 0;
    result[3]  = 0;

    result[4]  = 0;
    result[5]  = 1.0 / tanHalfFov;
    result[6]  = 0;
    result[7]  = 0;

    result[8]  = 0;
    result[9]  = 0;
    result[10] = far / (near - far);
    result[11] = -1;

    result[12] = 0;
    result[13] = 0;
    result[14] = (far * near) / (near - far);
    result[15] = 0;

    return result;
  },

  /**
   * Orthographic projection for WebGPU (z maps to [0, 1]).
   */
  computeOrthographic(
    left: number,
    right: number,
    bottom: number,
    top: number,
    near: number,
    far: number,
    result: Mat4Type,
  ): Mat4Type {
    const lr = 1.0 / (right - left);
    const bt = 1.0 / (top - bottom);
    const nf = 1.0 / (near - far);

    result[0]  = 2.0 * lr;
    result[1]  = 0;
    result[2]  = 0;
    result[3]  = 0;

    result[4]  = 0;
    result[5]  = 2.0 * bt;
    result[6]  = 0;
    result[7]  = 0;

    result[8]  = 0;
    result[9]  = 0;
    result[10] = nf;
    result[11] = 0;

    result[12] = -(right + left) * lr;
    result[13] = -(top + bottom) * bt;
    result[14] = near * nf;
    result[15] = 1;

    return result;
  },

  lookAt(eye: Vec3Type, target: Vec3Type, up: Vec3Type, result: Mat4Type): Mat4Type {
    // Forward direction (camera looks down -Z in view space)
    let fx = eye[0] - target[0];
    let fy = eye[1] - target[1];
    let fz = eye[2] - target[2];
    let len = Math.sqrt(fx * fx + fy * fy + fz * fz);
    fx /= len; fy /= len; fz /= len;

    // Right = up × forward
    let rx = up[1] * fz - up[2] * fy;
    let ry = up[2] * fx - up[0] * fz;
    let rz = up[0] * fy - up[1] * fx;
    len = Math.sqrt(rx * rx + ry * ry + rz * rz);
    rx /= len; ry /= len; rz /= len;

    // Recomputed up = forward × right
    const ux = fy * rz - fz * ry;
    const uy = fz * rx - fx * rz;
    const uz = fx * ry - fy * rx;

    // Column-major
    result[0]  = rx;  result[1]  = ux;  result[2]  = fx;  result[3]  = 0;
    result[4]  = ry;  result[5]  = uy;  result[6]  = fy;  result[7]  = 0;
    result[8]  = rz;  result[9]  = uz;  result[10] = fz;  result[11] = 0;
    result[12] = -(rx * eye[0] + ry * eye[1] + rz * eye[2]);
    result[13] = -(ux * eye[0] + uy * eye[1] + uz * eye[2]);
    result[14] = -(fx * eye[0] + fy * eye[1] + fz * eye[2]);
    result[15] = 1;

    return result;
  },

  getTranslation(m: Mat4Type, result: Vec3Type): Vec3Type {
    result[0] = m[12];
    result[1] = m[13];
    result[2] = m[14];
    return result;
  },

  getRotation(m: Mat4Type, result: Mat3Type): Mat3Type {
    // Extract upper-left 3x3 from column-major 4x4
    // 4x4 col0: [m[0], m[1], m[2], m[3]] -> 3x3 col0: [m[0], m[1], m[2]]
    // 4x4 col1: [m[4], m[5], m[6], m[7]] -> 3x3 col1: [m[4], m[5], m[6]]
    // 4x4 col2: [m[8], m[9], m[10], m[11]] -> 3x3 col2: [m[8], m[9], m[10]]
    result[0] = m[0]; result[1] = m[1]; result[2] = m[2];
    result[3] = m[4]; result[4] = m[5]; result[5] = m[6];
    result[6] = m[8]; result[7] = m[9]; result[8] = m[10];
    return result;
  },

  equalsEpsilon(a: Mat4Type, b: Mat4Type, epsilon: number): boolean {
    for (let i = 0; i < 16; i++) {
      if (Math.abs(a[i] - b[i]) > epsilon) return false;
    }
    return true;
  },
} as const;
