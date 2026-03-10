import { describe, it, expect } from 'vitest';
import { GpxDataSource } from '../src/GpxDataSource';

describe('GpxDataSource', () => {
  it('name defaults to gpx', () => {
    const ds = new GpxDataSource();
    expect(ds.name).toBe('gpx');
  });

  it('isLoading defaults to false', () => {
    const ds = new GpxDataSource();
    expect(ds.isLoading).toBe(false);
  });

  it('update returns true', () => {
    const ds = new GpxDataSource();
    expect(ds.update({} as any)).toBe(true);
  });

  it('loads GPX with waypoints', async () => {
    const gpx = `
      <gpx>
        <wpt lat="47.6062" lon="-122.3321">
          <name>Seattle</name>
          <ele>56</ele>
        </wpt>
        <wpt lat="45.5152" lon="-122.6784">
          <name>Portland</name>
          <ele>15</ele>
        </wpt>
      </gpx>
    `;
    const ds = await GpxDataSource.load(gpx);
    expect(ds.entities.length).toBe(2);
    const seattle = ds.entities.values[0];
    expect(seattle.name).toBe('Seattle');
    expect(seattle.position).toBeDefined();
    expect(seattle.point).toBeDefined();
    expect(seattle.point.pixelSize).toBe(8);
    const portland = ds.entities.values[1];
    expect(portland.name).toBe('Portland');
  });

  it('extracts waypoint name and elevation', async () => {
    const gpx = `
      <gpx>
        <wpt lat="27.9881" lon="86.9250">
          <name>Everest</name>
          <ele>8848</ele>
        </wpt>
      </gpx>
    `;
    const ds = await GpxDataSource.load(gpx);
    expect(ds.entities.length).toBe(1);
    const entity = ds.entities.values[0];
    expect(entity.name).toBe('Everest');
    // Position should be defined and represent a cartesian coordinate
    const pos = entity.position.getValue({} as any);
    expect(pos).toBeDefined();
    // Magnitude should be roughly Earth's radius + 8848m
    const magnitude = Math.sqrt(pos[0] * pos[0] + pos[1] * pos[1] + pos[2] * pos[2]);
    expect(magnitude).toBeGreaterThan(6370000);
  });

  it('loads GPX with track', async () => {
    const gpx = `
      <gpx>
        <trk>
          <name>Morning Run</name>
          <trkseg>
            <trkpt lat="47.6062" lon="-122.3321">
              <ele>10</ele>
            </trkpt>
            <trkpt lat="47.6072" lon="-122.3331">
              <ele>12</ele>
            </trkpt>
            <trkpt lat="47.6082" lon="-122.3341">
              <ele>14</ele>
            </trkpt>
          </trkseg>
        </trk>
      </gpx>
    `;
    const ds = await GpxDataSource.load(gpx);
    expect(ds.entities.length).toBe(1);
    const entity = ds.entities.values[0];
    expect(entity.name).toBe('Morning Run');
    expect(entity.polyline).toBeDefined();
    expect(entity.polyline.width).toBe(3);
    // 3 track points -> 9 values
    expect(entity.polyline.positions.length).toBe(9);
  });

  it('loads GPX with route', async () => {
    const gpx = `
      <gpx>
        <rte>
          <name>Bike Route</name>
          <rtept lat="48.8566" lon="2.3522">
            <ele>35</ele>
          </rtept>
          <rtept lat="48.8606" lon="2.3376">
            <ele>33</ele>
          </rtept>
        </rte>
      </gpx>
    `;
    const ds = await GpxDataSource.load(gpx);
    expect(ds.entities.length).toBe(1);
    const entity = ds.entities.values[0];
    expect(entity.name).toBe('Bike Route');
    expect(entity.polyline).toBeDefined();
    expect(entity.polyline.width).toBe(3);
    // 2 route points -> 6 values
    expect(entity.polyline.positions.length).toBe(6);
  });

  it('loads GPX with mixed content', async () => {
    const gpx = `
      <gpx>
        <wpt lat="47.6062" lon="-122.3321">
          <name>Start</name>
          <ele>10</ele>
        </wpt>
        <trk>
          <name>Trail</name>
          <trkseg>
            <trkpt lat="47.6062" lon="-122.3321">
              <ele>10</ele>
            </trkpt>
            <trkpt lat="47.6072" lon="-122.3331">
              <ele>15</ele>
            </trkpt>
          </trkseg>
        </trk>
        <rte>
          <name>Return</name>
          <rtept lat="47.6072" lon="-122.3331">
            <ele>15</ele>
          </rtept>
          <rtept lat="47.6062" lon="-122.3321">
            <ele>10</ele>
          </rtept>
        </rte>
      </gpx>
    `;
    const ds = await GpxDataSource.load(gpx);
    // 1 waypoint + 1 track + 1 route = 3 entities
    expect(ds.entities.length).toBe(3);
  });

  it('handles waypoint without name', async () => {
    const gpx = `
      <gpx>
        <wpt lat="0" lon="0">
          <ele>0</ele>
        </wpt>
      </gpx>
    `;
    const ds = await GpxDataSource.load(gpx);
    expect(ds.entities.length).toBe(1);
    expect(ds.entities.values[0].name).toBeUndefined();
  });
});
