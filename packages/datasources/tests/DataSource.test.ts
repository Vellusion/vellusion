import { describe, it, expect, vi } from 'vitest';
import { CustomDataSource } from '../src/CustomDataSource';
import { DataSourceCollection } from '../src/DataSourceCollection';
import { EntityCollection } from '../src/EntityCollection';

// ---------------------------------------------------------------------------
// CustomDataSource
// ---------------------------------------------------------------------------
describe('CustomDataSource', () => {
  it('should default name to "custom"', () => {
    const ds = new CustomDataSource();
    expect(ds.name).toBe('custom');
  });

  it('should accept a custom name', () => {
    const ds = new CustomDataSource('mySource');
    expect(ds.name).toBe('mySource');
  });

  it('should have entities as an EntityCollection', () => {
    const ds = new CustomDataSource();
    expect(ds.entities).toBeInstanceOf(EntityCollection);
  });

  it('should default isLoading to false', () => {
    const ds = new CustomDataSource();
    expect(ds.isLoading).toBe(false);
  });

  it('should return true from update', () => {
    const ds = new CustomDataSource();
    const result = ds.update({ dayNumber: 0, secondsOfDay: 0 });
    expect(result).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// DataSourceCollection
// ---------------------------------------------------------------------------
describe('DataSourceCollection', () => {
  it('should start with length 0', () => {
    const col = new DataSourceCollection();
    expect(col.length).toBe(0);
  });

  it('should increase length after add', async () => {
    const col = new DataSourceCollection();
    await col.add(new CustomDataSource('a'));
    expect(col.length).toBe(1);
  });

  it('should decrease length after remove', async () => {
    const col = new DataSourceCollection();
    const ds = new CustomDataSource('a');
    await col.add(ds);
    col.remove(ds);
    expect(col.length).toBe(0);
  });

  it('should return the data source by index with get', async () => {
    const col = new DataSourceCollection();
    const ds = new CustomDataSource('first');
    await col.add(ds);
    expect(col.get(0)).toBe(ds);
  });

  it('should find a data source by name with getByName', async () => {
    const col = new DataSourceCollection();
    const ds = new CustomDataSource('findMe');
    await col.add(ds);
    expect(col.getByName('findMe')).toBe(ds);
    expect(col.getByName('nonexistent')).toBeUndefined();
  });

  it('should report contains correctly', async () => {
    const col = new DataSourceCollection();
    const ds = new CustomDataSource('c');
    await col.add(ds);
    expect(col.contains(ds)).toBe(true);
    col.remove(ds);
    expect(col.contains(ds)).toBe(false);
  });

  it('should remove all data sources with removeAll', async () => {
    const col = new DataSourceCollection();
    await col.add(new CustomDataSource('a'));
    await col.add(new CustomDataSource('b'));
    col.removeAll();
    expect(col.length).toBe(0);
  });

  it('should fire onAdd when a data source is added', async () => {
    const col = new DataSourceCollection();
    const listener = vi.fn();
    col.onAdd.addEventListener(listener);
    const ds = new CustomDataSource('x');
    await col.add(ds);
    expect(listener).toHaveBeenCalledWith(ds);
  });

  it('should fire onRemove when a data source is removed', async () => {
    const col = new DataSourceCollection();
    const ds = new CustomDataSource('y');
    await col.add(ds);
    const listener = vi.fn();
    col.onRemove.addEventListener(listener);
    col.remove(ds);
    expect(listener).toHaveBeenCalledWith(ds);
  });

  it('should fire onRemove for each data source during removeAll', async () => {
    const col = new DataSourceCollection();
    const ds1 = new CustomDataSource('r1');
    const ds2 = new CustomDataSource('r2');
    await col.add(ds1);
    await col.add(ds2);
    const removed: string[] = [];
    col.onRemove.addEventListener(ds => removed.push(ds.name));
    col.removeAll();
    expect(removed.sort()).toEqual(['r1', 'r2']);
  });

  it('should return false when removing an unknown data source', () => {
    const col = new DataSourceCollection();
    const ds = new CustomDataSource('unknown');
    expect(col.remove(ds)).toBe(false);
  });
});
