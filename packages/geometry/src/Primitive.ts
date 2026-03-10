// ---------------------------------------------------------------------------
// Primitive – batches GeometryInstances with an Appearance for rendering.
// ---------------------------------------------------------------------------

import { GeometryInstance } from './GeometryInstance';
import type { Appearance } from './Appearance';

export class Primitive {
  readonly geometryInstances: GeometryInstance[];
  appearance: Appearance;
  show: boolean;
  private _ready: boolean = false;

  constructor(options: {
    geometryInstances: GeometryInstance | GeometryInstance[];
    appearance: Appearance;
    show?: boolean;
  }) {
    const instances = options.geometryInstances;
    this.geometryInstances = Array.isArray(instances) ? instances : [instances];
    this.appearance = options.appearance;
    this.show = options.show ?? true;
  }

  get ready(): boolean {
    return this._ready;
  }

  /**
   * Prepare GPU resources. In a real implementation this would create
   * GPU buffers and batch geometry. For now, just mark as ready.
   */
  update(): void {
    this._ready = true;
  }

  destroy(): void {
    this._ready = false;
  }
}
