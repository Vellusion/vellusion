/**
 * Describes a box (rectangular cuboid) volume.
 */
export interface BoxGraphicsOptions {
  dimensions?: [number, number, number];
  color?: [number, number, number, number];
  show?: boolean;
  fill?: boolean;
  outline?: boolean;
  outlineColor?: [number, number, number, number];
}

export class BoxGraphics {
  dimensions: [number, number, number];
  color?: [number, number, number, number];
  show: boolean;
  fill: boolean;
  outline: boolean;
  outlineColor?: [number, number, number, number];

  constructor(options?: BoxGraphicsOptions) {
    this.dimensions = options?.dimensions ?? [1, 1, 1];
    this.color = options?.color;
    this.show = options?.show ?? true;
    this.fill = options?.fill ?? true;
    this.outline = options?.outline ?? false;
    this.outlineColor = options?.outlineColor;
  }
}
