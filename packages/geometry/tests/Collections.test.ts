import { describe, it, expect } from 'vitest';
import { Vec3 } from '@vellusion/math';
import { BillboardCollection } from '../src/BillboardCollection';
import { LabelCollection } from '../src/LabelCollection';
import { PointPrimitiveCollection } from '../src/PointPrimitiveCollection';
import { PolylineCollection } from '../src/PolylineCollection';

// ---------------------------------------------------------------------------
// BillboardCollection
// ---------------------------------------------------------------------------

describe('BillboardCollection', () => {
  it('should add a billboard and return it with defaults', () => {
    const col = new BillboardCollection();
    const b = col.add({ position: Vec3.create(1, 2, 3) });
    expect(b.width).toBe(32);
    expect(b.height).toBe(32);
    expect(b.scale).toBe(1.0);
    expect(b.rotation).toBe(0);
    expect(b.show).toBe(true);
  });

  it('should set position on added billboard', () => {
    const col = new BillboardCollection();
    const pos = Vec3.create(10, 20, 30);
    const b = col.add({ position: pos });
    expect(b.position[0]).toBe(10);
    expect(b.position[1]).toBe(20);
    expect(b.position[2]).toBe(30);
  });

  it('should remove existing billboard and return true', () => {
    const col = new BillboardCollection();
    const b = col.add({ position: Vec3.create(0, 0, 0) });
    expect(col.remove(b)).toBe(true);
    expect(col.length).toBe(0);
  });

  it('should return false when removing a billboard not in the collection', () => {
    const col = new BillboardCollection();
    const b = col.add({ position: Vec3.create(0, 0, 0) });
    col.remove(b);
    expect(col.remove(b)).toBe(false);
  });

  it('should get billboard by index', () => {
    const col = new BillboardCollection();
    const b0 = col.add({ position: Vec3.create(1, 0, 0) });
    const b1 = col.add({ position: Vec3.create(2, 0, 0) });
    expect(col.get(0)).toBe(b0);
    expect(col.get(1)).toBe(b1);
  });

  it('should track length correctly', () => {
    const col = new BillboardCollection();
    expect(col.length).toBe(0);
    col.add({ position: Vec3.create(0, 0, 0) });
    expect(col.length).toBe(1);
    col.add({ position: Vec3.create(1, 0, 0) });
    expect(col.length).toBe(2);
  });

  it('should clear all billboards on removeAll', () => {
    const col = new BillboardCollection();
    col.add({ position: Vec3.create(0, 0, 0) });
    col.add({ position: Vec3.create(1, 0, 0) });
    col.removeAll();
    expect(col.length).toBe(0);
  });

  it('should set dirty flag on mutation', () => {
    const col = new BillboardCollection();
    expect(col.dirty).toBe(false);
    col.add({ position: Vec3.create(0, 0, 0) });
    expect(col.dirty).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// LabelCollection
// ---------------------------------------------------------------------------

describe('LabelCollection', () => {
  it('should add a label with text and position', () => {
    const col = new LabelCollection();
    const label = col.add({ position: Vec3.create(1, 2, 3), text: 'Hello' });
    expect(label.text).toBe('Hello');
    expect(label.position[0]).toBe(1);
  });

  it('should apply default font, horizontalOrigin, and verticalOrigin', () => {
    const col = new LabelCollection();
    const label = col.add({ position: Vec3.create(0, 0, 0), text: 'Test' });
    expect(label.font).toBe('14px sans-serif');
    expect(label.horizontalOrigin).toBe('center');
    expect(label.verticalOrigin).toBe('center');
  });

  it('should apply default scale and show', () => {
    const col = new LabelCollection();
    const label = col.add({ position: Vec3.create(0, 0, 0), text: 'A' });
    expect(label.scale).toBe(1.0);
    expect(label.show).toBe(true);
  });

  it('should remove existing label and return true', () => {
    const col = new LabelCollection();
    const label = col.add({ position: Vec3.create(0, 0, 0), text: 'A' });
    expect(col.remove(label)).toBe(true);
    expect(col.length).toBe(0);
  });

  it('should get label by index', () => {
    const col = new LabelCollection();
    const l0 = col.add({ position: Vec3.create(0, 0, 0), text: 'A' });
    const l1 = col.add({ position: Vec3.create(1, 0, 0), text: 'B' });
    expect(col.get(0)).toBe(l0);
    expect(col.get(1)).toBe(l1);
  });

  it('should track length correctly', () => {
    const col = new LabelCollection();
    expect(col.length).toBe(0);
    col.add({ position: Vec3.create(0, 0, 0), text: 'A' });
    expect(col.length).toBe(1);
  });

  it('should clear all labels on removeAll', () => {
    const col = new LabelCollection();
    col.add({ position: Vec3.create(0, 0, 0), text: 'A' });
    col.add({ position: Vec3.create(1, 0, 0), text: 'B' });
    col.removeAll();
    expect(col.length).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// PointPrimitiveCollection
// ---------------------------------------------------------------------------

describe('PointPrimitiveCollection', () => {
  it('should add a point with position', () => {
    const col = new PointPrimitiveCollection();
    const p = col.add({ position: Vec3.create(5, 6, 7) });
    expect(p.position[0]).toBe(5);
    expect(p.position[1]).toBe(6);
    expect(p.position[2]).toBe(7);
  });

  it('should apply default pixelSize of 4', () => {
    const col = new PointPrimitiveCollection();
    const p = col.add({ position: Vec3.create(0, 0, 0) });
    expect(p.pixelSize).toBe(4);
  });

  it('should apply default show and outlineWidth', () => {
    const col = new PointPrimitiveCollection();
    const p = col.add({ position: Vec3.create(0, 0, 0) });
    expect(p.show).toBe(true);
    expect(p.outlineWidth).toBe(0);
  });

  it('should remove existing point and return true', () => {
    const col = new PointPrimitiveCollection();
    const p = col.add({ position: Vec3.create(0, 0, 0) });
    expect(col.remove(p)).toBe(true);
    expect(col.length).toBe(0);
  });

  it('should return false when removing a point not in the collection', () => {
    const col = new PointPrimitiveCollection();
    const p = col.add({ position: Vec3.create(0, 0, 0) });
    col.remove(p);
    expect(col.remove(p)).toBe(false);
  });

  it('should get point by index', () => {
    const col = new PointPrimitiveCollection();
    const p0 = col.add({ position: Vec3.create(1, 0, 0) });
    const p1 = col.add({ position: Vec3.create(2, 0, 0) });
    expect(col.get(0)).toBe(p0);
    expect(col.get(1)).toBe(p1);
  });

  it('should track length correctly', () => {
    const col = new PointPrimitiveCollection();
    expect(col.length).toBe(0);
    col.add({ position: Vec3.create(0, 0, 0) });
    expect(col.length).toBe(1);
    col.add({ position: Vec3.create(1, 0, 0) });
    expect(col.length).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// PolylineCollection
// ---------------------------------------------------------------------------

describe('PolylineCollection', () => {
  it('should add a polyline with positions array', () => {
    const col = new PolylineCollection();
    const positions = [Vec3.create(0, 0, 0), Vec3.create(1, 1, 1)];
    const pl = col.add({ positions });
    expect(pl.positions.length).toBe(2);
    expect(pl.positions[0][0]).toBe(0);
    expect(pl.positions[1][0]).toBe(1);
  });

  it('should apply default width of 1', () => {
    const col = new PolylineCollection();
    const pl = col.add({ positions: [Vec3.create(0, 0, 0)] });
    expect(pl.width).toBe(1.0);
  });

  it('should apply default show as true', () => {
    const col = new PolylineCollection();
    const pl = col.add({ positions: [Vec3.create(0, 0, 0)] });
    expect(pl.show).toBe(true);
  });

  it('should remove existing polyline and return true', () => {
    const col = new PolylineCollection();
    const pl = col.add({ positions: [Vec3.create(0, 0, 0)] });
    expect(col.remove(pl)).toBe(true);
    expect(col.length).toBe(0);
  });

  it('should return false when removing a polyline not in the collection', () => {
    const col = new PolylineCollection();
    const pl = col.add({ positions: [Vec3.create(0, 0, 0)] });
    col.remove(pl);
    expect(col.remove(pl)).toBe(false);
  });

  it('should get polyline by index', () => {
    const col = new PolylineCollection();
    const pl0 = col.add({ positions: [Vec3.create(0, 0, 0)] });
    const pl1 = col.add({ positions: [Vec3.create(1, 1, 1)] });
    expect(col.get(0)).toBe(pl0);
    expect(col.get(1)).toBe(pl1);
  });

  it('should track length correctly', () => {
    const col = new PolylineCollection();
    expect(col.length).toBe(0);
    col.add({ positions: [Vec3.create(0, 0, 0)] });
    expect(col.length).toBe(1);
  });
});
