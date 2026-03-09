export type Vec3Type = Float64Array;

export const Vec3 = {
  create(x: number = 0, y: number = 0, z: number = 0): Vec3Type {
    const out = new Float64Array(3);
    out[0] = x; out[1] = y; out[2] = z;
    return out;
  },

  zero(): Vec3Type { return new Float64Array(3); },

  unitX(): Vec3Type { return Vec3.create(1, 0, 0); },
  unitY(): Vec3Type { return Vec3.create(0, 1, 0); },
  unitZ(): Vec3Type { return Vec3.create(0, 0, 1); },

  clone(a: Vec3Type): Vec3Type {
    const out = new Float64Array(3);
    out[0] = a[0]; out[1] = a[1]; out[2] = a[2];
    return out;
  },

  add(a: Vec3Type, b: Vec3Type, result: Vec3Type): Vec3Type {
    result[0] = a[0] + b[0]; result[1] = a[1] + b[1]; result[2] = a[2] + b[2];
    return result;
  },

  subtract(a: Vec3Type, b: Vec3Type, result: Vec3Type): Vec3Type {
    result[0] = a[0] - b[0]; result[1] = a[1] - b[1]; result[2] = a[2] - b[2];
    return result;
  },

  scale(a: Vec3Type, scalar: number, result: Vec3Type): Vec3Type {
    result[0] = a[0] * scalar; result[1] = a[1] * scalar; result[2] = a[2] * scalar;
    return result;
  },

  multiplyComponents(a: Vec3Type, b: Vec3Type, result: Vec3Type): Vec3Type {
    result[0] = a[0] * b[0]; result[1] = a[1] * b[1]; result[2] = a[2] * b[2];
    return result;
  },

  dot(a: Vec3Type, b: Vec3Type): number {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  },

  cross(a: Vec3Type, b: Vec3Type, result: Vec3Type): Vec3Type {
    const ax = a[0], ay = a[1], az = a[2];
    const bx = b[0], by = b[1], bz = b[2];
    result[0] = ay * bz - az * by;
    result[1] = az * bx - ax * bz;
    result[2] = ax * by - ay * bx;
    return result;
  },

  magnitude(a: Vec3Type): number {
    return Math.sqrt(a[0] * a[0] + a[1] * a[1] + a[2] * a[2]);
  },

  magnitudeSquared(a: Vec3Type): number {
    return a[0] * a[0] + a[1] * a[1] + a[2] * a[2];
  },

  normalize(a: Vec3Type, result: Vec3Type): Vec3Type {
    const mag = Vec3.magnitude(a);
    result[0] = a[0] / mag; result[1] = a[1] / mag; result[2] = a[2] / mag;
    return result;
  },

  negate(a: Vec3Type, result: Vec3Type): Vec3Type {
    result[0] = -a[0]; result[1] = -a[1]; result[2] = -a[2];
    return result;
  },

  distance(a: Vec3Type, b: Vec3Type): number {
    const dx = a[0] - b[0], dy = a[1] - b[1], dz = a[2] - b[2];
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  },

  lerp(a: Vec3Type, b: Vec3Type, t: number, result: Vec3Type): Vec3Type {
    result[0] = a[0] + t * (b[0] - a[0]);
    result[1] = a[1] + t * (b[1] - a[1]);
    result[2] = a[2] + t * (b[2] - a[2]);
    return result;
  },

  equalsEpsilon(a: Vec3Type, b: Vec3Type, epsilon: number): boolean {
    return (
      Math.abs(a[0] - b[0]) <= epsilon &&
      Math.abs(a[1] - b[1]) <= epsilon &&
      Math.abs(a[2] - b[2]) <= epsilon
    );
  },
} as const;
