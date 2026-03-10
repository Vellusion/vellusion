/**
 * Describes a cylinder, cone, or truncated cone volume.
 */
export interface CylinderGraphicsOptions {
  topRadius?: number;
  bottomRadius?: number;
  length?: number;
  color?: [number, number, number, number];
  fill?: boolean;
  outline?: boolean;
  outlineColor?: [number, number, number, number];
  slices?: number;
  show?: boolean;
}

export class CylinderGraphics {
  topRadius: number;
  bottomRadius: number;
  length: number;
  color?: [number, number, number, number];
  fill: boolean;
  outline: boolean;
  outlineColor?: [number, number, number, number];
  slices: number;
  show: boolean;

  constructor(options?: CylinderGraphicsOptions) {
    this.topRadius = options?.topRadius ?? 1;
    this.bottomRadius = options?.bottomRadius ?? 1;
    this.length = options?.length ?? 1;
    this.color = options?.color;
    this.fill = options?.fill ?? true;
    this.outline = options?.outline ?? false;
    this.outlineColor = options?.outlineColor;
    this.slices = options?.slices ?? 32;
    this.show = options?.show ?? true;
  }
}
