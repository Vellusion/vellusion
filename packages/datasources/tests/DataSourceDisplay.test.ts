import { describe, it, expect } from 'vitest';
import { DataSourceDisplay, EntityVisualizer } from '../src/DataSourceDisplay';
import { DataSourceCollection } from '../src/DataSourceCollection';
import { CustomDataSource } from '../src/CustomDataSource';
import { Entity } from '../src/Entity';
import { ConstantPositionProperty } from '../src/properties/ConstantPositionProperty';
import { Vec3 } from '@vellusion/math';
import type { JulianDateType } from '@vellusion/scene';

const mockTime = {} as JulianDateType;

describe('DataSourceDisplay', () => {
  it('constructs with DataSourceCollection', () => {
    const collection = new DataSourceCollection();
    const display = new DataSourceDisplay({ dataSourceCollection: collection });
    expect(display.dataSourceCollection).toBe(collection);
  });

  it('tracks entities after update', async () => {
    const collection = new DataSourceCollection();
    const ds = new CustomDataSource('test');
    const entity = new Entity({ id: 'e1', name: 'Test' });
    entity.position = new ConstantPositionProperty(Vec3.create(1, 0, 0));
    ds.entities.add(entity);
    await collection.add(ds);

    const display = new DataSourceDisplay({ dataSourceCollection: collection });
    display.update(mockTime);
    expect(display.trackedEntityIds).toContain('e1');
  });

  it('update returns true when entities change', async () => {
    const collection = new DataSourceCollection();
    const ds = new CustomDataSource('test');
    const entity = new Entity({ id: 'e1' });
    entity.position = new ConstantPositionProperty(Vec3.create(1, 2, 3));
    ds.entities.add(entity);
    await collection.add(ds);

    const display = new DataSourceDisplay({ dataSourceCollection: collection });
    expect(display.update(mockTime)).toBe(true);
  });

  it('skips hidden entities', async () => {
    const collection = new DataSourceCollection();
    const ds = new CustomDataSource('test');
    const entity = new Entity({ id: 'e1', show: false });
    entity.position = new ConstantPositionProperty(Vec3.create(1, 0, 0));
    ds.entities.add(entity);
    await collection.add(ds);

    const display = new DataSourceDisplay({ dataSourceCollection: collection });
    display.update(mockTime);
    expect(display.trackedEntityIds).not.toContain('e1');
  });

  it('removes visualizers for deleted entities', async () => {
    const collection = new DataSourceCollection();
    const ds = new CustomDataSource('test');
    const entity = new Entity({ id: 'e1' });
    entity.position = new ConstantPositionProperty(Vec3.create(1, 0, 0));
    ds.entities.add(entity);
    await collection.add(ds);

    const display = new DataSourceDisplay({ dataSourceCollection: collection });
    display.update(mockTime);
    expect(display.trackedEntityIds).toContain('e1');

    ds.entities.remove(entity);
    display.update(mockTime);
    expect(display.trackedEntityIds).not.toContain('e1');
  });

  it('handles empty DataSourceCollection', () => {
    const collection = new DataSourceCollection();
    const display = new DataSourceDisplay({ dataSourceCollection: collection });
    expect(display.update(mockTime)).toBe(false);
  });

  it('handles multiple data sources', async () => {
    const collection = new DataSourceCollection();
    const ds1 = new CustomDataSource('ds1');
    const ds2 = new CustomDataSource('ds2');
    ds1.entities.add(new Entity({ id: 'a' }));
    ds2.entities.add(new Entity({ id: 'b' }));
    await collection.add(ds1);
    await collection.add(ds2);

    const display = new DataSourceDisplay({ dataSourceCollection: collection });
    display.update(mockTime);
    expect(display.trackedEntityIds).toContain('a');
    expect(display.trackedEntityIds).toContain('b');
  });

  it('destroy clears all visualizers', async () => {
    const collection = new DataSourceCollection();
    const ds = new CustomDataSource('test');
    ds.entities.add(new Entity({ id: 'e1' }));
    await collection.add(ds);

    const display = new DataSourceDisplay({ dataSourceCollection: collection });
    display.update(mockTime);
    display.destroy();
    expect(display.trackedEntityIds).toHaveLength(0);
  });

  it('update returns false when no entities have positions', async () => {
    const collection = new DataSourceCollection();
    const ds = new CustomDataSource('test');
    ds.entities.add(new Entity({ id: 'e1' }));
    await collection.add(ds);

    const display = new DataSourceDisplay({ dataSourceCollection: collection });
    // Entity has no position property, so update should return false
    expect(display.update(mockTime)).toBe(false);
  });

  it('update returns false on second call with constant position', async () => {
    const collection = new DataSourceCollection();
    const ds = new CustomDataSource('test');
    const entity = new Entity({ id: 'e1' });
    entity.position = new ConstantPositionProperty(Vec3.create(1, 2, 3));
    ds.entities.add(entity);
    await collection.add(ds);

    const display = new DataSourceDisplay({ dataSourceCollection: collection });
    display.update(mockTime);
    // Second call with same position should return false
    expect(display.update(mockTime)).toBe(false);
  });

  it('handles data source removal from collection', async () => {
    const collection = new DataSourceCollection();
    const ds = new CustomDataSource('test');
    const entity = new Entity({ id: 'e1' });
    entity.position = new ConstantPositionProperty(Vec3.create(1, 0, 0));
    ds.entities.add(entity);
    await collection.add(ds);

    const display = new DataSourceDisplay({ dataSourceCollection: collection });
    display.update(mockTime);
    expect(display.trackedEntityIds).toContain('e1');

    collection.remove(ds);
    display.update(mockTime);
    expect(display.trackedEntityIds).not.toContain('e1');
  });

  it('detects position changes across updates', async () => {
    const collection = new DataSourceCollection();
    const ds = new CustomDataSource('test');
    const entity = new Entity({ id: 'e1' });
    const posProp = new ConstantPositionProperty(Vec3.create(1, 2, 3));
    entity.position = posProp;
    ds.entities.add(entity);
    await collection.add(ds);

    const display = new DataSourceDisplay({ dataSourceCollection: collection });
    display.update(mockTime);

    // Change position
    posProp.setValue(Vec3.create(4, 5, 6));
    expect(display.update(mockTime)).toBe(true);
  });
});

