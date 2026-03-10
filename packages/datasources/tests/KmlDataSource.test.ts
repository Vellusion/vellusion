import { describe, it, expect } from 'vitest';
import { KmlDataSource } from '../src/KmlDataSource';

describe('KmlDataSource', () => {
  it('name defaults to kml', () => {
    const ds = new KmlDataSource();
    expect(ds.name).toBe('kml');
  });

  it('isLoading defaults to false', () => {
    const ds = new KmlDataSource();
    expect(ds.isLoading).toBe(false);
  });

  it('update returns true', () => {
    const ds = new KmlDataSource();
    expect(ds.update({} as any)).toBe(true);
  });

  it('loads KML with Point placemark', async () => {
    const kml = `
      <kml>
        <Document>
          <Placemark>
            <name>My Point</name>
            <Point>
              <coordinates>-122.0822,37.4220,0</coordinates>
            </Point>
          </Placemark>
        </Document>
      </kml>
    `;
    const ds = await KmlDataSource.load(kml);
    expect(ds.entities.length).toBe(1);
    const entity = ds.entities.values[0];
    expect(entity.name).toBe('My Point');
    expect(entity.position).toBeDefined();
    expect(entity.point).toBeDefined();
    expect(entity.point.pixelSize).toBe(10);
  });

  it('loads KML with LineString placemark', async () => {
    const kml = `
      <kml>
        <Document>
          <Placemark>
            <name>A Line</name>
            <LineString>
              <coordinates>0,0,0 10,10,0 20,0,0</coordinates>
            </LineString>
          </Placemark>
        </Document>
      </kml>
    `;
    const ds = await KmlDataSource.load(kml);
    expect(ds.entities.length).toBe(1);
    const entity = ds.entities.values[0];
    expect(entity.name).toBe('A Line');
    expect(entity.polyline).toBeDefined();
    expect(entity.polyline.width).toBe(2);
    // 3 coordinate tuples -> 9 values
    expect(entity.polyline.positions.length).toBe(9);
  });

  it('loads KML with Polygon placemark', async () => {
    const kml = `
      <kml>
        <Document>
          <Placemark>
            <name>A Polygon</name>
            <Polygon>
              <outerBoundaryIs>
                <LinearRing>
                  <coordinates>0,0,0 1,0,0 1,1,0 0,1,0 0,0,0</coordinates>
                </LinearRing>
              </outerBoundaryIs>
            </Polygon>
          </Placemark>
        </Document>
      </kml>
    `;
    const ds = await KmlDataSource.load(kml);
    expect(ds.entities.length).toBe(1);
    const entity = ds.entities.values[0];
    expect(entity.name).toBe('A Polygon');
    expect(entity.polygon).toBeDefined();
    // 5 coordinate tuples -> 15 values
    expect(entity.polygon.positions.length).toBe(15);
  });

  it('extracts name and description', async () => {
    const kml = `
      <kml>
        <Document>
          <Placemark>
            <name>Named Place</name>
            <description>Some details here</description>
            <Point>
              <coordinates>0,0,0</coordinates>
            </Point>
          </Placemark>
        </Document>
      </kml>
    `;
    const ds = await KmlDataSource.load(kml);
    const entity = ds.entities.values[0];
    expect(entity.name).toBe('Named Place');
    expect(entity.description).toBeDefined();
    expect(entity.description.getValue({} as any)).toBe('Some details here');
  });

  it('loads multiple placemarks', async () => {
    const kml = `
      <kml>
        <Document>
          <Placemark>
            <name>Point A</name>
            <Point><coordinates>0,0,0</coordinates></Point>
          </Placemark>
          <Placemark>
            <name>Point B</name>
            <Point><coordinates>1,1,0</coordinates></Point>
          </Placemark>
          <Placemark>
            <name>Line C</name>
            <LineString><coordinates>0,0,0 5,5,0</coordinates></LineString>
          </Placemark>
        </Document>
      </kml>
    `;
    const ds = await KmlDataSource.load(kml);
    expect(ds.entities.length).toBe(3);
  });

  it('handles placemark without name or description', async () => {
    const kml = `
      <kml>
        <Document>
          <Placemark>
            <Point><coordinates>10,20,0</coordinates></Point>
          </Placemark>
        </Document>
      </kml>
    `;
    const ds = await KmlDataSource.load(kml);
    expect(ds.entities.length).toBe(1);
    const entity = ds.entities.values[0];
    expect(entity.name).toBeUndefined();
    expect(entity.description).toBeUndefined();
  });
});
