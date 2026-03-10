/**
 * Describes an ellipsoid or sphere volume.
 */
export interface EllipsoidGraphicsOptions {
  radii?: [number, number, number];
  color?: [number, number, number, number];
  fill?: boolean;
  outline?: boolean;
  outlineColor?: [number, number, number, number];
  slicePartitions?: number;
  stackPartitions?: number;
  show?: boolean;
}

export class EllipsoidGraphics {
  radii: [number, number, number];
  color?: [number, number, number, number];
  fill: boolean;
  outline: boolean;
  outlineColor?: [number, number, number, number];
  slicePartitions: number;
  stackPartitions: number;
  show: boolean;

  constructor(options?: EllipsoidGraphicsOptions) {
    this.radii = options?.radii ?? [1, 1, 1];
    this.color = options?.color;
    this.fill = options?.fill ?? true;
    this.outline = options?.outline ?? false;
    this.outlineColor = options?.outlineColor;
    this.slicePartitions = options?.slicePartitions ?? 32;
    this.stackPartitions = options?.stackPartitions ?? 16;
    this.show = options?.show ?? true;
  }
}
