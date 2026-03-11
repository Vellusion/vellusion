import type { Tileset3DStyle } from './Tileset3DStyle';

/**
 * Manages per-feature properties for a tile.
 * Stores batch table data and per-feature visual state.
 */
export class Tile3DFeatureTable {
  private _properties: Record<string, any[]>;
  private _featureCount: number;
  private _colors: Float32Array[];
  private _showFlags: boolean[];

  constructor(featureCount: number, batchTableJson?: Record<string, any[]>) {
    this._featureCount = featureCount;
    this._properties = batchTableJson ?? {};
    this._colors = Array.from({ length: featureCount }, () => new Float32Array([1, 1, 1, 1]));
    this._showFlags = Array.from({ length: featureCount }, () => true);
  }

  get featureCount(): number {
    return this._featureCount;
  }

  getProperty(featureId: number, name: string): any {
    const arr = this._properties[name];
    return arr ? arr[featureId] : undefined;
  }

  setProperty(featureId: number, name: string, value: any): void {
    if (!this._properties[name]) {
      this._properties[name] = new Array(this._featureCount).fill(undefined);
    }
    this._properties[name][featureId] = value;
  }

  getAllProperties(featureId: number): Record<string, any> {
    const result: Record<string, any> = {};
    for (const [key, arr] of Object.entries(this._properties)) {
      result[key] = arr[featureId];
    }
    return result;
  }

  getColor(featureId: number): Float32Array {
    return this._colors[featureId];
  }

  setColor(featureId: number, color: Float32Array): void {
    this._colors[featureId] = color;
  }

  getShow(featureId: number): boolean {
    return this._showFlags[featureId];
  }

  setShow(featureId: number, show: boolean): void {
    this._showFlags[featureId] = show;
  }

  /**
   * Apply a Tileset3DStyle to all features.
   */
  applyStyle(style: Tileset3DStyle): void {
    for (let i = 0; i < this._featureCount; i++) {
      const props = this.getAllProperties(i);
      const result = style.applyToFeature(props);
      this._showFlags[i] = result.show;
      if (result.color) this._colors[i] = result.color;
    }
  }

  /**
   * Get property names.
   */
  get propertyNames(): string[] {
    return Object.keys(this._properties);
  }
}
