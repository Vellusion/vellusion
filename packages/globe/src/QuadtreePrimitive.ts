import { QuadtreeTile, TileState } from './QuadtreeTile';
import type { TerrainProvider } from './TerrainProvider';
import { Vec3, type Vec3Type } from '@vellusion/math';

export interface QuadtreePrimitiveOptions {
  terrainProvider: TerrainProvider;
  maximumScreenSpaceError?: number;  // default 2.0
  tileCacheSize?: number;            // max tiles in memory, default 100
  maximumLevel?: number;             // default 18
}

export class QuadtreePrimitive {
  readonly terrainProvider: TerrainProvider;
  maximumScreenSpaceError: number;
  tileCacheSize: number;
  maximumLevel: number;

  private _rootTiles: QuadtreeTile[];
  private _tilesToRender: QuadtreeTile[] = [];
  private _tileLoadQueue: QuadtreeTile[] = [];
  private _tileCache: Map<string, QuadtreeTile> = new Map();
  private _frameNumber: number = 0;

  constructor(options: QuadtreePrimitiveOptions) {
    this.terrainProvider = options.terrainProvider;
    this.maximumScreenSpaceError = options.maximumScreenSpaceError ?? 2.0;
    this.tileCacheSize = options.tileCacheSize ?? 100;
    this.maximumLevel = options.maximumLevel ?? 18;
    this._rootTiles = QuadtreeTile.createRootTiles();
    for (const tile of this._rootTiles) {
      this._tileCache.set(tile.tileKey, tile);
    }
  }

  get tilesToRender(): readonly QuadtreeTile[] {
    return this._tilesToRender;
  }

  get tileLoadQueue(): readonly QuadtreeTile[] {
    return this._tileLoadQueue;
  }

  get tileCache(): ReadonlyMap<string, QuadtreeTile> {
    return this._tileCache;
  }

  /**
   * Update tile selection for the current frame.
   * @param cameraPosition - camera position in ECEF
   * @param screenHeight - viewport height in pixels
   * @param fov - camera vertical field of view in radians
   */
  update(cameraPosition: Vec3Type, screenHeight: number, fov: number): void {
    this._frameNumber++;
    this._tilesToRender = [];
    this._tileLoadQueue = [];

    // SSE denominator = screenHeight / (2 * tan(fov/2))
    const sseDenominator = screenHeight / (2 * Math.tan(fov / 2));

    for (const root of this._rootTiles) {
      this._visitTile(root, cameraPosition, sseDenominator);
    }
  }

  /**
   * Process pending tile loads (limits work per frame).
   */
  async processLoadQueue(maxLoads: number = 4): Promise<void> {
    const toLoad = this._tileLoadQueue.slice(0, maxLoads);
    const promises = toLoad.map(async (tile) => {
      if (tile.state !== TileState.START) return;
      tile.state = TileState.LOADING;
      try {
        tile.mesh = await this.terrainProvider.requestTileGeometry(tile.x, tile.y, tile.level);
        tile.state = TileState.READY;
      } catch {
        tile.state = TileState.FAILED;
      }
    });
    await Promise.all(promises);
  }

  /**
   * Evict tiles from cache when over limit (LRU based on lastUsedFrameNumber).
   */
  trimCache(): void {
    if (this._tileCache.size <= this.tileCacheSize) return;

    // Collect tiles sorted by lastUsedFrameNumber (oldest first)
    const entries = [...this._tileCache.entries()]
      .sort((a, b) => a[1].lastUsedFrameNumber - b[1].lastUsedFrameNumber);

    while (this._tileCache.size > this.tileCacheSize && entries.length > 0) {
      const [key, tile] = entries.shift()!;
      // Don't evict tiles currently being rendered
      if (tile.lastUsedFrameNumber === this._frameNumber) continue;
      // Don't evict root tiles
      if (tile.level === 0) continue;
      this._tileCache.delete(key);
    }
  }

  private _visitTile(tile: QuadtreeTile, cameraPosition: Vec3Type, sseDenominator: number): void {
    tile.lastUsedFrameNumber = this._frameNumber;

    const needsRefine = tile.level < this.maximumLevel &&
      tile.needsRefinement(cameraPosition, sseDenominator, this.maximumScreenSpaceError);

    if (needsRefine) {
      // Try to use children
      const children = tile.subdivide();
      const allChildrenReady = children.every(c => c.state === TileState.READY);

      if (allChildrenReady) {
        // Render children instead
        for (const child of children) {
          this._visitTile(child, cameraPosition, sseDenominator);
        }
        return;
      }

      // Children not ready -- load them and render this tile as fallback
      for (const child of children) {
        if (!this._tileCache.has(child.tileKey)) {
          this._tileCache.set(child.tileKey, child);
        }
        if (child.state === TileState.START) {
          this._tileLoadQueue.push(child);
        }
      }
    }

    // Render this tile (either it doesn't need refinement, or children aren't ready)
    if (tile.state === TileState.START) {
      this._tileLoadQueue.push(tile);
    }
    if (tile.state === TileState.READY || tile.state === TileState.LOADING) {
      this._tilesToRender.push(tile);
    } else if (tile.state === TileState.START) {
      // Add to render queue anyway so we at least render something
      this._tilesToRender.push(tile);
    }
  }
}
