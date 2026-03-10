import type { DataSource } from './DataSource';
import { Event } from './Event';

/**
 * A collection of {@link DataSource} instances.
 * Fires events when data sources are added or removed.
 */
export class DataSourceCollection {
  private _dataSources: DataSource[] = [];

  /** Fired when a data source is added to the collection. */
  readonly onAdd = new Event<DataSource>();

  /** Fired when a data source is removed from the collection. */
  readonly onRemove = new Event<DataSource>();

  /**
   * Adds a data source to the collection.
   * @param dataSource - The data source to add.
   * @returns A promise that resolves to the added data source.
   */
  async add(dataSource: DataSource): Promise<DataSource> {
    this._dataSources.push(dataSource);
    this.onAdd.raiseEvent(dataSource);
    return dataSource;
  }

  /**
   * Removes a data source from the collection.
   * @param dataSource - The data source to remove.
   * @returns `true` if the data source was found and removed.
   */
  remove(dataSource: DataSource): boolean {
    const index = this._dataSources.indexOf(dataSource);
    if (index === -1) return false;
    this._dataSources.splice(index, 1);
    this.onRemove.raiseEvent(dataSource);
    return true;
  }

  /**
   * Gets the data source at the given index.
   * @param index - The zero-based index.
   * @returns The data source at that index.
   */
  get(index: number): DataSource {
    return this._dataSources[index];
  }

  /** The number of data sources in the collection. */
  get length(): number {
    return this._dataSources.length;
  }

  /**
   * Finds a data source by name.
   * @param name - The name to search for.
   * @returns The first matching data source, or `undefined`.
   */
  getByName(name: string): DataSource | undefined {
    return this._dataSources.find(ds => ds.name === name);
  }

  /**
   * Returns `true` if the collection contains the given data source.
   */
  contains(dataSource: DataSource): boolean {
    return this._dataSources.includes(dataSource);
  }

  /**
   * Removes all data sources from the collection, firing {@link onRemove} for each.
   */
  removeAll(): void {
    const old = [...this._dataSources];
    this._dataSources.length = 0;
    for (const ds of old) this.onRemove.raiseEvent(ds);
  }
}
