import type { GeographicExtent } from './TileMesh';

/**
 * Describes how a surface is split into tiles at each level.
 */
export interface TilingScheme {
  readonly projection: string;
  readonly numberOfLevelZeroTilesX: number;
  readonly numberOfLevelZeroTilesY: number;

  getNumberOfXTilesAtLevel(level: number): number;
  getNumberOfYTilesAtLevel(level: number): number;
  tileXYToExtent(x: number, y: number, level: number): GeographicExtent;
}

/**
 * Web Mercator (EPSG:3857) tiling scheme matching the de-facto standard
 * used by OpenStreetMap, Google Maps, Bing, etc.
 *
 * Level 0 has 1 tile covering the full Mercator range (-PI..PI, ~-85.06..85.06 degrees).
 */
export class WebMercatorTilingScheme implements TilingScheme {
  readonly projection = 'EPSG:3857';
  readonly numberOfLevelZeroTilesX = 1;
  readonly numberOfLevelZeroTilesY = 1;

  getNumberOfXTilesAtLevel(level: number): number {
    return 1 << level;
  }

  getNumberOfYTilesAtLevel(level: number): number {
    return 1 << level;
  }

  tileXYToExtent(x: number, y: number, level: number): GeographicExtent {
    const size = Math.PI * 2 / (1 << level);
    const west = -Math.PI + x * size;
    const east = west + size;
    const north = Math.PI - y * size;
    const south = north - size;
    return { west, south, east, north };
  }
}

// ---------------------------------------------------------------------------
// ImageryProvider interface
// ---------------------------------------------------------------------------

/**
 * Provides imagery tiles (raster map images) to the globe.
 */
export interface ImageryProvider {
  readonly ready: boolean;
  readonly tileWidth: number;
  readonly tileHeight: number;
  readonly minimumLevel: number;
  readonly maximumLevel: number;
  readonly tilingScheme: TilingScheme;
  readonly credit?: string;

  getTileUrl(x: number, y: number, level: number): string;
  requestImage(x: number, y: number, level: number): Promise<ImageBitmap | HTMLImageElement>;
}

// ---------------------------------------------------------------------------
// UrlTemplateImageryProvider
// ---------------------------------------------------------------------------

export interface UrlTemplateImageryProviderOptions {
  url: string;
  minimumLevel?: number;
  maximumLevel?: number;
  tileWidth?: number;
  tileHeight?: number;
  credit?: string;
}

/**
 * Loads imagery tiles from a URL template containing `{x}`, `{y}`, `{z}` tokens.
 */
export class UrlTemplateImageryProvider implements ImageryProvider {
  readonly ready = true;
  readonly tileWidth: number;
  readonly tileHeight: number;
  readonly minimumLevel: number;
  readonly maximumLevel: number;
  readonly tilingScheme: TilingScheme;
  readonly credit?: string;
  private _urlTemplate: string;

  constructor(options: UrlTemplateImageryProviderOptions) {
    this._urlTemplate = options.url;
    this.tileWidth = options.tileWidth ?? 256;
    this.tileHeight = options.tileHeight ?? 256;
    this.minimumLevel = options.minimumLevel ?? 0;
    this.maximumLevel = options.maximumLevel ?? 18;
    this.credit = options.credit;
    this.tilingScheme = new WebMercatorTilingScheme();
  }

  getTileUrl(x: number, y: number, level: number): string {
    return this._urlTemplate
      .replace('{x}', String(x))
      .replace('{y}', String(y))
      .replace('{z}', String(level));
  }

  async requestImage(x: number, y: number, level: number): Promise<ImageBitmap> {
    const url = this.getTileUrl(x, y, level);
    const response = await fetch(url);
    const blob = await response.blob();
    return createImageBitmap(blob);
  }
}

// ---------------------------------------------------------------------------
// OpenStreetMapImageryProvider
// ---------------------------------------------------------------------------

/**
 * Pre-configured imagery provider for OpenStreetMap raster tiles.
 */
export class OpenStreetMapImageryProvider extends UrlTemplateImageryProvider {
  constructor(options?: { url?: string; maximumLevel?: number; credit?: string }) {
    super({
      url: options?.url ?? 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      maximumLevel: options?.maximumLevel ?? 18,
      credit: options?.credit ?? '\u00A9 OpenStreetMap contributors',
    });
  }
}
