import type { ModelNode } from './ModelSceneGraph';
import { Quaternion } from '@vellusion/math';
import type { QuaternionType } from '@vellusion/math';

export class ModelAnimation {
  name: string;
  duration: number = 0;
  channels: AnimationChannel[] = [];
  playing: boolean = false;
  loop: boolean = true;
  currentTime: number = 0;

  constructor(name: string = '') {
    this.name = name;
  }

  /**
   * Advance animation and update target nodes.
   */
  update(deltaTime: number): void {
    if (!this.playing || this.duration === 0) return;

    this.currentTime += deltaTime;
    if (this.loop) {
      this.currentTime = this.currentTime % this.duration;
    } else {
      this.currentTime = Math.min(this.currentTime, this.duration);
    }

    for (const channel of this.channels) {
      channel.evaluate(this.currentTime);
    }
  }

  play(): void {
    this.playing = true;
  }
  stop(): void {
    this.playing = false;
    this.currentTime = 0;
  }
  pause(): void {
    this.playing = false;
  }
}

export class AnimationChannel {
  target: ModelNode;
  path: 'translation' | 'rotation' | 'scale' | 'weights';
  sampler: AnimationSampler;

  constructor(
    target: ModelNode,
    path: 'translation' | 'rotation' | 'scale' | 'weights',
    sampler: AnimationSampler,
  ) {
    this.target = target;
    this.path = path;
    this.sampler = sampler;
  }

  evaluate(time: number): void {
    const value = this.sampler.evaluate(time);
    switch (this.path) {
      case 'translation':
        this.target.translation[0] = value[0];
        this.target.translation[1] = value[1];
        this.target.translation[2] = value[2];
        break;
      case 'rotation':
        this.target.rotation[0] = value[0];
        this.target.rotation[1] = value[1];
        this.target.rotation[2] = value[2];
        this.target.rotation[3] = value[3];
        break;
      case 'scale':
        this.target.scale[0] = value[0];
        this.target.scale[1] = value[1];
        this.target.scale[2] = value[2];
        break;
    }
  }
}

export class AnimationSampler {
  input: Float32Array; // keyframe times
  output: Float32Array; // keyframe values (flattened)
  interpolation: 'LINEAR' | 'STEP' | 'CUBICSPLINE';
  componentsPerOutput: number; // 3 for translation/scale, 4 for rotation

  constructor(
    input: Float32Array,
    output: Float32Array,
    componentsPerOutput: number,
    interpolation: 'LINEAR' | 'STEP' | 'CUBICSPLINE' = 'LINEAR',
  ) {
    this.input = input;
    this.output = output;
    this.componentsPerOutput = componentsPerOutput;
    this.interpolation = interpolation;
  }

  evaluate(time: number): Float32Array {
    const n = this.input.length;
    if (n === 0) return new Float32Array(this.componentsPerOutput);
    if (time <= this.input[0] || n === 1) {
      return this.output.slice(0, this.componentsPerOutput);
    }
    if (time >= this.input[n - 1]) {
      return this.output.slice(
        (n - 1) * this.componentsPerOutput,
        n * this.componentsPerOutput,
      );
    }

    // Binary search for bracketing keyframes
    let lo = 0,
      hi = n - 1;
    while (lo < hi - 1) {
      const mid = (lo + hi) >> 1;
      if (this.input[mid] <= time) lo = mid;
      else hi = mid;
    }

    const t0 = this.input[lo];
    const t1 = this.input[hi];
    const t = (time - t0) / (t1 - t0);

    const c = this.componentsPerOutput;
    const v0 = this.output.slice(lo * c, (lo + 1) * c);
    const v1 = this.output.slice(hi * c, (hi + 1) * c);

    if (this.interpolation === 'STEP') {
      return v0;
    }

    // LINEAR interpolation
    const result = new Float32Array(c);
    if (c === 4) {
      // Quaternion slerp — convert to Float64Array for the math library
      const qa: QuaternionType = new Float64Array([v0[0], v0[1], v0[2], v0[3]]);
      const qb: QuaternionType = new Float64Array([v1[0], v1[1], v1[2], v1[3]]);
      const qr: QuaternionType = new Float64Array(4);
      Quaternion.slerp(qa, qb, t, qr);
      result[0] = qr[0];
      result[1] = qr[1];
      result[2] = qr[2];
      result[3] = qr[3];
    } else {
      for (let i = 0; i < c; i++) {
        result[i] = v0[i] + (v1[i] - v0[i]) * t;
      }
    }
    return result;
  }
}
