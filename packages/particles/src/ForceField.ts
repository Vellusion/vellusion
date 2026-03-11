export interface ForceField {
  apply(position: Float32Array, velocity: Float32Array, dt: number): void;
}

export class GravityForce implements ForceField {
  gravity: Float32Array;

  constructor(gravity?: Float32Array) {
    this.gravity = gravity ?? new Float32Array([0, -9.81, 0]);
  }

  apply(_pos: Float32Array, vel: Float32Array, dt: number): void {
    vel[0] += this.gravity[0] * dt;
    vel[1] += this.gravity[1] * dt;
    vel[2] += this.gravity[2] * dt;
  }
}

export class WindForce implements ForceField {
  direction: Float32Array;
  strength: number;

  constructor(direction: Float32Array, strength: number) {
    const len =
      Math.sqrt(
        direction[0] ** 2 + direction[1] ** 2 + direction[2] ** 2,
      ) || 1;
    this.direction = new Float32Array([
      direction[0] / len,
      direction[1] / len,
      direction[2] / len,
    ]);
    this.strength = strength;
  }

  apply(_pos: Float32Array, vel: Float32Array, dt: number): void {
    vel[0] += this.direction[0] * this.strength * dt;
    vel[1] += this.direction[1] * this.strength * dt;
    vel[2] += this.direction[2] * this.strength * dt;
  }
}

export class CustomForce implements ForceField {
  private _fn: (pos: Float32Array, vel: Float32Array, dt: number) => void;

  constructor(
    fn: (pos: Float32Array, vel: Float32Array, dt: number) => void,
  ) {
    this._fn = fn;
  }

  apply(pos: Float32Array, vel: Float32Array, dt: number): void {
    this._fn(pos, vel, dt);
  }
}
