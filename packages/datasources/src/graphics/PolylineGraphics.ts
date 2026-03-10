/**
 * Describes a polyline (a series of connected line segments).
 */
export interface PolylineGraphicsOptions {
  positions?: number[];
  width?: number;
  color?: [number, number, number, number];
  show?: boolean;
  clampToGround?: boolean;
}

export class PolylineGraphics {
  positions: number[];
  width: number;
  color?: [number, number, number, number];
  show: boolean;
  clampToGround: boolean;

  constructor(options?: PolylineGraphicsOptions) {
    this.positions = options?.positions ?? [];
    this.width = options?.width ?? 1;
    this.color = options?.color;
    this.show = options?.show ?? true;
    this.clampToGround = options?.clampToGround ?? false;
  }
}
