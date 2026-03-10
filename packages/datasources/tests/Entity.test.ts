import { describe, it, expect, vi } from 'vitest';
import { Event } from '../src/Event';
import { Entity } from '../src/Entity';
import { EntityCollection } from '../src/EntityCollection';
import { EntityCluster } from '../src/EntityCluster';

// ---------------------------------------------------------------------------
// Event
// ---------------------------------------------------------------------------
describe('Event', () => {
  it('should fire listener on raiseEvent', () => {
    const event = new Event<number>();
    const listener = vi.fn();
    event.addEventListener(listener);
    event.raiseEvent(42);
    expect(listener).toHaveBeenCalledWith(42);
  });

  it('should stop firing after removeEventListener', () => {
    const event = new Event<string>();
    const listener = vi.fn();
    event.addEventListener(listener);
    event.removeEventListener(listener);
    event.raiseEvent('hello');
    expect(listener).not.toHaveBeenCalled();
  });

  it('should return an unsubscribe function from addEventListener', () => {
    const event = new Event<number>();
    const listener = vi.fn();
    const unsub = event.addEventListener(listener);
    unsub();
    event.raiseEvent(1);
    expect(listener).not.toHaveBeenCalled();
  });

  it('should track numberOfListeners correctly', () => {
    const event = new Event<void>();
    expect(event.numberOfListeners).toBe(0);
    const l1 = () => {};
    const l2 = () => {};
    event.addEventListener(l1);
    expect(event.numberOfListeners).toBe(1);
    event.addEventListener(l2);
    expect(event.numberOfListeners).toBe(2);
    event.removeEventListener(l1);
    expect(event.numberOfListeners).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// Entity
// ---------------------------------------------------------------------------
describe('Entity', () => {
  it('should auto-generate a unique id', () => {
    const a = new Entity();
    const b = new Entity();
    expect(a.id).toMatch(/^entity_\d+$/);
    expect(b.id).toMatch(/^entity_\d+$/);
    expect(a.id).not.toBe(b.id);
  });

  it('should accept custom id, name, and show', () => {
    const e = new Entity({ id: 'myId', name: 'MyEntity', show: false });
    expect(e.id).toBe('myId');
    expect(e.name).toBe('MyEntity');
    expect(e.show).toBe(false);
  });

  it('should default show to true', () => {
    const e = new Entity();
    expect(e.show).toBe(true);
  });

  it('should store graphics components', () => {
    const billboard = { image: 'test.png' };
    const polyline = { positions: [] };
    const e = new Entity({ billboard, polyline });
    expect(e.billboard).toBe(billboard);
    expect(e.polyline).toBe(polyline);
  });

  it('should establish parent-child relationship', () => {
    const parent = new Entity({ id: 'parent' });
    const child = new Entity({ id: 'child', parent });
    expect(child.parent).toBe(parent);
    expect(parent.children).toContain(child);
    expect(parent.children.length).toBe(1);
  });

  it('should store position and orientation', () => {
    const pos = { x: 1, y: 2, z: 3 };
    const orient = { x: 0, y: 0, z: 0, w: 1 };
    const e = new Entity({ position: pos, orientation: orient });
    expect(e.position).toBe(pos);
    expect(e.orientation).toBe(orient);
  });
});

// ---------------------------------------------------------------------------
// EntityCollection
// ---------------------------------------------------------------------------
describe('EntityCollection', () => {
  it('should add an Entity and increase length', () => {
    const col = new EntityCollection();
    const e = new Entity({ id: 'e1' });
    col.add(e);
    expect(col.length).toBe(1);
  });

  it('should add from EntityOptions and return created Entity', () => {
    const col = new EntityCollection();
    const e = col.add({ id: 'opts1', name: 'FromOptions' });
    expect(e).toBeInstanceOf(Entity);
    expect(e.id).toBe('opts1');
    expect(e.name).toBe('FromOptions');
    expect(col.length).toBe(1);
  });

  it('should remove an entity and return true', () => {
    const col = new EntityCollection();
    const e = col.add({ id: 'r1' });
    expect(col.remove(e)).toBe(true);
    expect(col.length).toBe(0);
  });

  it('should return false when removing a non-existent entity', () => {
    const col = new EntityCollection();
    const e = new Entity({ id: 'nonexist' });
    expect(col.remove(e)).toBe(false);
  });

  it('should retrieve entity by id with getById', () => {
    const col = new EntityCollection();
    const e = col.add({ id: 'lookup' });
    expect(col.getById('lookup')).toBe(e);
    expect(col.getById('missing')).toBeUndefined();
  });

  it('should report contains correctly', () => {
    const col = new EntityCollection();
    const e = col.add({ id: 'c1' });
    expect(col.contains(e)).toBe(true);
    col.remove(e);
    expect(col.contains(e)).toBe(false);
  });

  it('should return all entities via values', () => {
    const col = new EntityCollection();
    col.add({ id: 'v1' });
    col.add({ id: 'v2' });
    const vals = col.values;
    expect(vals.length).toBe(2);
    expect(vals.map(e => e.id).sort()).toEqual(['v1', 'v2']);
  });

  it('should removeAll and fire onRemove for each', () => {
    const col = new EntityCollection();
    col.add({ id: 'a1' });
    col.add({ id: 'a2' });
    const removed: string[] = [];
    col.onRemove.addEventListener(e => removed.push(e.id));
    col.removeAll();
    expect(col.length).toBe(0);
    expect(removed.sort()).toEqual(['a1', 'a2']);
  });

  it('should fire onAdd when an entity is added', () => {
    const col = new EntityCollection();
    const listener = vi.fn();
    col.onAdd.addEventListener(listener);
    const e = col.add({ id: 'add1' });
    expect(listener).toHaveBeenCalledWith(e);
  });

  it('should fire onRemove when an entity is removed', () => {
    const col = new EntityCollection();
    const e = col.add({ id: 'rm1' });
    const listener = vi.fn();
    col.onRemove.addEventListener(listener);
    col.remove(e);
    expect(listener).toHaveBeenCalledWith(e);
  });
});

// ---------------------------------------------------------------------------
// EntityCluster
// ---------------------------------------------------------------------------
describe('EntityCluster', () => {
  it('should have correct default values', () => {
    const cluster = new EntityCluster();
    expect(cluster.enabled).toBe(false);
    expect(cluster.pixelRange).toBe(80);
    expect(cluster.minimumClusterSize).toBe(2);
  });

  it('should accept custom options', () => {
    const cluster = new EntityCluster({
      enabled: true,
      pixelRange: 120,
      minimumClusterSize: 5,
    });
    expect(cluster.enabled).toBe(true);
    expect(cluster.pixelRange).toBe(120);
    expect(cluster.minimumClusterSize).toBe(5);
  });
});
