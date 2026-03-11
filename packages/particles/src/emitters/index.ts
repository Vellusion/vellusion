export interface Emitter {
  emit(): { position: Float32Array; velocity: Float32Array };
}

export { BoxEmitter } from './BoxEmitter.js';
export { CircleEmitter } from './CircleEmitter.js';
export { ConeEmitter } from './ConeEmitter.js';
export { SphereEmitter } from './SphereEmitter.js';
