/**
 * Describes a point (a round dot rendered in screen space).
 */
export interface PointGraphicsOptions {
  pixelSize?: number;
  color?: [number, number, number, number];
  outlineColor?: [number, number, number, number];
  outlineWidth?: number;
  show?: boolean;
}

export class PointGraphics {
  pixelSize: number;
  color?: [number, number, number, number];
  outlineColor?: [number, number, number, number];
  outlineWidth: number;
  show: boolean;

  constructor(options?: PointGraphicsOptions) {
    this.pixelSize = options?.pixelSize ?? 4;
    this.color = options?.color;
    this.outlineColor = options?.outlineColor;
    this.outlineWidth = options?.outlineWidth ?? 0;
    this.show = options?.show ?? true;
  }
}
