import type { EntityCollection } from './EntityCollection';
import type { JulianDateType } from '@vellusion/scene';

/**
 * Defines the interface for a data source that manages a collection of entities.
 * Data sources are responsible for loading, updating, and providing entities
 * that can be visualized in the scene.
 */
export interface DataSource {
  /** A human-readable name for this data source. */
  readonly name: string;

  /** The collection of entities managed by this data source. */
  readonly entities: EntityCollection;

  /** Whether the data source is currently loading data. */
  readonly isLoading: boolean;

  /**
   * Updates the data source to the given time.
   * @param time - The simulation time to update to.
   * @returns `true` if the data source changed as a result of the update.
   */
  update(time: JulianDateType): boolean;
}
