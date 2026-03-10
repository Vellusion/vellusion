/**
 * Describes a polyline volume (a polyline with a 2D cross-section shape).
 */
export interface PolylineVolumeGraphicsOptions {
  positions?: number[];
  shape?: number[];
  color?: [number, number, number, number];
  fill?: boolean;
  outline?: boolean;
  outlineColor?: [number, number, number, number];
  show?: boolean;
}

export class PolylineVolumeGraphics {
  positions: number[];
  shape: number[];
  color?: [number, number, number, number];
  fill: boolean;
  outline: boolean;
  outlineColor?: [number, number, number, number];
  show: boolean;

  constructor(options?: PolylineVolumeGraphicsOptions) {
    this.positions = options?.positions ?? [];
    this.shape = options?.shape ?? [];
    this.color = options?.color;
    this.fill = options?.fill ?? true;
    this.outline = options?.outline ?? false;
    this.outlineColor = options?.outlineColor;
    this.show = options?.show ?? true;
  }
}
