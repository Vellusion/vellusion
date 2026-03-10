/**
 * Describes a plane defined by a normal, distance, and 2D dimensions.
 */
export interface PlaneGraphicsOptions {
  normal?: [number, number, number];
  distance?: number;
  dimensions?: [number, number];
  color?: [number, number, number, number];
  fill?: boolean;
  outline?: boolean;
  outlineColor?: [number, number, number, number];
  show?: boolean;
}

export class PlaneGraphics {
  normal: [number, number, number];
  distance: number;
  dimensions: [number, number];
  color?: [number, number, number, number];
  fill: boolean;
  outline: boolean;
  outlineColor?: [number, number, number, number];
  show: boolean;

  constructor(options?: PlaneGraphicsOptions) {
    this.normal = options?.normal ?? [0, 0, 1];
    this.distance = options?.distance ?? 0;
    this.dimensions = options?.dimensions ?? [1, 1];
    this.color = options?.color;
    this.fill = options?.fill ?? true;
    this.outline = options?.outline ?? false;
    this.outlineColor = options?.outlineColor;
    this.show = options?.show ?? true;
  }
}
