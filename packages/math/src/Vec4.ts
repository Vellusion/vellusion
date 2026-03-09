export type Vec4Type = Float64Array;

export const Vec4 = {
  create(x: number = 0, y: number = 0, z: number = 0, w: number = 0): Vec4Type {
    const out = new Float64Array(4);
    out[0] = x; out[1] = y; out[2] = z; out[3] = w;
    return out;
  },

  zero(): Vec4Type { return new Float64Array(4); },

  clone(a: Vec4Type): Vec4Type {
    const out = new Float64Array(4);
    out[0] = a[0]; out[1] = a[1]; out[2] = a[2]; out[3] = a[3];
    return out;
  },

  add(a: Vec4Type, b: Vec4Type, result: Vec4Type): Vec4Type {
    result[0] = a[0] + b[0]; result[1] = a[1] + b[1];
    result[2] = a[2] + b[2]; result[3] = a[3] + b[3];
    return result;
  },

  subtract(a: Vec4Type, b: Vec4Type, result: Vec4Type): Vec4Type {
    result[0] = a[0] - b[0]; result[1] = a[1] - b[1];
    result[2] = a[2] - b[2]; result[3] = a[3] - b[3];
    return result;
  },

  scale(a: Vec4Type, scalar: number, result: Vec4Type): Vec4Type {
    result[0] = a[0] * scalar; result[1] = a[1] * scalar;
    result[2] = a[2] * scalar; result[3] = a[3] * scalar;
    return result;
  },

  dot(a: Vec4Type, b: Vec4Type): number {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
  },

  magnitude(a: Vec4Type): number {
    return Math.sqrt(a[0] * a[0] + a[1] * a[1] + a[2] * a[2] + a[3] * a[3]);
  },

  magnitudeSquared(a: Vec4Type): number {
    return a[0] * a[0] + a[1] * a[1] + a[2] * a[2] + a[3] * a[3];
  },

  normalize(a: Vec4Type, result: Vec4Type): Vec4Type {
    const mag = Vec4.magnitude(a);
    result[0] = a[0] / mag; result[1] = a[1] / mag;
    result[2] = a[2] / mag; result[3] = a[3] / mag;
    return result;
  },

  negate(a: Vec4Type, result: Vec4Type): Vec4Type {
    result[0] = -a[0]; result[1] = -a[1];
    result[2] = -a[2]; result[3] = -a[3];
    return result;
  },

  lerp(a: Vec4Type, b: Vec4Type, t: number, result: Vec4Type): Vec4Type {
    result[0] = a[0] + t * (b[0] - a[0]);
    result[1] = a[1] + t * (b[1] - a[1]);
    result[2] = a[2] + t * (b[2] - a[2]);
    result[3] = a[3] + t * (b[3] - a[3]);
    return result;
  },

  equalsEpsilon(a: Vec4Type, b: Vec4Type, epsilon: number): boolean {
    return (
      Math.abs(a[0] - b[0]) <= epsilon &&
      Math.abs(a[1] - b[1]) <= epsilon &&
      Math.abs(a[2] - b[2]) <= epsilon &&
      Math.abs(a[3] - b[3]) <= epsilon
    );
  },
} as const;
