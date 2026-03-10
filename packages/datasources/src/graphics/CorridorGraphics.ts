/**
 * Describes a corridor (a shape extruded along a polyline path).
 */
export interface CorridorGraphicsOptions {
  positions?: number[];
  width?: number;
  height?: number;
  extrudedHeight?: number;
  color?: [number, number, number, number];
  fill?: boolean;
  outline?: boolean;
  outlineColor?: [number, number, number, number];
  show?: boolean;
}

export class CorridorGraphics {
  positions: number[];
  width: number;
  height: number;
  extrudedHeight?: number;
  color?: [number, number, number, number];
  fill: boolean;
  outline: boolean;
  outlineColor?: [number, number, number, number];
  show: boolean;

  constructor(options?: CorridorGraphicsOptions) {
    this.positions = options?.positions ?? [];
    this.width = options?.width ?? 1;
    this.height = options?.height ?? 0;
    this.extrudedHeight = options?.extrudedHeight;
    this.color = options?.color;
    this.fill = options?.fill ?? true;
    this.outline = options?.outline ?? false;
    this.outlineColor = options?.outlineColor;
    this.show = options?.show ?? true;
  }
}
