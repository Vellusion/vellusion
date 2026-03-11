import type { Mat4Type } from '@vellusion/math';
import { Mat4 } from '@vellusion/math';
import type { ParticleBurst } from './ParticleBurst';
import type { Emitter } from './emitters/index';
import type { ForceField } from './ForceField';

export type { Emitter, ForceField };

export interface ParticleSystemOptions {
  emitter: Emitter;
  emissionRate?: number;
  maximumParticles?: number;
  loop?: boolean;
  startScale?: number;
  endScale?: number;
  startColor?: Float32Array;
  endColor?: Float32Array;
  minimumSpeed?: number;
  maximumSpeed?: number;
  minimumParticleLife?: number;
  maximumParticleLife?: number;
  modelMatrix?: Mat4Type;
  show?: boolean;
  bursts?: ParticleBurst[];
}

export class ParticleSystem {
  emitter: Emitter;
  emissionRate: number;
  maximumParticles: number;
  loop: boolean;
  show: boolean;
  startScale: number;
  endScale: number;
  startColor: Float32Array;
  endColor: Float32Array;
  minimumSpeed: number;
  maximumSpeed: number;
  minimumParticleLife: number;
  maximumParticleLife: number;
  modelMatrix: Mat4Type;
  bursts: ParticleBurst[];
  forceFields: ForceField[];

  // SOA particle data
  readonly positions: Float32Array;
  readonly velocities: Float32Array;
  readonly ages: Float32Array;
  readonly maxAges: Float32Array;
  readonly scales: Float32Array;
  readonly colors: Float32Array; // RGBA per particle
  readonly alive: Uint8Array;
  activeCount: number;

  private _elapsedTime: number;
  private _emitAccumulator: number;

  constructor(options: ParticleSystemOptions) {
    this.emitter = options.emitter;
    this.emissionRate = options.emissionRate ?? 10;
    this.maximumParticles = options.maximumParticles ?? 1000;
    this.loop = options.loop ?? true;
    this.show = options.show ?? true;
    this.startScale = options.startScale ?? 1;
    this.endScale = options.endScale ?? 1;
    this.startColor = options.startColor ?? new Float32Array([1, 1, 1, 1]);
    this.endColor = options.endColor ?? new Float32Array([1, 1, 1, 0]);
    this.minimumSpeed = options.minimumSpeed ?? 1;
    this.maximumSpeed = options.maximumSpeed ?? 2;
    this.minimumParticleLife = options.minimumParticleLife ?? 1;
    this.maximumParticleLife = options.maximumParticleLife ?? 3;
    this.modelMatrix = options.modelMatrix ?? Mat4.identity();
    this.bursts = options.bursts ?? [];
    this.forceFields = [];

    const n = this.maximumParticles;
    this.positions = new Float32Array(n * 3);
    this.velocities = new Float32Array(n * 3);
    this.ages = new Float32Array(n);
    this.maxAges = new Float32Array(n);
    this.scales = new Float32Array(n);
    this.colors = new Float32Array(n * 4);
    this.alive = new Uint8Array(n);
    this.activeCount = 0;
    this._elapsedTime = 0;
    this._emitAccumulator = 0;
  }

  addForceField(force: ForceField): void {
    this.forceFields.push(force);
  }

  update(dt: number): void {
    if (!this.show) return;
    this._elapsedTime += dt;

    // 1. Age particles and kill dead ones
    this.activeCount = 0;
    for (let i = 0; i < this.maximumParticles; i++) {
      if (!this.alive[i]) continue;
      this.ages[i] += dt;
      if (this.ages[i] >= this.maxAges[i]) {
        this.alive[i] = 0;
        continue;
      }
      this.activeCount++;

      // Interpolate scale and color
      const t = this.ages[i] / this.maxAges[i];
      this.scales[i] = this.startScale + (this.endScale - this.startScale) * t;
      for (let c = 0; c < 4; c++) {
        this.colors[i * 4 + c] =
          this.startColor[c] + (this.endColor[c] - this.startColor[c]) * t;
      }

      // Apply forces
      const pos = this.positions.subarray(i * 3, i * 3 + 3);
      const vel = this.velocities.subarray(i * 3, i * 3 + 3);
      for (const force of this.forceFields) {
        force.apply(pos, vel, dt);
      }

      // Update position
      this.positions[i * 3] += this.velocities[i * 3] * dt;
      this.positions[i * 3 + 1] += this.velocities[i * 3 + 1] * dt;
      this.positions[i * 3 + 2] += this.velocities[i * 3 + 2] * dt;
    }

    // 2. Emit new particles from rate
    this._emitAccumulator += this.emissionRate * dt;
    const toEmit = Math.floor(this._emitAccumulator);
    this._emitAccumulator -= toEmit;
    for (let i = 0; i < toEmit; i++) {
      this._emitOne();
    }

    // 3. Process bursts
    for (const burst of this.bursts) {
      const count = burst.tryFire(this._elapsedTime);
      for (let i = 0; i < count; i++) {
        this._emitOne();
      }
    }
  }

  private _emitOne(): void {
    // Find dead slot
    for (let i = 0; i < this.maximumParticles; i++) {
      if (this.alive[i]) continue;

      const { position, velocity } = this.emitter.emit();
      const speed =
        this.minimumSpeed +
        Math.random() * (this.maximumSpeed - this.minimumSpeed);
      const life =
        this.minimumParticleLife +
        Math.random() * (this.maximumParticleLife - this.minimumParticleLife);

      this.positions[i * 3] = position[0];
      this.positions[i * 3 + 1] = position[1];
      this.positions[i * 3 + 2] = position[2];

      // Normalize velocity and scale by speed
      const vl =
        Math.sqrt(
          velocity[0] ** 2 + velocity[1] ** 2 + velocity[2] ** 2,
        ) || 1;
      this.velocities[i * 3] = (velocity[0] / vl) * speed;
      this.velocities[i * 3 + 1] = (velocity[1] / vl) * speed;
      this.velocities[i * 3 + 2] = (velocity[2] / vl) * speed;

      this.ages[i] = 0;
      this.maxAges[i] = life;
      this.scales[i] = this.startScale;
      this.colors[i * 4] = this.startColor[0];
      this.colors[i * 4 + 1] = this.startColor[1];
      this.colors[i * 4 + 2] = this.startColor[2];
      this.colors[i * 4 + 3] = this.startColor[3];
      this.alive[i] = 1;
      this.activeCount++;
      return;
    }
  }

  reset(): void {
    this.alive.fill(0);
    this.activeCount = 0;
    this._elapsedTime = 0;
    this._emitAccumulator = 0;
    for (const burst of this.bursts) burst.reset();
  }

  get isComplete(): boolean {
    return !this.loop && this.activeCount === 0 && this._emitAccumulator <= 0;
  }
}
