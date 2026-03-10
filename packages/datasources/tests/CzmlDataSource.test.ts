import { describe, it, expect } from 'vitest';
import { CzmlDataSource } from '../src/CzmlDataSource';
import { ConstantPositionProperty } from '../src/properties/ConstantPositionProperty';
import { SampledPositionProperty } from '../src/properties/SampledPositionProperty';

describe('CzmlDataSource', () => {
  it('name defaults to czml', () => {
    const ds = new CzmlDataSource();
    expect(ds.name).toBe('czml');
  });

  it('isLoading defaults to false', () => {
    const ds = new CzmlDataSource();
    expect(ds.isLoading).toBe(false);
  });

  it('update returns true', () => {
    const ds = new CzmlDataSource();
    expect(ds.update({} as any)).toBe(true);
  });

  it('skips document packet', async () => {
    const ds = await CzmlDataSource.load([
      { id: 'document', version: '1.0' },
    ]);
    expect(ds.entities.length).toBe(0);
  });

  it('skips packet without id', async () => {
    const ds = await CzmlDataSource.load([
      { name: 'noId' },
    ]);
    expect(ds.entities.length).toBe(0);
  });

  it('loads packet with cartographicDegrees static position', async () => {
    const ds = await CzmlDataSource.load([
      { id: 'document', version: '1.0' },
      {
        id: 'point1',
        name: 'Test Point',
        position: {
          cartographicDegrees: [0, 0, 100],
        },
      },
    ]);
    expect(ds.entities.length).toBe(1);
    const entity = ds.entities.getById('point1');
    expect(entity).toBeDefined();
    expect(entity!.name).toBe('Test Point');
    expect(entity!.position).toBeInstanceOf(ConstantPositionProperty);
  });

  it('loads packet with cartesian position', async () => {
    const ds = await CzmlDataSource.load([
      { id: 'document', version: '1.0' },
      {
        id: 'cart1',
        position: {
          cartesian: [1000000, 2000000, 3000000],
        },
      },
    ]);
    const entity = ds.entities.getById('cart1');
    expect(entity).toBeDefined();
    expect(entity!.position).toBeInstanceOf(ConstantPositionProperty);
    const pos = entity!.position.getValue({} as any);
    expect(pos[0]).toBe(1000000);
    expect(pos[1]).toBe(2000000);
    expect(pos[2]).toBe(3000000);
  });

  it('loads packet with time-tagged cartographicDegrees', async () => {
    const ds = await CzmlDataSource.load([
      { id: 'document', version: '1.0' },
      {
        id: 'moving1',
        position: {
          cartographicDegrees: [
            '2020-01-01T00:00:00Z', 0, 0, 0,
            '2020-01-01T01:00:00Z', 10, 10, 1000,
          ],
        },
      },
    ]);
    const entity = ds.entities.getById('moving1');
    expect(entity).toBeDefined();
    expect(entity!.position).toBeInstanceOf(SampledPositionProperty);
  });

  it('loads packet with billboard', async () => {
    const ds = await CzmlDataSource.load([
      { id: 'document', version: '1.0' },
      {
        id: 'bb1',
        billboard: {
          image: 'marker.png',
          scale: 2.0,
        },
      },
    ]);
    const entity = ds.entities.getById('bb1');
    expect(entity).toBeDefined();
    expect(entity!.billboard).toBeDefined();
    expect(entity!.billboard.image).toBe('marker.png');
    expect(entity!.billboard.scale).toBe(2.0);
  });

  it('loads packet with label', async () => {
    const ds = await CzmlDataSource.load([
      { id: 'document', version: '1.0' },
      {
        id: 'lbl1',
        label: {
          text: 'Hello',
          font: '24px Arial',
        },
      },
    ]);
    const entity = ds.entities.getById('lbl1');
    expect(entity).toBeDefined();
    expect(entity!.label).toBeDefined();
    expect(entity!.label.text).toBe('Hello');
    expect(entity!.label.font).toBe('24px Arial');
  });

  it('loads packet with point', async () => {
    const ds = await CzmlDataSource.load([
      { id: 'document', version: '1.0' },
      {
        id: 'pt1',
        point: {
          pixelSize: 16,
          color: { rgba: [255, 0, 0, 255] },
        },
      },
    ]);
    const entity = ds.entities.getById('pt1');
    expect(entity).toBeDefined();
    expect(entity!.point).toBeDefined();
    expect(entity!.point.pixelSize).toBe(16);
    expect(entity!.point.color).toEqual([1, 0, 0, 1]);
  });

  it('loads packet with point without color', async () => {
    const ds = await CzmlDataSource.load([
      { id: 'document', version: '1.0' },
      {
        id: 'pt2',
        point: { pixelSize: 5 },
      },
    ]);
    const entity = ds.entities.getById('pt2');
    expect(entity!.point.pixelSize).toBe(5);
    expect(entity!.point.color).toBeUndefined();
  });

  it('loads packet with polyline', async () => {
    const ds = await CzmlDataSource.load([
      { id: 'document', version: '1.0' },
      {
        id: 'pl1',
        polyline: {
          positions: {
            cartographicDegrees: [0, 0, 0, 10, 10, 0, 20, 20, 0],
          },
          width: 5,
        },
      },
    ]);
    const entity = ds.entities.getById('pl1');
    expect(entity).toBeDefined();
    expect(entity!.polyline).toBeDefined();
    expect(entity!.polyline.width).toBe(5);
    // 3 coordinate tuples -> 9 values in positions array
    expect(entity!.polyline.positions.length).toBe(9);
  });

  it('loads packet with description', async () => {
    const ds = await CzmlDataSource.load([
      { id: 'document', version: '1.0' },
      {
        id: 'desc1',
        description: 'A test entity',
      },
    ]);
    const entity = ds.entities.getById('desc1');
    expect(entity).toBeDefined();
    expect(entity!.description).toBeDefined();
    expect(entity!.description.getValue({} as any)).toBe('A test entity');
  });

  it('loads multiple packets', async () => {
    const ds = await CzmlDataSource.load([
      { id: 'document', version: '1.0' },
      { id: 'a', name: 'A' },
      { id: 'b', name: 'B' },
      { id: 'c', name: 'C' },
    ]);
    expect(ds.entities.length).toBe(3);
  });
});
