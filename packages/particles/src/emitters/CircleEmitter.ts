import type { Emitter } from './index.js';

export class CircleEmitter implements Emitter {
  radius: number;

  constructor(radius: number) {
    this.radius = radius;
  }

  emit(): { position: Float32Array; velocity: Float32Array } {
    const angle = Math.random() * Math.PI * 2;
    const r = Math.sqrt(Math.random()) * this.radius;
    return {
      position: new Float32Array([Math.cos(angle) * r, 0, Math.sin(angle) * r]),
      velocity: new Float32Array([0, 1, 0]), // upward
    };
  }
}
