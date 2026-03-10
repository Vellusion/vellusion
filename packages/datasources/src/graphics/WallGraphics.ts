/**
 * Describes a wall defined by a series of positions with height extents.
 */
export interface WallGraphicsOptions {
  positions?: number[];
  maximumHeights?: number[];
  minimumHeights?: number[];
  color?: [number, number, number, number];
  fill?: boolean;
  outline?: boolean;
  outlineColor?: [number, number, number, number];
  show?: boolean;
}

export class WallGraphics {
  positions: number[];
  maximumHeights: number[];
  minimumHeights: number[];
  color?: [number, number, number, number];
  fill: boolean;
  outline: boolean;
  outlineColor?: [number, number, number, number];
  show: boolean;

  constructor(options?: WallGraphicsOptions) {
    this.positions = options?.positions ?? [];
    this.maximumHeights = options?.maximumHeights ?? [];
    this.minimumHeights = options?.minimumHeights ?? [];
    this.color = options?.color;
    this.fill = options?.fill ?? true;
    this.outline = options?.outline ?? false;
    this.outlineColor = options?.outlineColor;
    this.show = options?.show ?? true;
  }
}
