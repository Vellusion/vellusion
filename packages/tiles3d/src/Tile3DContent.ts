export interface Tile3DFeature {
  featureId: number;
  getProperty(name: string): any;
  setProperty(name: string, value: any): void;
  color: Float32Array; // [r, g, b, a]
  show: boolean;
}

export interface Tile3DContent {
  readonly type: string;
  readonly featureCount: number;
  readonly byteLength: number;
  getFeature(index: number): Tile3DFeature;
}
