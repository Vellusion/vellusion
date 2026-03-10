import { EntityCollection } from './EntityCollection';
import { Entity } from './Entity';
import { ConstantProperty } from './properties/ConstantProperty';
import { ConstantPositionProperty } from './properties/ConstantPositionProperty';
import { SampledPositionProperty } from './properties/SampledPositionProperty';
import { PointGraphics } from './graphics/PointGraphics';
import { PolylineGraphics } from './graphics/PolylineGraphics';
import { BillboardGraphics } from './graphics/BillboardGraphics';
import { LabelGraphics } from './graphics/LabelGraphics';
import type { DataSource } from './DataSource';
import type { JulianDateType } from '@vellusion/scene';
import { JulianDate } from '@vellusion/scene';
import { Vec3, Vec4, Ellipsoid, Cartographic } from '@vellusion/math';

/**
 * A {@link DataSource} that parses CZML (a JSON-based format for describing
 * time-dynamic 3D scenes). Each CZML document is a JSON array of "packets",
 * where each packet has an `id` and optional properties for position,
 * graphics, and other data.
 */
export class CzmlDataSource implements DataSource {
  readonly name: string;
  readonly entities: EntityCollection;
  isLoading: boolean = false;

  constructor(name: string = 'czml') {
    this.name = name;
    this.entities = new EntityCollection();
  }

  /**
   * Creates a new CzmlDataSource by loading CZML from a URL or parsing
   * an already-fetched CZML packet array.
   * @param urlOrData - A URL string to fetch, or an array of CZML packets.
   * @returns A promise that resolves to the loaded CzmlDataSource.
   */
  static async load(urlOrData: string | any[]): Promise<CzmlDataSource> {
    const ds = new CzmlDataSource();
    ds.isLoading = true;
    let data: any[];
    if (typeof urlOrData === 'string') {
      const r = await fetch(urlOrData);
      data = await r.json();
    } else {
      data = urlOrData;
    }
    ds._process(data);
    ds.isLoading = false;
    return ds;
  }

  private _process(packets: any[]): void {
    for (const packet of packets) {
      // Skip document packet (id === 'document') and packets without an id
      if (packet.id === 'document' || !packet.id) continue;
      this._processPacket(packet);
    }
  }

  private _processPacket(packet: any): void {
    const entity = new Entity({ id: packet.id, name: packet.name });

    // Description
    if (packet.description) {
      const desc = typeof packet.description === 'string'
        ? packet.description
        : packet.description.string ?? '';
      entity.description = new ConstantProperty(desc);
    }

    // Position - can be cartographicDegrees [lon, lat, alt] or cartesian [x, y, z]
    if (packet.position) {
      this._processPosition(packet.position, entity);
    }

    // Billboard
    if (packet.billboard) {
      entity.billboard = new BillboardGraphics({
        image: packet.billboard.image,
        scale: packet.billboard.scale,
      });
    }

    // Label
    if (packet.label) {
      entity.label = new LabelGraphics({
        text: packet.label.text,
        font: packet.label.font,
      });
    }

    // Point
    if (packet.point) {
      entity.point = new PointGraphics({
        pixelSize: packet.point.pixelSize ?? 10,
        color: packet.point.color?.rgba
          ? [
              packet.point.color.rgba[0] / 255,
              packet.point.color.rgba[1] / 255,
              packet.point.color.rgba[2] / 255,
              packet.point.color.rgba[3] / 255,
            ] as [number, number, number, number]
          : undefined,
      });
    }

    // Polyline
    if (packet.polyline) {
      this._processPolyline(packet.polyline, entity);
    }

    this.entities.add(entity);
  }

  private _processPosition(pos: any, entity: Entity): void {
    if (pos.cartographicDegrees) {
      const coords = pos.cartographicDegrees;
      if (typeof coords[0] === 'number' && coords.length === 3) {
        // Static: [lon, lat, alt]
        const cart = Cartographic.fromDegrees(coords[0], coords[1], coords[2]);
        const xyz = Vec3.zero();
        Ellipsoid.cartographicToCartesian(Ellipsoid.WGS84, cart, xyz);
        entity.position = new ConstantPositionProperty(xyz);
      } else if (coords.length > 3) {
        // Time-tagged: [time, lon, lat, alt, time, lon, lat, alt, ...]
        const sampled = new SampledPositionProperty();
        for (let i = 0; i < coords.length; i += 4) {
          const time = typeof coords[i] === 'string'
            ? JulianDate.fromIso8601(coords[i])
            : JulianDate.fromSeconds(coords[i]);
          const cart = Cartographic.fromDegrees(coords[i + 1], coords[i + 2], coords[i + 3]);
          const xyz = Vec3.zero();
          Ellipsoid.cartographicToCartesian(Ellipsoid.WGS84, cart, xyz);
          sampled.addSample(time, xyz);
        }
        entity.position = sampled;
      }
    } else if (pos.cartesian) {
      const c = pos.cartesian;
      entity.position = new ConstantPositionProperty(Vec3.create(c[0], c[1], c[2]));
    }
  }

  private _processPolyline(polyline: any, entity: Entity): void {
    const posData = polyline.positions?.cartographicDegrees;
    if (posData) {
      const positions: number[] = [];
      for (let i = 0; i < posData.length; i += 3) {
        const cart = Cartographic.fromDegrees(posData[i], posData[i + 1], posData[i + 2] ?? 0);
        const xyz = Vec3.zero();
        Ellipsoid.cartographicToCartesian(Ellipsoid.WGS84, cart, xyz);
        positions.push(xyz[0], xyz[1], xyz[2]);
      }
      entity.polyline = new PolylineGraphics({
        positions,
        width: polyline.width ?? 2,
      });
    }
  }

  update(_time: JulianDateType): boolean {
    return true;
  }
}
