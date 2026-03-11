import type { Emitter } from './index.js';

export class BoxEmitter implements Emitter {
  width: number;
  height: number;
  depth: number;

  constructor(width: number, height: number, depth: number) {
    this.width = width;
    this.height = height;
    this.depth = depth;
  }

  emit(): { position: Float32Array; velocity: Float32Array } {
    const x = (Math.random() - 0.5) * this.width;
    const y = (Math.random() - 0.5) * this.height;
    const z = (Math.random() - 0.5) * this.depth;
    // Random direction (uniform on unit sphere)
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const vx = Math.sin(phi) * Math.cos(theta);
    const vy = Math.sin(phi) * Math.sin(theta);
    const vz = Math.cos(phi);
    return {
      position: new Float32Array([x, y, z]),
      velocity: new Float32Array([vx, vy, vz]),
    };
  }
}
