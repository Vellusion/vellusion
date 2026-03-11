import { describe, it, expect, vi } from 'vitest';
import { ParticleSystem } from '../src/ParticleSystem';
import { ParticleBurst } from '../src/ParticleBurst';
import type { Emitter, ForceField } from '../src/ParticleSystem';

const simpleEmitter: Emitter = {
  emit: () => ({
    position: new Float32Array([0, 0, 0]),
    velocity: new Float32Array([0, 1, 0]),
  }),
};

describe('ParticleSystem', () => {
  it('emits particles based on rate', () => {
    const ps = new ParticleSystem({
      emitter: simpleEmitter,
      emissionRate: 10,
      maximumParticles: 100,
      minimumSpeed: 1,
      maximumSpeed: 1,
      minimumParticleLife: 5,
      maximumParticleLife: 5,
    });

    // With rate=10, after dt=1s we expect 10 particles emitted
    ps.update(1.0);
    expect(ps.activeCount).toBe(10);
  });

  it('particles age over time', () => {
    const ps = new ParticleSystem({
      emitter: simpleEmitter,
      emissionRate: 1,
      maximumParticles: 10,
      minimumParticleLife: 2,
      maximumParticleLife: 2,
    });

    ps.update(1.0); // emit 1 particle
    // The particle was just emitted, so after aging in the next update it should have aged
    ps.update(0.5);
    // Find the alive particle and check its age
    let foundAge = -1;
    for (let i = 0; i < ps.maximumParticles; i++) {
      if (ps.alive[i]) {
        foundAge = ps.ages[i];
        break;
      }
    }
    expect(foundAge).toBeCloseTo(0.5, 5);
  });

  it('dead particles are recycled', () => {
    const ps = new ParticleSystem({
      emitter: simpleEmitter,
      emissionRate: 1,
      maximumParticles: 2,
      minimumParticleLife: 1,
      maximumParticleLife: 1,
      minimumSpeed: 1,
      maximumSpeed: 1,
    });

    // Emit 1 particle
    ps.update(1.0);
    expect(ps.activeCount).toBe(1);

    // Kill it by aging past maxAge
    ps.update(1.5);
    // The particle aged 1.5s total (0 + 1.5), maxAge=1, so it dies.
    // Then a new one is emitted (rate=1, dt=1.5 => 1 new).
    expect(ps.activeCount).toBe(1);

    // The slot should have been reused (particle at index 0 alive again)
    expect(ps.alive[0]).toBe(1);
  });

  it('respects maximumParticles', () => {
    const ps = new ParticleSystem({
      emitter: simpleEmitter,
      emissionRate: 100,
      maximumParticles: 5,
      minimumParticleLife: 10,
      maximumParticleLife: 10,
    });

    ps.update(1.0); // tries to emit 100 but cap is 5
    expect(ps.activeCount).toBeLessThanOrEqual(5);
  });

  it('interpolates scale over lifetime', () => {
    const ps = new ParticleSystem({
      emitter: simpleEmitter,
      emissionRate: 1,
      maximumParticles: 10,
      startScale: 2,
      endScale: 4,
      minimumParticleLife: 2,
      maximumParticleLife: 2,
      minimumSpeed: 1,
      maximumSpeed: 1,
    });

    ps.update(1.0); // emit 1 particle
    // Now age it 1 second (halfway through its 2s life)
    ps.update(1.0);

    // t = 1/2 = 0.5, scale = 2 + (4-2)*0.5 = 3
    let foundScale = -1;
    for (let i = 0; i < ps.maximumParticles; i++) {
      if (ps.alive[i]) {
        foundScale = ps.scales[i];
        break;
      }
    }
    expect(foundScale).toBeCloseTo(3.0, 5);
  });

  it('interpolates color over lifetime', () => {
    const ps = new ParticleSystem({
      emitter: simpleEmitter,
      emissionRate: 1,
      maximumParticles: 10,
      startColor: new Float32Array([1, 0, 0, 1]),
      endColor: new Float32Array([0, 1, 0, 0]),
      minimumParticleLife: 2,
      maximumParticleLife: 2,
      minimumSpeed: 1,
      maximumSpeed: 1,
    });

    ps.update(1.0); // emit 1 particle
    ps.update(1.0); // age it 1s => t=0.5

    let idx = -1;
    for (let i = 0; i < ps.maximumParticles; i++) {
      if (ps.alive[i]) {
        idx = i;
        break;
      }
    }
    expect(idx).not.toBe(-1);
    // At t=0.5: R=0.5, G=0.5, B=0, A=0.5
    expect(ps.colors[idx * 4]).toBeCloseTo(0.5, 5);
    expect(ps.colors[idx * 4 + 1]).toBeCloseTo(0.5, 5);
    expect(ps.colors[idx * 4 + 2]).toBeCloseTo(0, 5);
    expect(ps.colors[idx * 4 + 3]).toBeCloseTo(0.5, 5);
  });

  it('particles move by velocity', () => {
    const ps = new ParticleSystem({
      emitter: simpleEmitter,
      emissionRate: 1,
      maximumParticles: 10,
      minimumSpeed: 2,
      maximumSpeed: 2,
      minimumParticleLife: 10,
      maximumParticleLife: 10,
    });

    ps.update(1.0); // emit 1 particle at origin with velocity [0,2,0]
    ps.update(1.0); // move it for 1s

    let idx = -1;
    for (let i = 0; i < ps.maximumParticles; i++) {
      if (ps.alive[i]) {
        idx = i;
        break;
      }
    }
    expect(idx).not.toBe(-1);
    // After 1s at velocity [0,2,0], position should be [0,2,0]
    expect(ps.positions[idx * 3]).toBeCloseTo(0, 5);
    expect(ps.positions[idx * 3 + 1]).toBeCloseTo(2, 5);
    expect(ps.positions[idx * 3 + 2]).toBeCloseTo(0, 5);
  });

  it('reset clears all particles', () => {
    const ps = new ParticleSystem({
      emitter: simpleEmitter,
      emissionRate: 10,
      maximumParticles: 100,
      minimumParticleLife: 10,
      maximumParticleLife: 10,
    });

    ps.update(1.0);
    expect(ps.activeCount).toBeGreaterThan(0);

    ps.reset();
    expect(ps.activeCount).toBe(0);
    let anyAlive = false;
    for (let i = 0; i < ps.maximumParticles; i++) {
      if (ps.alive[i]) {
        anyAlive = true;
        break;
      }
    }
    expect(anyAlive).toBe(false);
  });

  it('isComplete when not looping and all dead', () => {
    const ps = new ParticleSystem({
      emitter: simpleEmitter,
      emissionRate: 1,
      maximumParticles: 10,
      loop: false,
      minimumParticleLife: 0.5,
      maximumParticleLife: 0.5,
      minimumSpeed: 1,
      maximumSpeed: 1,
    });

    ps.update(1.0); // emit 1 particle with life=0.5
    expect(ps.isComplete).toBe(false);

    // Age the particle past its life
    ps.update(1.0);
    // Now all particles dead, not looping, accumulator should be < 1
    // activeCount updated after aging: particle dies, then new one emitted from rate
    // After this update: aged particle dies, new one emitted
    // Need to let that one die too
    ps.emissionRate = 0; // stop emitting
    ps.update(1.0); // kill the remaining one
    expect(ps.isComplete).toBe(true);
  });

  it('show=false skips update', () => {
    const ps = new ParticleSystem({
      emitter: simpleEmitter,
      emissionRate: 10,
      maximumParticles: 100,
      show: false,
    });

    ps.update(1.0);
    expect(ps.activeCount).toBe(0);
  });

  it('force fields applied', () => {
    const gravity: ForceField = {
      apply: (_position: Float32Array, velocity: Float32Array, dt: number) => {
        // Apply downward gravity
        velocity[1] -= 9.8 * dt;
      },
    };

    const ps = new ParticleSystem({
      emitter: simpleEmitter,
      emissionRate: 1,
      maximumParticles: 10,
      minimumSpeed: 0,
      maximumSpeed: 0,
      minimumParticleLife: 10,
      maximumParticleLife: 10,
    });
    ps.addForceField(gravity);

    ps.update(1.0); // emit 1 particle with velocity [0,0,0]
    ps.update(1.0); // apply gravity for 1s

    let idx = -1;
    for (let i = 0; i < ps.maximumParticles; i++) {
      if (ps.alive[i]) {
        idx = i;
        break;
      }
    }
    expect(idx).not.toBe(-1);
    // Gravity applied: vy = 0 - 9.8*1 = -9.8, then pos += vel*dt => y = -9.8
    expect(ps.velocities[idx * 3 + 1]).toBeCloseTo(-9.8, 1);
  });

  it('uses default values when no options provided', () => {
    const ps = new ParticleSystem({ emitter: simpleEmitter });
    expect(ps.emissionRate).toBe(10);
    expect(ps.maximumParticles).toBe(1000);
    expect(ps.loop).toBe(true);
    expect(ps.show).toBe(true);
    expect(ps.startScale).toBe(1);
    expect(ps.endScale).toBe(1);
    expect(ps.minimumSpeed).toBe(1);
    expect(ps.maximumSpeed).toBe(2);
    expect(ps.minimumParticleLife).toBe(1);
    expect(ps.maximumParticleLife).toBe(3);
  });

  it('allocates SOA arrays based on maximumParticles', () => {
    const ps = new ParticleSystem({
      emitter: simpleEmitter,
      maximumParticles: 50,
    });
    expect(ps.positions.length).toBe(50 * 3);
    expect(ps.velocities.length).toBe(50 * 3);
    expect(ps.ages.length).toBe(50);
    expect(ps.maxAges.length).toBe(50);
    expect(ps.scales.length).toBe(50);
    expect(ps.colors.length).toBe(50 * 4);
    expect(ps.alive.length).toBe(50);
  });

  it('emitted particle has correct initial color and scale', () => {
    const startColor = new Float32Array([0.5, 0.3, 0.1, 0.9]);
    const ps = new ParticleSystem({
      emitter: simpleEmitter,
      emissionRate: 1,
      maximumParticles: 10,
      startScale: 3,
      startColor,
      minimumParticleLife: 10,
      maximumParticleLife: 10,
    });

    ps.update(1.0);

    let idx = -1;
    for (let i = 0; i < ps.maximumParticles; i++) {
      if (ps.alive[i]) {
        idx = i;
        break;
      }
    }
    expect(idx).not.toBe(-1);
    expect(ps.scales[idx]).toBe(3);
    expect(ps.colors[idx * 4]).toBeCloseTo(0.5, 5);
    expect(ps.colors[idx * 4 + 1]).toBeCloseTo(0.3, 5);
    expect(ps.colors[idx * 4 + 2]).toBeCloseTo(0.1, 5);
    expect(ps.colors[idx * 4 + 3]).toBeCloseTo(0.9, 5);
  });

  it('addForceField adds to forceFields array', () => {
    const ps = new ParticleSystem({ emitter: simpleEmitter });
    const force: ForceField = {
      apply: () => {},
    };
    expect(ps.forceFields.length).toBe(0);
    ps.addForceField(force);
    expect(ps.forceFields.length).toBe(1);
    expect(ps.forceFields[0]).toBe(force);
  });
});

describe('ParticleBurst', () => {
  it('fires at correct time', () => {
    const burst = new ParticleBurst({ time: 2, minimum: 5, maximum: 5 });
    // Not yet at time=2
    expect(burst.tryFire(1.5)).toBe(0);
    // At time=2
    const count = burst.tryFire(2.0);
    expect(count).toBe(5);
  });

  it("doesn't fire twice", () => {
    const burst = new ParticleBurst({ time: 1, minimum: 3, maximum: 3 });
    const first = burst.tryFire(1.0);
    expect(first).toBe(3);
    const second = burst.tryFire(2.0);
    expect(second).toBe(0);
  });

  it('reset allows re-fire', () => {
    const burst = new ParticleBurst({ time: 1, minimum: 4, maximum: 4 });
    burst.tryFire(1.0);
    burst.reset();
    const count = burst.tryFire(1.0);
    expect(count).toBe(4);
  });

  it('emits between minimum and maximum inclusive', () => {
    const burst = new ParticleBurst({ time: 0, minimum: 1, maximum: 10 });
    const count = burst.tryFire(0);
    expect(count).toBeGreaterThanOrEqual(1);
    expect(count).toBeLessThanOrEqual(10);
  });
});
