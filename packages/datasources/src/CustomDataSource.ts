import { EntityCollection } from './EntityCollection';
import type { DataSource } from './DataSource';
import type { JulianDateType } from '@vellusion/scene';

/**
 * A {@link DataSource} that allows the user to manually manage entities.
 * Entities can be added, removed, and updated directly through the
 * {@link EntityCollection} exposed by the `entities` property.
 */
export class CustomDataSource implements DataSource {
  readonly name: string;
  readonly entities: EntityCollection;
  isLoading: boolean = false;

  /**
   * Creates a new CustomDataSource.
   * @param name - A human-readable name for this data source. Defaults to `'custom'`.
   */
  constructor(name: string = 'custom') {
    this.name = name;
    this.entities = new EntityCollection();
  }

  /**
   * Updates the data source to the given time.
   * The default implementation is a no-op that always returns `true`.
   * @param _time - The simulation time (unused).
   * @returns Always `true`.
   */
  update(_time: JulianDateType): boolean {
    return true;
  }
}
