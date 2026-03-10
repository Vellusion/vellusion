import { ImageryLayer } from './ImageryLayer';

/**
 * Ordered collection of {@link ImageryLayer} instances.
 *
 * Layers at the beginning of the collection are rendered on top (higher
 * visual priority). Use {@link raise}/{@link lower} to reorder.
 */
export class ImageryLayerCollection {
  private _layers: ImageryLayer[] = [];

  /** Number of layers in the collection. */
  get length(): number {
    return this._layers.length;
  }

  /**
   * Add a layer to the collection.
   * @param layer  The imagery layer to add.
   * @param index  Optional insertion index. If omitted the layer is appended.
   */
  add(layer: ImageryLayer, index?: number): void {
    if (index !== undefined) {
      this._layers.splice(index, 0, layer);
    } else {
      this._layers.push(layer);
    }
  }

  /**
   * Remove a layer from the collection.
   * @returns `true` if the layer was found and removed, `false` otherwise.
   */
  remove(layer: ImageryLayer): boolean {
    const idx = this._layers.indexOf(layer);
    if (idx === -1) return false;
    this._layers.splice(idx, 1);
    return true;
  }

  /** Get the layer at the given index. */
  get(index: number): ImageryLayer {
    return this._layers[index];
  }

  /** Return the index of the layer, or -1 if not found. */
  indexOf(layer: ImageryLayer): number {
    return this._layers.indexOf(layer);
  }

  /** Move a layer one position towards the front (lower index = higher priority). */
  raise(layer: ImageryLayer): void {
    const idx = this._layers.indexOf(layer);
    if (idx > 0) {
      [this._layers[idx - 1], this._layers[idx]] = [this._layers[idx], this._layers[idx - 1]];
    }
  }

  /** Move a layer one position towards the back (higher index = lower priority). */
  lower(layer: ImageryLayer): void {
    const idx = this._layers.indexOf(layer);
    if (idx >= 0 && idx < this._layers.length - 1) {
      [this._layers[idx], this._layers[idx + 1]] = [this._layers[idx + 1], this._layers[idx]];
    }
  }

  /** Move a layer to the very front (index 0). */
  raiseToTop(layer: ImageryLayer): void {
    const idx = this._layers.indexOf(layer);
    if (idx >= 0) {
      this._layers.splice(idx, 1);
      this._layers.unshift(layer);
    }
  }

  /** Move a layer to the very back (last index). */
  lowerToBottom(layer: ImageryLayer): void {
    const idx = this._layers.indexOf(layer);
    if (idx >= 0) {
      this._layers.splice(idx, 1);
      this._layers.push(layer);
    }
  }

  /** Iterate over layers. */
  [Symbol.iterator](): Iterator<ImageryLayer> {
    return this._layers[Symbol.iterator]();
  }
}
