const RADIANS_PER_DEGREE = Math.PI / 180.0;
const DEGREES_PER_RADIAN = 180.0 / Math.PI;

export const VelMath = {
  PI: Math.PI,
  TWO_PI: 2.0 * Math.PI,
  HALF_PI: Math.PI / 2.0,
  EPSILON1: 0.1,
  EPSILON2: 0.01,
  EPSILON3: 0.001,
  EPSILON4: 0.0001,
  EPSILON5: 0.00001,
  EPSILON6: 0.000001,
  EPSILON7: 1e-7,
  EPSILON8: 1e-8,
  EPSILON9: 1e-9,
  EPSILON10: 1e-10,
  EPSILON11: 1e-11,
  EPSILON12: 1e-12,
  EPSILON13: 1e-13,
  EPSILON14: 1e-14,
  EPSILON15: 1e-15,
  SOLAR_RADIUS: 6.955e8,
  LUNAR_RADIUS: 1.7374e6,
  GRAVITATIONAL_PARAMETER: 3.986004418e14,

  toRadians(degrees: number): number {
    return degrees * RADIANS_PER_DEGREE;
  },

  toDegrees(radians: number): number {
    return radians * DEGREES_PER_RADIAN;
  },

  clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  },

  mod(m: number, n: number): number {
    return ((m % n) + n) % n;
  },

  sign(value: number): number {
    if (value > 0) return 1;
    if (value < 0) return -1;
    return 0;
  },

  lerp(start: number, end: number, t: number): number {
    return (1.0 - t) * start + t * end;
  },

  zeroToTwoPi(angle: number): number {
    const mod = VelMath.mod(angle, VelMath.TWO_PI);
    if (Math.abs(mod) < VelMath.EPSILON14 && Math.abs(angle) > VelMath.EPSILON14) {
      return VelMath.TWO_PI;
    }
    return mod;
  },

  negativePiToPi(angle: number): number {
    const twoPi = VelMath.TWO_PI;
    const simplified = angle - Math.floor(angle / twoPi) * twoPi;
    if (simplified < -Math.PI) return simplified + twoPi;
    if (simplified > Math.PI) return simplified - twoPi;
    return simplified;
  },

  equalsEpsilon(
    left: number,
    right: number,
    absoluteEpsilon: number = 0,
    relativeEpsilon: number = 0,
  ): boolean {
    const diff = Math.abs(left - right);
    if (diff <= absoluteEpsilon) return true;
    const larger = Math.max(Math.abs(left), Math.abs(right));
    return diff <= larger * relativeEpsilon;
  },
} as const;
