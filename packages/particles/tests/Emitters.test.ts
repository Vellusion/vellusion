import { describe, it, expect } from 'vitest';
import {
  BoxEmitter,
  CircleEmitter,
  ConeEmitter,
  SphereEmitter,
} from '@vellusion/particles';

// ─── BoxEmitter ─────────────────────────────────────────────────────────
describe('BoxEmitter', () => {
  it('position is within bounds', () => {
    const emitter = new BoxEmitter(2, 4, 6);
    for (let i = 0; i < 100; i++) {
      const { position } = emitter.emit();
      expect(position[0]).toBeGreaterThanOrEqual(-1);
      expect(position[0]).toBeLessThanOrEqual(1);
      expect(position[1]).toBeGreaterThanOrEqual(-2);
      expect(position[1]).toBeLessThanOrEqual(2);
      expect(position[2]).toBeGreaterThanOrEqual(-3);
      expect(position[2]).toBeLessThanOrEqual(3);
    }
  });

  it('velocity is a unit vector', () => {
    const emitter = new BoxEmitter(1, 1, 1);
    for (let i = 0; i < 50; i++) {
      const { velocity } = emitter.emit();
      const len = Math.sqrt(
        velocity[0] ** 2 + velocity[1] ** 2 + velocity[2] ** 2,
      );
      expect(len).toBeCloseTo(1, 4);
    }
  });

  it('stores width, height, depth', () => {
    const e = new BoxEmitter(3, 5, 7);
    expect(e.width).toBe(3);
    expect(e.height).toBe(5);
    expect(e.depth).toBe(7);
  });
});

// ─── CircleEmitter ──────────────────────────────────────────────────────
describe('CircleEmitter', () => {
  it('position is on XZ plane (y=0)', () => {
    const emitter = new CircleEmitter(5);
    for (let i = 0; i < 100; i++) {
      const { position } = emitter.emit();
      expect(position[1]).toBe(0);
    }
  });

  it('position is within radius', () => {
    const radius = 3;
    const emitter = new CircleEmitter(radius);
    for (let i = 0; i < 100; i++) {
      const { position } = emitter.emit();
      const dist = Math.sqrt(position[0] ** 2 + position[2] ** 2);
      expect(dist).toBeLessThanOrEqual(radius + 1e-6);
    }
  });

  it('velocity points upward', () => {
    const emitter = new CircleEmitter(1);
    const { velocity } = emitter.emit();
    expect(velocity[0]).toBe(0);
    expect(velocity[1]).toBe(1);
    expect(velocity[2]).toBe(0);
  });
});

// ─── ConeEmitter ────────────────────────────────────────────────────────
describe('ConeEmitter', () => {
  it('position is at origin', () => {
    const emitter = new ConeEmitter(Math.PI / 4);
    for (let i = 0; i < 50; i++) {
      const { position } = emitter.emit();
      expect(position[0]).toBe(0);
      expect(position[1]).toBe(0);
      expect(position[2]).toBe(0);
    }
  });

  it('velocity is within cone angle', () => {
    const halfAngle = Math.PI / 6; // 30 degrees
    const emitter = new ConeEmitter(halfAngle);
    for (let i = 0; i < 200; i++) {
      const { velocity } = emitter.emit();
      // The angle from the Y axis (up) should be <= halfAngle
      const len = Math.sqrt(
        velocity[0] ** 2 + velocity[1] ** 2 + velocity[2] ** 2,
      );
      const angleFromUp = Math.acos(velocity[1] / len);
      expect(angleFromUp).toBeLessThanOrEqual(halfAngle + 1e-6);
    }
  });

  it('velocity is a unit vector', () => {
    const emitter = new ConeEmitter(Math.PI / 4);
    for (let i = 0; i < 50; i++) {
      const { velocity } = emitter.emit();
      const len = Math.sqrt(
        velocity[0] ** 2 + velocity[1] ** 2 + velocity[2] ** 2,
      );
      expect(len).toBeCloseTo(1, 4);
    }
  });
});

// ─── SphereEmitter ──────────────────────────────────────────────────────
describe('SphereEmitter', () => {
  it('position is within radius', () => {
    const radius = 5;
    const emitter = new SphereEmitter(radius);
    for (let i = 0; i < 100; i++) {
      const { position } = emitter.emit();
      const dist = Math.sqrt(
        position[0] ** 2 + position[1] ** 2 + position[2] ** 2,
      );
      expect(dist).toBeLessThanOrEqual(radius + 1e-6);
    }
  });

  it('velocity points outward (same direction as position)', () => {
    const emitter = new SphereEmitter(5);
    for (let i = 0; i < 100; i++) {
      const { position, velocity } = emitter.emit();
      const pLen = Math.sqrt(
        position[0] ** 2 + position[1] ** 2 + position[2] ** 2,
      );
      if (pLen < 1e-6) continue; // skip degenerate case
      // Dot product should be positive (same direction)
      const dot =
        position[0] * velocity[0] +
        position[1] * velocity[1] +
        position[2] * velocity[2];
      expect(dot).toBeGreaterThan(-1e-6);
    }
  });

  it('velocity is a unit vector', () => {
    const emitter = new SphereEmitter(3);
    for (let i = 0; i < 50; i++) {
      const { velocity } = emitter.emit();
      const len = Math.sqrt(
        velocity[0] ** 2 + velocity[1] ** 2 + velocity[2] ** 2,
      );
      expect(len).toBeCloseTo(1, 4);
    }
  });
});