describe('EntityVisualizer', () => {
  it('tracks position changes', () => {
    const entity = new Entity({ id: 'test' });
    entity.position = new ConstantPositionProperty(Vec3.create(1, 2, 3));
    const viz = new EntityVisualizer(entity);
    expect(viz.update(mockTime)).toBe(true);
    expect(viz.lastPosition).toBeDefined();
  });

  it('returns false when position unchanged', () => {
    const entity = new Entity({ id: 'test' });
    entity.position = new ConstantPositionProperty(Vec3.create(1, 2, 3));
    const viz = new EntityVisualizer(entity);
    viz.update(mockTime);
    expect(viz.update(mockTime)).toBe(false);
  });

  it('destroy marks as destroyed', () => {
    const entity = new Entity({ id: 'test' });
    const viz = new EntityVisualizer(entity);
    viz.destroy();
    expect(viz.isDestroyed).toBe(true);
    expect(viz.update(mockTime)).toBe(false);
  });

  it('stores correct position values', () => {
    const entity = new Entity({ id: 'test' });
    entity.position = new ConstantPositionProperty(Vec3.create(10, 20, 30));
    const viz = new EntityVisualizer(entity);
    viz.update(mockTime);
    expect(viz.lastPosition).not.toBeNull();
    expect(viz.lastPosition![0]).toBeCloseTo(10);
    expect(viz.lastPosition![1]).toBeCloseTo(20);
    expect(viz.lastPosition![2]).toBeCloseTo(30);
  });

  it('destroy clears lastPosition', () => {
    const entity = new Entity({ id: 'test' });
    entity.position = new ConstantPositionProperty(Vec3.create(1, 2, 3));
    const viz = new EntityVisualizer(entity);
    viz.update(mockTime);
    expect(viz.lastPosition).not.toBeNull();
    viz.destroy();
    expect(viz.lastPosition).toBeNull();
  });

  it('handles entity with no position', () => {
    const entity = new Entity({ id: 'test' });
    const viz = new EntityVisualizer(entity);
    expect(viz.update(mockTime)).toBe(false);
    expect(viz.lastPosition).toBeNull();
  });
});
