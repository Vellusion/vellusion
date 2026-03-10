import { Event } from './Event';
import { Entity, type EntityOptions } from './Entity';

/**
 * A collection of {@link Entity} instances, indexed by id.
 * Fires events when entities are added, removed, or changed.
 */
export class EntityCollection {
  private _entities: Map<string, Entity> = new Map();

  /** Fired when an entity is added to the collection. */
  readonly onAdd = new Event<Entity>();

  /** Fired when an entity is removed from the collection. */
  readonly onRemove = new Event<Entity>();

  /** Fired when an entity in the collection changes. */
  readonly onChange = new Event<Entity>();

  /**
   * Adds an entity (or creates one from options) to the collection.
   * @returns The added entity.
   */
  add(entityOrOptions: Entity | EntityOptions): Entity {
    const entity = entityOrOptions instanceof Entity
      ? entityOrOptions
      : new Entity(entityOrOptions);
    this._entities.set(entity.id, entity);
    this.onAdd.raiseEvent(entity);
    return entity;
  }

  /**
   * Removes an entity from the collection.
   * @returns `true` if the entity was found and removed.
   */
  remove(entity: Entity): boolean {
    const removed = this._entities.delete(entity.id);
    if (removed) this.onRemove.raiseEvent(entity);
    return removed;
  }

  /**
   * Retrieves an entity by its id.
   */
  getById(id: string): Entity | undefined {
    return this._entities.get(id);
  }

  /**
   * Returns a snapshot array of all entities currently in the collection.
   */
  get values(): Entity[] {
    return [...this._entities.values()];
  }

  /**
   * The number of entities in the collection.
   */
  get length(): number {
    return this._entities.size;
  }

  /**
   * Returns `true` if the collection contains the given entity (matched by id).
   */
  contains(entity: Entity): boolean {
    return this._entities.has(entity.id);
  }

  /**
   * Removes all entities from the collection, firing onRemove for each.
   */
  removeAll(): void {
    for (const entity of this._entities.values()) {
      this.onRemove.raiseEvent(entity);
    }
    this._entities.clear();
  }
}
