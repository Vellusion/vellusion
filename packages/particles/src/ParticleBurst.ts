export class ParticleBurst {
  time: number;
  minimum: number;
  maximum: number;
  private _fired = false;

  constructor(options: { time: number; minimum: number; maximum: number }) {
    this.time = options.time;
    this.minimum = options.minimum;
    this.maximum = options.maximum;
  }

  tryFire(elapsedTime: number): number {
    if (this._fired || elapsedTime < this.time) return 0;
    this._fired = true;
    return this.minimum + Math.floor(Math.random() * (this.maximum - this.minimum + 1));
  }

  reset(): void {
    this._fired = false;
  }
}
