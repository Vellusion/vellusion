/**
 * Describes a rectangle defined by geographic coordinates.
 */
export interface RectangleGraphicsOptions {
  coordinates?: { west: number; south: number; east: number; north: number };
  height?: number;
  extrudedHeight?: number;
  color?: [number, number, number, number];
  fill?: boolean;
  outline?: boolean;
  outlineColor?: [number, number, number, number];
  rotation?: number;
  show?: boolean;
}

export class RectangleGraphics {
  coordinates: { west: number; south: number; east: number; north: number };
  height: number;
  extrudedHeight?: number;
  color?: [number, number, number, number];
  fill: boolean;
  outline: boolean;
  outlineColor?: [number, number, number, number];
  rotation: number;
  show: boolean;

  constructor(options?: RectangleGraphicsOptions) {
    this.coordinates = options?.coordinates ?? { west: 0, south: 0, east: 0, north: 0 };
    this.height = options?.height ?? 0;
    this.extrudedHeight = options?.extrudedHeight;
    this.color = options?.color;
    this.fill = options?.fill ?? true;
    this.outline = options?.outline ?? false;
    this.outlineColor = options?.outlineColor;
    this.rotation = options?.rotation ?? 0;
    this.show = options?.show ?? true;
  }
}
