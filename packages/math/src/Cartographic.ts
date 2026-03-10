import { VelMath } from './MathUtils';

export type CartographicType = Float64Array;

export const Cartographic = {
  create(longitude: number = 0, latitude: number = 0, height: number = 0): CartographicType {
    const out = new Float64Array(3);
    out[0] = longitude;
    out[1] = latitude;
    out[2] = height;
    return out;
  },

  fromDegrees(longitude: number, latitude: number, height: number = 0): CartographicType {
    const out = new Float64Array(3);
    out[0] = VelMath.toRadians(longitude);
    out[1] = VelMath.toRadians(latitude);
    out[2] = height;
    return out;
  },

  clone(c: CartographicType): CartographicType {
    const out = new Float64Array(3);
    out[0] = c[0];
    out[1] = c[1];
    out[2] = c[2];
    return out;
  },

  equalsEpsilon(a: CartographicType, b: CartographicType, epsilon: number): boolean {
    return (
      Math.abs(a[0] - b[0]) <= epsilon &&
      Math.abs(a[1] - b[1]) <= epsilon &&
      Math.abs(a[2] - b[2]) <= epsilon
    );
  },
} as const;
