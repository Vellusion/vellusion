import type { Emitter } from './index.js';

export class ConeEmitter implements Emitter {
  angle: number; // half-angle in radians

  constructor(angle: number) {
    this.angle = angle;
  }

  emit(): { position: Float32Array; velocity: Float32Array } {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * this.angle;
    const sinPhi = Math.sin(phi);
    return {
      position: new Float32Array([0, 0, 0]),
      velocity: new Float32Array([
        sinPhi * Math.cos(theta),
        Math.cos(phi),
        sinPhi * Math.sin(theta),
      ]),
    };
  }
}
