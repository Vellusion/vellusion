import type { DataSourceCollection } from './DataSourceCollection';
import type { Entity } from './Entity';
import type { JulianDateType } from '@vellusion/scene';

export interface DataSourceDisplayOptions {
  dataSourceCollection: DataSourceCollection;
}

/**
 * Bridges Entity data to rendering primitives. For each entity in all
 * data sources, evaluates properties at the current time and creates/updates
 * corresponding visualization objects.
 */
export class DataSourceDisplay {
  private _dataSourceCollection: DataSourceCollection;
  private _entityVisualizers: Map<string, EntityVisualizer> = new Map();

  constructor(options: DataSourceDisplayOptions) {
    this._dataSourceCollection = options.dataSourceCollection;
  }

  get dataSourceCollection(): DataSourceCollection {
    return this._dataSourceCollection;
  }

  /**
   * Update all visualizers for the given time.
   * Iterates all data sources, all entities, evaluates time-dynamic
   * properties, and updates the visualization state.
   * Returns true if any visualizer updated.
   */
  update(time: JulianDateType): boolean {
    let updated = false;
    for (let i = 0; i < this._dataSourceCollection.length; i++) {
      const ds = this._dataSourceCollection.get(i);
      if (!ds.update(time)) continue;

      for (const entity of ds.entities.values) {
        if (!entity.show) continue;
        let viz = this._entityVisualizers.get(entity.id);
        if (!viz) {
          viz = new EntityVisualizer(entity);
          this._entityVisualizers.set(entity.id, viz);
        }
        if (viz.update(time)) {
          updated = true;
        }
      }
    }

    // Remove visualizers for entities that no longer exist
    for (const [id, viz] of this._entityVisualizers) {
      if (!this._entityExists(id)) {
        viz.destroy();
        this._entityVisualizers.delete(id);
        updated = true;
      }
    }

    return updated;
  }

  private _entityExists(id: string): boolean {
    for (let i = 0; i < this._dataSourceCollection.length; i++) {
      if (this._dataSourceCollection.get(i).entities.getById(id)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Get all currently tracked entity IDs.
   */
  get trackedEntityIds(): string[] {
    return Array.from(this._entityVisualizers.keys());
  }

  destroy(): void {
    for (const [, viz] of this._entityVisualizers) {
      viz.destroy();
    }
    this._entityVisualizers.clear();
  }
}

/**
 * Tracks visualization state for a single entity.
 * Evaluates position, graphics properties at each time step.
 */
export class EntityVisualizer {
  readonly entity: Entity;
  private _lastPosition: Float64Array | null = null;
  private _destroyed = false;

  constructor(entity: Entity) {
    this.entity = entity;
  }

  /**
   * Evaluate entity properties at the given time.
   * Returns true if any property changed.
   */
  update(time: JulianDateType): boolean {
    if (this._destroyed) return false;

    let changed = false;

    // Evaluate position
    if (this.entity.position) {
      const pos = this.entity.position.getValue(time);
      if (pos && (!this._lastPosition || !this._positionsEqual(pos, this._lastPosition))) {
        this._lastPosition = pos instanceof Float64Array ? new Float64Array(pos) : pos;
        changed = true;
      }
    }

    return changed;
  }

  get lastPosition(): Float64Array | null {
    return this._lastPosition;
  }

  get isDestroyed(): boolean {
    return this._destroyed;
  }

  private _positionsEqual(a: ArrayLike<number>, b: ArrayLike<number>): boolean {
    if (!a || !b) return false;
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (Math.abs(a[i] - b[i]) > 1e-10) return false;
    }
    return true;
  }

  destroy(): void {
    this._destroyed = true;
    this._lastPosition = null;
  }
}
