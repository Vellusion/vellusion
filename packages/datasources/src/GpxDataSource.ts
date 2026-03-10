import { EntityCollection } from './EntityCollection';
import { Entity } from './Entity';
import { ConstantPositionProperty } from './properties/ConstantPositionProperty';
import { PointGraphics } from './graphics/PointGraphics';
import { PolylineGraphics } from './graphics/PolylineGraphics';
import type { DataSource } from './DataSource';
import type { JulianDateType } from '@vellusion/scene';
import { Vec3, Ellipsoid, Cartographic } from '@vellusion/math';

/**
 * A {@link DataSource} that parses GPX (GPS Exchange Format) documents.
 * Extracts waypoints (`<wpt>`), tracks (`<trk>` with `<trkseg>` / `<trkpt>`),
 * and routes (`<rte>` with `<rtept>`) using a lightweight regex-based parser.
 */
export class GpxDataSource implements DataSource {
  readonly name: string;
  readonly entities: EntityCollection;
  isLoading: boolean = false;

  constructor(name: string = 'gpx') {
    this.name = name;
    this.entities = new EntityCollection();
  }

  /**
   * Creates a new GpxDataSource by loading GPX from a URL or parsing
   * an inline GPX string.
   * @param urlOrData - A URL to fetch, or a raw GPX string (detected by leading `<`).
   * @returns A promise that resolves to the loaded GpxDataSource.
   */
  static async load(urlOrData: string): Promise<GpxDataSource> {
    const ds = new GpxDataSource();
    ds.isLoading = true;
    let gpxString: string;
    if (urlOrData.trim().startsWith('<')) {
      gpxString = urlOrData;
    } else {
      const r = await fetch(urlOrData);
      gpxString = await r.text();
    }
    ds._parseGpx(gpxString);
    ds.isLoading = false;
    return ds;
  }

  private _parseGpx(gpx: string): void {
    // Parse waypoints <wpt lat="..." lon="...">
    const wptRegex = /<wpt\s+lat="([^"]+)"\s+lon="([^"]+)">([\s\S]*?)<\/wpt>/g;
    let m;
    while ((m = wptRegex.exec(gpx)) !== null) {
      const lat = Number(m[1]);
      const lon = Number(m[2]);
      const name = this._extractTag(m[3], 'name');
      const ele = this._extractTag(m[3], 'ele');
      const cart = Cartographic.fromDegrees(lon, lat, ele ? Number(ele) : 0);
      const pos = Vec3.zero();
      Ellipsoid.cartographicToCartesian(Ellipsoid.WGS84, cart, pos);

      const entity = new Entity({ name: name ?? undefined });
      entity.position = new ConstantPositionProperty(pos);
      entity.point = new PointGraphics({ pixelSize: 8 });
      this.entities.add(entity);
    }

    // Parse tracks <trk> containing <trkseg> with <trkpt>
    const trkRegex = /<trk>([\s\S]*?)<\/trk>/g;
    while ((m = trkRegex.exec(gpx)) !== null) {
      const name = this._extractTag(m[1], 'name');
      const trkpts = this._parseTrkpts(m[1]);
      if (trkpts) {
        const entity = new Entity({ name: name ?? undefined });
        entity.polyline = new PolylineGraphics({ positions: trkpts, width: 3 });
        this.entities.add(entity);
      }
    }

    // Parse routes <rte> with <rtept>
    const rteRegex = /<rte>([\s\S]*?)<\/rte>/g;
    while ((m = rteRegex.exec(gpx)) !== null) {
      const name = this._extractTag(m[1], 'name');
      const rtepts = this._parseRtepts(m[1]);
      if (rtepts) {
        const entity = new Entity({ name: name ?? undefined });
        entity.polyline = new PolylineGraphics({ positions: rtepts, width: 3 });
        this.entities.add(entity);
      }
    }
  }

  private _parseTrkpts(xml: string): number[] | null {
    const ptRegex = /<trkpt\s+lat="([^"]+)"\s+lon="([^"]+)">([\s\S]*?)<\/trkpt>/g;
    const points: number[] = [];
    let m;
    while ((m = ptRegex.exec(xml)) !== null) {
      const lat = Number(m[1]);
      const lon = Number(m[2]);
      const ele = this._extractTag(m[3], 'ele');
      const cart = Cartographic.fromDegrees(lon, lat, ele ? Number(ele) : 0);
      const pos = Vec3.zero();
      Ellipsoid.cartographicToCartesian(Ellipsoid.WGS84, cart, pos);
      points.push(pos[0], pos[1], pos[2]);
    }
    if (points.length === 0) return null;
    return points;
  }

  private _parseRtepts(xml: string): number[] | null {
    const ptRegex = /<rtept\s+lat="([^"]+)"\s+lon="([^"]+)">([\s\S]*?)<\/rtept>/g;
    const points: number[] = [];
    let m;
    while ((m = ptRegex.exec(xml)) !== null) {
      const lat = Number(m[1]);
      const lon = Number(m[2]);
      const ele = this._extractTag(m[3], 'ele');
      const cart = Cartographic.fromDegrees(lon, lat, ele ? Number(ele) : 0);
      const pos = Vec3.zero();
      Ellipsoid.cartographicToCartesian(Ellipsoid.WGS84, cart, pos);
      points.push(pos[0], pos[1], pos[2]);
    }
    if (points.length === 0) return null;
    return points;
  }

  private _extractTag(xml: string, tag: string): string | null {
    const regex = new RegExp(`<${tag}>(.*?)</${tag}>`, 's');
    const m = regex.exec(xml);
    return m ? m[1].trim() : null;
  }

  update(_time: JulianDateType): boolean {
    return true;
  }
}
