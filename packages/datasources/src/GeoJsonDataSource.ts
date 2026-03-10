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

export interface GeoJsonDataSourceOptions {
  markerSize?: number;
  markerColor?: [number, number, number, number];
  stroke?: [number, number, number, number];
  strokeWidth?: number;
  fill?: [number, number, number, number];
}

export class GeoJsonDataSource implements DataSource {
  readonly name: string;
  readonly entities: EntityCollection;
  isLoading: boolean = false;

  constructor(name: string = 'geojson') {
    this.name = name;
    this.entities = new EntityCollection();
  }

  static async load(
    urlOrData: string | object,
    options?: GeoJsonDataSourceOptions,
  ): Promise<GeoJsonDataSource> {
    const ds = new GeoJsonDataSource('geojson');

    let data: any;
    if (typeof urlOrData === 'string') {
      const response = await fetch(urlOrData);
      data = await response.json();
    } else {
      data = urlOrData;
    }

    ds._processGeoJson(data, options ?? {});
    return ds;
  }

  private _processGeoJson(data: any, options: GeoJsonDataSourceOptions): void {
    if (data.type === 'FeatureCollection') {
      for (const feature of data.features) {
        this._processFeature(feature, options);
      }
    } else if (data.type === 'Feature') {
      this._processFeature(data, options);
    } else {
      // Raw geometry
      this._processGeometry(data, undefined, options);
    }
  }

  private _processFeature(feature: any, options: GeoJsonDataSourceOptions): void {
    const properties = feature.properties ?? {};
    this._processGeometry(feature.geometry, properties, options);
  }

  private _processGeometry(
    geometry: any,
    properties: Record<string, any> | undefined,
    options: GeoJsonDataSourceOptions,
  ): void {
    if (!geometry) return;

    switch (geometry.type) {
      case 'Point':
        this._processPoint(geometry.coordinates, properties, options);
        break;
      case 'MultiPoint':
        for (const coords of geometry.coordinates) {
          this._processPoint(coords, properties, options);
        }
        break;
      case 'LineString':
        this._processLineString(geometry.coordinates, properties, options);
        break;
      case 'MultiLineString':
        for (const coords of geometry.coordinates) {
          this._processLineString(coords, properties, options);
        }
        break;
      case 'Polygon':
        this._processPolygon(geometry.coordinates, properties, options);
        break;
      case 'MultiPolygon':
        for (const coords of geometry.coordinates) {
          this._processPolygon(coords, properties, options);
        }
        break;
      case 'GeometryCollection':
        for (const geom of geometry.geometries) {
          this._processGeometry(geom, properties, options);
        }
        break;
    }
  }

  private _processPoint(
    coordinates: number[],
    properties: Record<string, any> | undefined,
    options: GeoJsonDataSourceOptions,
  ): void {
    const [lon, lat, alt = 0] = coordinates;
    const cartographic = Cartographic.fromDegrees(lon, lat, alt);
    const position = Vec3.zero();
    Ellipsoid.cartographicToCartesian(Ellipsoid.WGS84, cartographic, position);

    const entity = new Entity({
      name: properties?.name ?? properties?.title,
      position: new ConstantPositionProperty(position),
      point: new PointGraphics({
        pixelSize: options.markerSize ?? 10,
        color: options.markerColor ?? [1, 0, 0, 1],
      }),
    });

    if (properties) {
      entity.description = new ConstantProperty(JSON.stringify(properties));
    }

    this.entities.add(entity);
  }

  private _processLineString(
    coordinates: number[][],
    properties: Record<string, any> | undefined,
    options: GeoJsonDataSourceOptions,
  ): void {
    const positions: number[] = [];
    for (let i = 0; i < coordinates.length; i++) {
      const [lon, lat, alt = 0] = coordinates[i];
      const cartographic = Cartographic.fromDegrees(lon, lat, alt);
      const pos = Vec3.zero();
      Ellipsoid.cartographicToCartesian(Ellipsoid.WGS84, cartographic, pos);
      positions.push(pos[0], pos[1], pos[2]);
    }

    const entity = new Entity({
      name: properties?.name ?? properties?.title,
      polyline: new PolylineGraphics({
        positions,
        width: options.strokeWidth ?? 2,
        color: options.stroke ?? [0, 0, 1, 1],
      }),
    });

    if (properties) {
      entity.description = new ConstantProperty(JSON.stringify(properties));
    }

    this.entities.add(entity);
  }

  private _processPolygon(
    coordinates: number[][][],
    properties: Record<string, any> | undefined,
    options: GeoJsonDataSourceOptions,
  ): void {
    // First ring is exterior
    const exterior = coordinates[0];
    const positions: number[] = [];
    for (let i = 0; i < exterior.length; i++) {
      const [lon, lat, alt = 0] = exterior[i];
      const cartographic = Cartographic.fromDegrees(lon, lat, alt);
      const pos = Vec3.zero();
      Ellipsoid.cartographicToCartesian(Ellipsoid.WGS84, cartographic, pos);
      positions.push(pos[0], pos[1], pos[2]);
    }

    const entity = new Entity({
      name: properties?.name ?? properties?.title,
      polygon: new PolygonGraphics({
        positions,
        color: options.fill ?? [0, 1, 0, 0.5],
      }),
    });

    if (properties) {
      entity.description = new ConstantProperty(JSON.stringify(properties));
    }

    this.entities.add(entity);
  }

  update(_time: JulianDateType): boolean {
    return true;
  }
}
