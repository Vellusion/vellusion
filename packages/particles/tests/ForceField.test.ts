import { describe, it, expect } from 'vitest';
import {
  GravityForce,
  WindForce,
  CustomForce,
  ParticleInterpolator,
} from '@vellusion/particles';

// ─── GravityForce ───────────────────────────────────────────────────────
describe('GravityForce', () => {
  it('default gravity is [0, -9.81, 0]', () => {
    const g = new GravityForce();
    expect(g.gravity[0]).toBe(0);
    expect(g.gravity[1]).toBeCloseTo(-9.81);
    expect(g.gravity[2]).toBe(0);
  });

  it('adds gravity to velocity over dt', () => {
    const g = new GravityForce();
    const vel = new Float32Array([0, 0, 0]);
    g.apply(new Float32Array([0, 0, 0]), vel, 1);
    expect(vel[0]).toBe(0);
    expect(vel[1]).toBeCloseTo(-9.81);
    expect(vel[2]).toBe(0);
  });

  it('respects custom gravity vector', () => {
    const g = new GravityForce(new Float32Array([1, -5, 2]));
    const vel = new Float32Array([0, 0, 0]);
    g.apply(new Float32Array([0, 0, 0]), vel, 0.5);
    expect(vel[0]).toBeCloseTo(0.5);
    expect(vel[1]).toBeCloseTo(-2.5);
    expect(vel[2]).toBeCloseTo(1);
  });
});

// ─── WindForce ──────────────────────────────────────────────────────────
describe('WindForce', () => {
  it('adds wind force to velocity', () => {
    const wind = new WindForce(new Float32Array([1, 0, 0]), 10);
    const vel = new Float32Array([0, 0, 0]);
    wind.apply(new Float32Array([0, 0, 0]), vel, 1);
    expect(vel[0]).toBeCloseTo(10);
    expect(vel[1]).toBeCloseTo(0);
    expect(vel[2]).toBeCloseTo(0);
  });

  it('normalizes direction', () => {
    const wind = new WindForce(new Float32Array([3, 0, 4]), 5);
    // direction should be [0.6, 0, 0.8]
    expect(wind.direction[0]).toBeCloseTo(0.6);
    expect(wind.direction[1]).toBeCloseTo(0);
    expect(wind.direction[2]).toBeCloseTo(0.8);
  });
});

// ─── CustomForce ────────────────────────────────────────────────────────
describe('CustomForce', () => {
  it('calls the user-provided function', () => {
    let called = false;
    const force = new CustomForce((pos, vel, dt) => {
      called = true;
      vel[0] += pos[0] * dt;
    });
    const pos = new Float32Array([2, 0, 0]);
    const vel = new Float32Array([0, 0, 0]);
    force.apply(pos, vel, 0.5);
    expect(called).toBe(true);
    expect(vel[0]).toBeCloseTo(1);
  });
});

// ─── ParticleInterpolator ───────────────────────────────────────────────
describe('ParticleInterpolator', () => {
  it('lerp interpolates between two values', () => {
    expect(ParticleInterpolator.lerp(0, 10, 0)).toBe(0);
    expect(ParticleInterpolator.lerp(0, 10, 1)).toBe(10);
    expect(ParticleInterpolator.lerp(0, 10, 0.5)).toBeCloseTo(5);
    expect(ParticleInterpolator.lerp(2, 8, 0.25)).toBeCloseTo(3.5);
  });

  it('lerpColor interpolates RGBA channels', () => {
    const start = new Float32Array([1, 0, 0, 1]);
    const end = new Float32Array([0, 0, 1, 0]);
    const result = new Float32Array(4);
    ParticleInterpolator.lerpColor(start, end, 0.5, result);
    expect(result[0]).toBeCloseTo(0.5);
    expect(result[1]).toBeCloseTo(0);
    expect(result[2]).toBeCloseTo(0.5);
    expect(result[3]).toBeCloseTo(0.5);
  });

  it('smoothstep returns 0 at t=0, 1 at t=1, ~0.5 at t=0.5', () => {
    expect(ParticleInterpolator.smoothstep(0)).toBe(0);
    expect(ParticleInterpolator.smoothstep(1)).toBe(1);
    expect(ParticleInterpolator.smoothstep(0.5)).toBeCloseTo(0.5);
  });
});
