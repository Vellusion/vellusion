/**
 * Describes a billboard (a 2D image positioned in 3D space).
 */
export interface BillboardGraphicsOptions {
  image?: string;
  width?: number;
  height?: number;
  color?: [number, number, number, number];
  scale?: number;
  rotation?: number;
  show?: boolean;
}

export class BillboardGraphics {
  image?: string;
  width: number;
  height: number;
  color?: [number, number, number, number];
  scale: number;
  rotation: number;
  show: boolean;

  constructor(options?: BillboardGraphicsOptions) {
    this.image = options?.image;
    this.width = options?.width ?? 32;
    this.height = options?.height ?? 32;
    this.color = options?.color;
    this.scale = options?.scale ?? 1.0;
    this.rotation = options?.rotation ?? 0;
    this.show = options?.show ?? true;
  }
}
