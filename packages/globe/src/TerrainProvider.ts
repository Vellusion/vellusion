import type { GeographicExtent, TileMeshData } from './TileMesh';
import { TileMesh } from './TileMesh';
import { Ellipsoid, type EllipsoidType } from '@vellusion/math';

// ---------------------------------------------------------------------------
// Terrain tiling schemes
// ---------------------------------------------------------------------------

export interface TerrainTilingScheme {
  numberOfXTilesAtLevel(level: number): number;
  numberOfYTilesAtLevel(level: number): number;
  tileXYToExtent(x: number, y: number, level: number): GeographicExtent;
}

export class GeographicTilingScheme implements TerrainTilingScheme {
  numberOfXTilesAtLevel(level: number): number {
    return 2 * Math.pow(2, level);
  }
  numberOfYTilesAtLevel(level: number): number {
    return Math.pow(2, level);
  }
  tileXYToExtent(x: number, y: number, level: number): GeographicExtent {
    const tilesX = this.numberOfXTilesAtLevel(level);
    const tilesY = this.numberOfYTilesAtLevel(level);
    const tileW = (2 * Math.PI) / tilesX;
    const tileH = Math.PI / tilesY;
    return {
      west: -Math.PI + x * tileW,
      south: -Math.PI / 2 + y * tileH,
      east: -Math.PI + (x + 1) * tileW,
      north: -Math.PI / 2 + (y + 1) * tileH,
    };
  }
}

export class WebMercatorTerrainTilingScheme implements TerrainTilingScheme {
  numberOfXTilesAtLevel(level: number): number {
    return Math.pow(2, level);
  }
  numberOfYTilesAtLevel(level: number): number {
    return Math.pow(2, level);
  }
  tileXYToExtent(x: number, y: number, level: number): GeographicExtent {
    const n = Math.pow(2, level);
    const lonW = (x / n) * 2 * Math.PI - Math.PI;
    const lonE = ((x + 1) / n) * 2 * Math.PI - Math.PI;
    // Y is flipped in TMS (0 at top)
    const latN = Math.atan(Math.sinh(Math.PI * (1 - 2 * y / n)));
    const latS = Math.atan(Math.sinh(Math.PI * (1 - 2 * (y + 1) / n)));
    return { west: lonW, south: latS, east: lonE, north: latN };
  }
}

// ---------------------------------------------------------------------------
// TerrainProvider
// ---------------------------------------------------------------------------

export interface TerrainProvider {
  readonly ready: boolean;
  readonly tilingScheme: TerrainTilingScheme;
  requestTileGeometry(x: number, y: number, level: number): Promise<TileMeshData>;
  getLevelMaximumGeometricError(level: number): number;
}

export class EllipsoidTerrainProvider implements TerrainProvider {
  readonly ready = true;
  readonly tilingScheme: GeographicTilingScheme;
  private _ellipsoid: EllipsoidType;

  constructor(ellipsoid?: EllipsoidType) {
    this._ellipsoid = ellipsoid ?? Ellipsoid.WGS84;
    this.tilingScheme = new GeographicTilingScheme();
  }

  async requestTileGeometry(x: number, y: number, level: number): Promise<TileMeshData> {
    const extent = this.tilingScheme.tileXYToExtent(x, y, level);
    // More segments at lower levels for quality, fewer at higher levels
    const segments = Math.max(4, 16 - level);
    return TileMesh.create(extent, this._ellipsoid, segments, segments);
  }

  getLevelMaximumGeometricError(level: number): number {
    const equatorCircumference = 2 * Math.PI * 6378137.0;
    const tilesAtLevel = this.tilingScheme.numberOfXTilesAtLevel(level);
    return equatorCircumference / tilesAtLevel / 16; // 16 = segments
  }
}
