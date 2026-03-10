/**
 * Describes a polygon defined by a set of positions.
 */
export interface PolygonGraphicsOptions {
  positions?: number[];
  height?: number;
  extrudedHeight?: number;
  color?: [number, number, number, number];
  fill?: boolean;
  outline?: boolean;
  outlineColor?: [number, number, number, number];
  stRotation?: number;
  show?: boolean;
}

export class PolygonGraphics {
  positions: number[];
  height: number;
  extrudedHeight?: number;
  color?: [number, number, number, number];
  fill: boolean;
  outline: boolean;
  outlineColor?: [number, number, number, number];
  stRotation: number;
  show: boolean;

  constructor(options?: PolygonGraphicsOptions) {
    this.positions = options?.positions ?? [];
    this.height = options?.height ?? 0;
    this.extrudedHeight = options?.extrudedHeight;
    this.color = options?.color;
    this.fill = options?.fill ?? true;
    this.outline = options?.outline ?? false;
    this.outlineColor = options?.outlineColor;
    this.stRotation = options?.stRotation ?? 0;
    this.show = options?.show ?? true;
  }
}
