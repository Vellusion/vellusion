import { describe, it, expect } from 'vitest';
import { VelMath } from '../src/MathUtils';

describe('VelMath', () => {
  describe('constants', () => {
    it('should define PI', () => {
      expect(VelMath.PI).toBeCloseTo(Math.PI);
    });

    it('should define TWO_PI', () => {
      expect(VelMath.TWO_PI).toBeCloseTo(Math.PI * 2);
    });

    it('should define HALF_PI', () => {
      expect(VelMath.HALF_PI).toBeCloseTo(Math.PI / 2);
    });

    it('should define EPSILON values', () => {
      expect(VelMath.EPSILON1).toBe(0.1);
      expect(VelMath.EPSILON7).toBe(1e-7);
      expect(VelMath.EPSILON12).toBe(1e-12);
      expect(VelMath.EPSILON15).toBe(1e-15);
    });
  });

  describe('toRadians', () => {
    it('should convert degrees to radians', () => {
      expect(VelMath.toRadians(180)).toBeCloseTo(Math.PI);
      expect(VelMath.toRadians(90)).toBeCloseTo(Math.PI / 2);
      expect(VelMath.toRadians(0)).toBe(0);
    });
  });

  describe('toDegrees', () => {
    it('should convert radians to degrees', () => {
      expect(VelMath.toDegrees(Math.PI)).toBeCloseTo(180);
      expect(VelMath.toDegrees(Math.PI / 2)).toBeCloseTo(90);
      expect(VelMath.toDegrees(0)).toBe(0);
    });
  });

  describe('clamp', () => {
    it('should clamp values within range', () => {
      expect(VelMath.clamp(5, 0, 10)).toBe(5);
      expect(VelMath.clamp(-1, 0, 10)).toBe(0);
      expect(VelMath.clamp(15, 0, 10)).toBe(10);
    });
  });

  describe('mod', () => {
    it('should compute positive modulo', () => {
      expect(VelMath.mod(5, 3)).toBe(2);
      expect(VelMath.mod(-1, 3)).toBe(2);
      expect(VelMath.mod(6, 3)).toBe(0);
    });
  });

  describe('sign', () => {
    it('should return sign of number', () => {
      expect(VelMath.sign(5)).toBe(1);
      expect(VelMath.sign(-5)).toBe(-1);
      expect(VelMath.sign(0)).toBe(0);
    });
  });

  describe('lerp', () => {
    it('should linearly interpolate', () => {
      expect(VelMath.lerp(0, 10, 0.5)).toBe(5);
      expect(VelMath.lerp(0, 10, 0)).toBe(0);
      expect(VelMath.lerp(0, 10, 1)).toBe(10);
    });
  });

  describe('zeroToTwoPi', () => {
    it('should normalize angle to [0, 2π)', () => {
      expect(VelMath.zeroToTwoPi(0)).toBeCloseTo(0);
      expect(VelMath.zeroToTwoPi(-Math.PI)).toBeCloseTo(Math.PI);
      expect(VelMath.zeroToTwoPi(3 * Math.PI)).toBeCloseTo(Math.PI);
    });
  });

  describe('negativePiToPi', () => {
    it('should normalize angle to [-π, π)', () => {
      expect(VelMath.negativePiToPi(0)).toBeCloseTo(0);
      expect(VelMath.negativePiToPi(2 * Math.PI)).toBeCloseTo(0);
      expect(VelMath.negativePiToPi(3 * Math.PI)).toBeCloseTo(Math.PI);
    });
  });

  describe('equalsEpsilon', () => {
    it('should compare with absolute epsilon', () => {
      expect(VelMath.equalsEpsilon(1.0, 1.0 + 1e-8, 1e-7)).toBe(true);
      expect(VelMath.equalsEpsilon(1.0, 1.1, 1e-7)).toBe(false);
    });

    it('should compare with relative epsilon', () => {
      expect(VelMath.equalsEpsilon(1e10, 1e10 + 1, 0, 1e-7)).toBe(true);
      expect(VelMath.equalsEpsilon(1e10, 1e10 + 1e5, 0, 1e-7)).toBe(false);
    });
  });
});
