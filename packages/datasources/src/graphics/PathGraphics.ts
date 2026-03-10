/**
 * Describes a path (a polyline showing entity movement over time).
 */
export interface PathGraphicsOptions {
  width?: number;
  color?: [number, number, number, number];
  resolution?: number;
  show?: boolean;
  leadTime?: number;
  trailTime?: number;
}

export class PathGraphics {
  width: number;
  color?: [number, number, number, number];
  resolution: number;
  show: boolean;
  leadTime?: number;
  trailTime?: number;

  constructor(options?: PathGraphicsOptions) {
    this.width = options?.width ?? 1;
    this.color = options?.color;
    this.resolution = options?.resolution ?? 60;
    this.show = options?.show ?? true;
    this.leadTime = options?.leadTime;
    this.trailTime = options?.trailTime;
  }
}
