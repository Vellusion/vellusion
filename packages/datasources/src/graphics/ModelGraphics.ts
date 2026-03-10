/**
 * Describes a 3D model (e.g., glTF).
 */
export interface ModelGraphicsOptions {
  uri?: string;
  scale?: number;
  color?: [number, number, number, number];
  show?: boolean;
  silhouetteColor?: [number, number, number, number];
  silhouetteSize?: number;
}

export class ModelGraphics {
  uri: string;
  scale: number;
  color?: [number, number, number, number];
  show: boolean;
  silhouetteColor?: [number, number, number, number];
  silhouetteSize: number;

  constructor(options?: ModelGraphicsOptions) {
    this.uri = options?.uri ?? '';
    this.scale = options?.scale ?? 1.0;
    this.color = options?.color;
    this.show = options?.show ?? true;
    this.silhouetteColor = options?.silhouetteColor;
    this.silhouetteSize = options?.silhouetteSize ?? 0;
  }
}
