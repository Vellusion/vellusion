import { Ellipsoid, type EllipsoidType } from '@vellusion/math';
import { QuadtreePrimitive } from './QuadtreePrimitive';
import { EllipsoidTerrainProvider } from './TerrainProvider';
import { ImageryLayerCollection } from './ImageryLayerCollection';
import type { TerrainProvider } from './TerrainProvider';

export interface GlobeOptions {
  terrainProvider?: TerrainProvider;
  ellipsoid?: EllipsoidType;
  show?: boolean;
  depthTestAgainstTerrain?: boolean;
}

export class Globe {
  readonly terrainProvider: TerrainProvider;
  readonly imageryLayers: ImageryLayerCollection;
  readonly ellipsoid: EllipsoidType;
  readonly quadtree: QuadtreePrimitive;
  show: boolean;
  depthTestAgainstTerrain: boolean;

  constructor(options?: GlobeOptions) {
    this.ellipsoid = options?.ellipsoid ?? Ellipsoid.WGS84;
    this.terrainProvider = options?.terrainProvider ?? new EllipsoidTerrainProvider(this.ellipsoid);
    this.imageryLayers = new ImageryLayerCollection();
    this.quadtree = new QuadtreePrimitive({
      terrainProvider: this.terrainProvider,
    });
    this.show = options?.show ?? true;
    this.depthTestAgainstTerrain = options?.depthTestAgainstTerrain ?? false;
  }
}
