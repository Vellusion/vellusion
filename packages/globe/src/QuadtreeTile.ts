import { BoundingSphere, type BoundingSphereType, Vec3, type Vec3Type, Ellipsoid, Cartographic } from '@vellusion/math';
import type { GeographicExtent, TileMeshData } from './TileMesh';

export enum TileState {
  START = 0,
  LOADING = 1,
  READY = 2,
  FAILED = 3,
}

export class QuadtreeTile {
  readonly x: number;
  readonly y: number;
  readonly level: number;
  readonly extent: GeographicExtent;

  parent: QuadtreeTile | null = null;
  children: QuadtreeTile[] = [];

  state: TileState = TileState.START;
  mesh: TileMeshData | null = null;

  boundingSphere: BoundingSphereType;
  geometricError: number;

  lastUsedFrameNumber: number = 0;

  constructor(x: number, y: number, level: number, extent: GeographicExtent) {
    this.x = x;
    this.y = y;
    this.level = level;
    this.extent = extent;
    this.boundingSphere = this._computeBoundingSphere();
    this.geometricError = this._computeGeometricError();
  }

  static computeExtent(x: number, y: number, level: number): GeographicExtent {
    // Geographic tiling scheme: level 0 has 2 tiles in X, 1 in Y
    const tilesX = 2 << level;  // 2 * 2^level
    const tilesY = 1 << level;  // 2^level

    const tileWidth = (2 * Math.PI) / tilesX;
    const tileHeight = Math.PI / tilesY;

    return {
      west: -Math.PI + x * tileWidth,
      south: -Math.PI / 2 + y * tileHeight,
      east: -Math.PI + (x + 1) * tileWidth,
      north: -Math.PI / 2 + (y + 1) * tileHeight,
    };
  }

  static createRootTiles(): QuadtreeTile[] {
    // Level 0: 2 tiles covering globe
    return [
      new QuadtreeTile(0, 0, 0, QuadtreeTile.computeExtent(0, 0, 0)),
      new QuadtreeTile(1, 0, 0, QuadtreeTile.computeExtent(1, 0, 0)),
    ];
  }

  subdivide(): QuadtreeTile[] {
    if (this.children.length > 0) return this.children;

    const childLevel = this.level + 1;
    const cx = this.x * 2;
    const cy = this.y * 2;

    this.children = [
      new QuadtreeTile(cx,     cy,     childLevel, QuadtreeTile.computeExtent(cx,     cy,     childLevel)),
      new QuadtreeTile(cx + 1, cy,     childLevel, QuadtreeTile.computeExtent(cx + 1, cy,     childLevel)),
      new QuadtreeTile(cx,     cy + 1, childLevel, QuadtreeTile.computeExtent(cx,     cy + 1, childLevel)),
      new QuadtreeTile(cx + 1, cy + 1, childLevel, QuadtreeTile.computeExtent(cx + 1, cy + 1, childLevel)),
    ];

    for (const child of this.children) {
      child.parent = this;
    }

    return this.children;
  }

  needsRefinement(
    cameraPosition: Vec3Type,
    sseDenominator: number,
    maxScreenSpaceError: number = 2.0,
  ): boolean {
    const distance = Math.max(
      Vec3.distance(cameraPosition, this.boundingSphere.center) - this.boundingSphere.radius,
      0.001,
    );
    const sse = this.geometricError / distance * sseDenominator;
    return sse > maxScreenSpaceError;
  }

  get tileKey(): string {
    return `${this.level}/${this.x}/${this.y}`;
  }

  private _computeBoundingSphere(): BoundingSphereType {
    // Approximate: center of the tile extent on the ellipsoid surface
    const midLon = (this.extent.west + this.extent.east) / 2;
    const midLat = (this.extent.south + this.extent.north) / 2;
    const cart = Cartographic.create(midLon, midLat, 0);
    const center = Vec3.zero();
    Ellipsoid.cartographicToCartesian(Ellipsoid.WGS84, cart, center);

    // Radius: approximate from diagonal extent
    const cornerCart = Cartographic.create(this.extent.west, this.extent.south, 0);
    const corner = Vec3.zero();
    Ellipsoid.cartographicToCartesian(Ellipsoid.WGS84, cornerCart, corner);
    const radius = Vec3.distance(center, corner);

    return BoundingSphere.create(center, radius);
  }

  private _computeGeometricError(): number {
    // Approximate: tile width in meters at the equator
    const lonSpan = this.extent.east - this.extent.west;
    const equatorRadius = 6378137.0; // WGS84
    return lonSpan * equatorRadius;
  }
}
