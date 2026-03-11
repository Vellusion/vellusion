export class ParticleInterpolator {
  static lerp(start: number, end: number, t: number): number {
    return start + (end - start) * t;
  }

  static lerpColor(
    start: Float32Array,
    end: Float32Array,
    t: number,
    result: Float32Array,
  ): void {
    for (let i = 0; i < 4; i++) {
      result[i] = start[i] + (end[i] - start[i]) * t;
    }
  }

  static smoothstep(t: number): number {
    return t * t * (3 - 2 * t);
  }
}
