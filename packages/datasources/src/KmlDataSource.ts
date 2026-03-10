import { EntityCollection } from './EntityCollection';
import { Entity } from './Entity';
import { ConstantProperty } from './properties/ConstantProperty';
import { ConstantPositionProperty } from './properties/ConstantPositionProperty';
import { PointGraphics } from './graphics/PointGraphics';
import { PolylineGraphics } from './graphics/PolylineGraphics';
import { PolygonGraphics } from './graphics/PolygonGraphics';
import type { DataSource } from './DataSource';
import type { JulianDateType } from '@vellusion/scene';
import { Vec3, Ellipsoid, Cartographic } from '@vellusion/math';

/**
 * A {@link DataSource} that parses KML (Keyhole Markup Language) documents.
 * Extracts Placemark elements containing Point, LineString, and Polygon
 * geometries using a lightweight regex-based parser.
 */
export class KmlDataSource implements DataSource {
  readonly name: string;
  readonly entities: EntityCollection;
  isLoading: boolean = false;

  constructor(name: string = 'kml') {
    this.name = name;
    this.entities = new EntityCollection();
  }

  /**
   * Creates a new KmlDataSource by loading KML from a URL or parsing
   * an inline KML string.
   * @param urlOrData - A URL to fetch, or a raw KML string (detected by leading `<`).
   * @returns A promise that resolves to the loaded KmlDataSource.
   */
  static async load(urlOrData: string): Promise<KmlDataSource> {
    const ds = new KmlDataSource();
    ds.isLoading = true;
    let kmlString: string;
    if (urlOrData.trim().startsWith('<')) {
      kmlString = urlOrData;
    } else {
      const r = await fetch(urlOrData);
      kmlString = await r.text();
    }
    ds._parseKml(kmlString);
    ds.isLoading = false;
    return ds;
  }

  private _parseKml(kml: string): void {
    // Extract all <Placemark> elements
    const placemarkRegex = /<Placemark>([\s\S]*?)<\/Placemark>/g;
    let match;
    while ((match = placemarkRegex.exec(kml)) !== null) {
      this._parsePlacemark(match[1]);
    }
  }

  private _parsePlacemark(xml: string): void {
    const name = this._extractTag(xml, 'name');
    const description = this._extractTag(xml, 'description');

    const entity = new Entity({ name: name ?? undefined });
    if (description) {
      entity.description = new ConstantProperty(description);
    }

    // Point
    const pointCoords = this._extractPointCoords(xml);
    if (pointCoords) {
      const [lon, lat, alt = 0] = pointCoords;
      const cart = Cartographic.fromDegrees(lon, lat, alt);
      const pos = Vec3.zero();
      Ellipsoid.cartographicToCartesian(Ellipsoid.WGS84, cart, pos);
      entity.position = new ConstantPositionProperty(pos);
      entity.point = new PointGraphics({ pixelSize: 10 });
    }

    // LineString
    const lineCoords = this._extractLineCoords(xml, 'LineString');
    if (lineCoords) {
      entity.polyline = new PolylineGraphics({ positions: lineCoords, width: 2 });
    }

    // Polygon
    const polyCoords = this._extractLineCoords(xml, 'Polygon');
    if (polyCoords) {
      entity.polygon = new PolygonGraphics({ positions: polyCoords });
    }

    this.entities.add(entity);
  }

  private _extractTag(xml: string, tag: string): string | null {
    const regex = new RegExp(`<${tag}>(.*?)</${tag}>`, 's');
    const m = regex.exec(xml);
    return m ? m[1].trim() : null;
  }

  private _extractPointCoords(xml: string): number[] | null {
    if (!/<Point>/i.test(xml)) return null;
    const coordsStr = this._extractTag(xml, 'coordinates');
    if (!coordsStr) return null;
    return coordsStr.split(',').map(Number);
  }

  private _extractLineCoords(xml: string, geomType: string): number[] | null {
    if (!new RegExp(`<${geomType}>`, 'i').test(xml)) return null;
    const coordsStr = this._extractTag(xml, 'coordinates');
    if (!coordsStr) return null;
    const tuples = coordsStr.trim().split(/\s+/);
    const result: number[] = [];
    for (let i = 0; i < tuples.length; i++) {
      const [lon, lat, alt = '0'] = tuples[i].split(',');
      const cart = Cartographic.fromDegrees(Number(lon), Number(lat), Number(alt));
      const pos = Vec3.zero();
      Ellipsoid.cartographicToCartesian(Ellipsoid.WGS84, cart, pos);
      result.push(pos[0], pos[1], pos[2]);
    }
    return result;
  }

  update(_time: JulianDateType): boolean {
    return true;
  }
}
