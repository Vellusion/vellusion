/**
 * Describes an ellipse or circle on a surface or extruded into a volume.
 */
export interface EllipseGraphicsOptions {
  semiMajorAxis?: number;
  semiMinorAxis?: number;
  height?: number;
  extrudedHeight?: number;
  rotation?: number;
  color?: [number, number, number, number];
  fill?: boolean;
  outline?: boolean;
  outlineColor?: [number, number, number, number];
  show?: boolean;
}

export class EllipseGraphics {
  semiMajorAxis: number;
  semiMinorAxis: number;
  height: number;
  extrudedHeight?: number;
  rotation: number;
  color?: [number, number, number, number];
  fill: boolean;
  outline: boolean;
  outlineColor?: [number, number, number, number];
  show: boolean;

  constructor(options?: EllipseGraphicsOptions) {
    this.semiMajorAxis = options?.semiMajorAxis ?? 1;
    this.semiMinorAxis = options?.semiMinorAxis ?? 1;
    this.height = options?.height ?? 0;
    this.extrudedHeight = options?.extrudedHeight;
    this.rotation = options?.rotation ?? 0;
    this.color = options?.color;
    this.fill = options?.fill ?? true;
    this.outline = options?.outline ?? false;
    this.outlineColor = options?.outlineColor;
    this.show = options?.show ?? true;
  }
}
