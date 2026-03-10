import { describe, it, expect } from 'vitest';
import { GeoJsonDataSource } from '../src/GeoJsonDataSource';

describe('GeoJsonDataSource', () => {
  it('loads Point feature', async () => {
    const ds = await GeoJsonDataSource.load({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [0, 0] },
      properties: { name: 'Origin' },
    });
    expect(ds.entities.length).toBe(1);
    const entity = ds.entities.values[0];
    expect(entity.point).toBeDefined();
    expect(entity.name).toBe('Origin');
  });

  it('loads LineString feature', async () => {
    const ds = await GeoJsonDataSource.load({
      type: 'Feature',
      geometry: { type: 'LineString', coordinates: [[0, 0], [1, 1], [2, 0]] },
      properties: {},
    });
    expect(ds.entities.length).toBe(1);
    expect(ds.entities.values[0].polyline).toBeDefined();
  });

  it('loads Polygon feature', async () => {
    const ds = await GeoJsonDataSource.load({
      type: 'Feature',
      geometry: { type: 'Polygon', coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]] },
      properties: { name: 'Square' },
    });
    expect(ds.entities.length).toBe(1);
    expect(ds.entities.values[0].polygon).toBeDefined();
  });

  it('loads FeatureCollection', async () => {
    const ds = await GeoJsonDataSource.load({
      type: 'FeatureCollection',
      features: [
        { type: 'Feature', geometry: { type: 'Point', coordinates: [0, 0] }, properties: {} },
        { type: 'Feature', geometry: { type: 'Point', coordinates: [1, 1] }, properties: {} },
        { type: 'Feature', geometry: { type: 'LineString', coordinates: [[0, 0], [1, 1]] }, properties: {} },
      ],
    });
    expect(ds.entities.length).toBe(3);
  });

  it('loads MultiPoint', async () => {
    const ds = await GeoJsonDataSource.load({
      type: 'Feature',
      geometry: { type: 'MultiPoint', coordinates: [[0, 0], [1, 1], [2, 2]] },
      properties: {},
    });
    expect(ds.entities.length).toBe(3);
  });

  it('stores feature properties as description', async () => {
    const ds = await GeoJsonDataSource.load({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [0, 0] },
      properties: { population: 1000, city: 'Test' },
    });
    const desc = ds.entities.values[0].description;
    expect(desc).toBeDefined();
  });

  it('name defaults to geojson', () => {
    const ds = new GeoJsonDataSource();
    expect(ds.name).toBe('geojson');
  });

  it('isLoading defaults to false', () => {
    const ds = new GeoJsonDataSource();
    expect(ds.isLoading).toBe(false);
  });

  it('update returns true', () => {
    const ds = new GeoJsonDataSource();
    expect(ds.update({} as any)).toBe(true);
  });

  it('loads MultiPolygon', async () => {
    const ds = await GeoJsonDataSource.load({
      type: 'Feature',
      geometry: {
        type: 'MultiPolygon',
        coordinates: [
          [[[0, 0], [1, 0], [1, 1], [0, 0]]],
          [[[2, 2], [3, 2], [3, 3], [2, 2]]],
        ],
      },
      properties: {},
    });
    expect(ds.entities.length).toBe(2);
  });

  it('loads GeometryCollection', async () => {
    const ds = await GeoJsonDataSource.load({
      type: 'Feature',
      geometry: {
        type: 'GeometryCollection',
        geometries: [
          { type: 'Point', coordinates: [0, 0] },
          { type: 'LineString', coordinates: [[0, 0], [1, 1]] },
        ],
      },
      properties: {},
    });
    expect(ds.entities.length).toBe(2);
  });
});
