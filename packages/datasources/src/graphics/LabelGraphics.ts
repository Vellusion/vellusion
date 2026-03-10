/**
 * Describes a label (text rendered as a billboard).
 */
export interface LabelGraphicsOptions {
  text?: string;
  font?: string;
  fillColor?: [number, number, number, number];
  outlineColor?: [number, number, number, number];
  outlineWidth?: number;
  scale?: number;
  show?: boolean;
  horizontalOrigin?: number;
  verticalOrigin?: number;
}

export class LabelGraphics {
  text: string;
  font: string;
  fillColor?: [number, number, number, number];
  outlineColor?: [number, number, number, number];
  outlineWidth: number;
  scale: number;
  show: boolean;
  horizontalOrigin: number;
  verticalOrigin: number;

  constructor(options?: LabelGraphicsOptions) {
    this.text = options?.text ?? '';
    this.font = options?.font ?? '16px sans-serif';
    this.fillColor = options?.fillColor;
    this.outlineColor = options?.outlineColor;
    this.outlineWidth = options?.outlineWidth ?? 0;
    this.scale = options?.scale ?? 1.0;
    this.show = options?.show ?? true;
    this.horizontalOrigin = options?.horizontalOrigin ?? 0;
    this.verticalOrigin = options?.verticalOrigin ?? 0;
  }
}
