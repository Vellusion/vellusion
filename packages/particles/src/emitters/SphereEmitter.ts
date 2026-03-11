import type { Emitter } from './index.js';

export class SphereEmitter implements Emitter {
  radius: number;

  constructor(radius: number) {
    this.radius = radius;
  }

  emit(): { position: Float32Array; velocity: Float32Array } {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = Math.cbrt(Math.random()) * this.radius;
    const x = r * Math.sin(phi) * Math.cos(theta);
    const y = r * Math.sin(phi) * Math.sin(theta);
    const z = r * Math.cos(phi);
    const len = Math.sqrt(x * x + y * y + z * z) || 1;
    return {
      position: new Float32Array([x, y, z]),
      velocity: new Float32Array([x / len, y / len, z / len]), // outward
    };
  }
}
