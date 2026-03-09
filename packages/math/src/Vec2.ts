export type Vec2Type = Float64Array;

export const Vec2 = {
  create(x: number = 0, y: number = 0): Vec2Type {
    const out = new Float64Array(2);
    out[0] = x;
    out[1] = y;
    return out;
  },

  zero(): Vec2Type {
    return new Float64Array(2);
  },

  clone(a: Vec2Type): Vec2Type {
    const out = new Float64Array(2);
    out[0] = a[0];
    out[1] = a[1];
    return out;
  },

  add(a: Vec2Type, b: Vec2Type, result: Vec2Type): Vec2Type {
    result[0] = a[0] + b[0];
    result[1] = a[1] + b[1];
    return result;
  },

  subtract(a: Vec2Type, b: Vec2Type, result: Vec2Type): Vec2Type {
    result[0] = a[0] - b[0];
    result[1] = a[1] - b[1];
    return result;
  },

  scale(a: Vec2Type, scalar: number, result: Vec2Type): Vec2Type {
    result[0] = a[0] * scalar;
    result[1] = a[1] * scalar;
    return result;
  },

  dot(a: Vec2Type, b: Vec2Type): number {
    return a[0] * b[0] + a[1] * b[1];
  },

  magnitude(a: Vec2Type): number {
    return Math.sqrt(a[0] * a[0] + a[1] * a[1]);
  },

  magnitudeSquared(a: Vec2Type): number {
    return a[0] * a[0] + a[1] * a[1];
  },

  normalize(a: Vec2Type, result: Vec2Type): Vec2Type {
    const mag = Vec2.magnitude(a);
    result[0] = a[0] / mag;
    result[1] = a[1] / mag;
    return result;
  },

  negate(a: Vec2Type, result: Vec2Type): Vec2Type {
    result[0] = -a[0];
    result[1] = -a[1];
    return result;
  },

  distance(a: Vec2Type, b: Vec2Type): number {
    const dx = a[0] - b[0];
    const dy = a[1] - b[1];
    return Math.sqrt(dx * dx + dy * dy);
  },

  lerp(a: Vec2Type, b: Vec2Type, t: number, result: Vec2Type): Vec2Type {
    result[0] = a[0] + t * (b[0] - a[0]);
    result[1] = a[1] + t * (b[1] - a[1]);
    return result;
  },

  equalsEpsilon(a: Vec2Type, b: Vec2Type, epsilon: number): boolean {
    return Math.abs(a[0] - b[0]) <= epsilon && Math.abs(a[1] - b[1]) <= epsilon;
  },
} as const;
