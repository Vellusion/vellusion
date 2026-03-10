import type { JulianDateType } from '@vellusion/scene';
import type { Property } from './Property';

/**
 * A property that references another entity's property by entity ID and
 * property path. When evaluated, it looks up the entity in the collection
 * and traverses the property path to resolve the value.
 */
export class ReferenceProperty implements Property {
  private _collection: any;
  private _entityId: string;
  private _propertyPath: string[];

  get isConstant(): boolean {
    return false;
  }

  /**
   * @param collection - An EntityCollection (or any object with a `getById` method).
   * @param entityId - The ID of the target entity.
   * @param propertyPath - Array of property names to traverse (e.g. ['position'] or ['billboard', 'color']).
   */
  constructor(collection: any, entityId: string, propertyPath: string[]) {
    this._collection = collection;
    this._entityId = entityId;
    this._propertyPath = propertyPath;
  }

  /**
   * Resolves the referenced entity's property and returns its value at the
   * given time.
   */
  getValue(time: JulianDateType): any {
    const entity = this._collection.getById(this._entityId);
    if (!entity) return undefined;

    let current: any = entity;
    for (const segment of this._propertyPath) {
      if (current == null) return undefined;
      current = current[segment];
    }

    // If the resolved value is itself a Property, evaluate it
    if (current != null && typeof current.getValue === 'function') {
      return current.getValue(time);
    }
    return current;
  }

  equals(other: Property): boolean {
    if (!(other instanceof ReferenceProperty)) return false;
    return (
      this._collection === other._collection &&
      this._entityId === other._entityId &&
      this._propertyPath.length === other._propertyPath.length &&
      this._propertyPath.every((seg, i) => seg === other._propertyPath[i])
    );
  }
}
