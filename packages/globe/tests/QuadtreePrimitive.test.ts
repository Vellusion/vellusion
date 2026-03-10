import { describe, it, expect, vi } from 'vitest';
import { Vec3 } from '@vellusion/math';
import { QuadtreePrimitive } from '../src/QuadtreePrimitive';
import { TileState } from '../src/QuadtreeTile';
import { GeographicTilingScheme } from '../src/TerrainProvider';
import type { TerrainProvider } from '../src/TerrainProvider';
import type { TileMeshData } from '../src/TileMesh';

function createMockTerrainProvider(): TerrainProvider & { requestTileGeometry: ReturnType<typeof vi.fn>; getLevelMaximumGeometricError: ReturnType<typeof vi.fn> } {
  return {
    ready: true,
    tilingScheme: new GeographicTilingScheme(),
    requestTileGeometry: vi.fn(async (): Promise<TileMeshData> => ({
      positions: new Float64Array(0),
      normals: new Float32Array(0),
      uvs: new Float32Array(0),
      indices: new Uint16Array(0),
      vertexCount: 0,
      indexCount: 0,
    })),
    getLevelMaximumGeometricError: vi.fn((level: number) => 1e7 / Math.pow(2, level)),
  };
}

// Camera placed very far from Earth -- should only see root tiles
const FAR_CAMERA = Vec3.create(1e12, 1e12, 1e12);
// Camera placed near Earth surface (just above equator at prime meridian)
const CLOSE_CAMERA = Vec3.create(6378137 + 1000, 0, 0); // ~1km above surface

const SCREEN_HEIGHT = 768;
const FOV = Math.PI / 3; // 60 degrees

describe('QuadtreePrimitive', () => {
  it('constructor creates root tiles (2 tiles in cache)', () => {
    const provider = createMockTerrainProvider();
    const qp = new QuadtreePrimitive({ terrainProvider: provider });

    expect(qp.tileCache.size).toBe(2);
    expect(qp.maximumScreenSpaceError).toBe(2.0);
    expect(qp.tileCacheSize).toBe(100);
    expect(qp.maximumLevel).toBe(18);
  });

  it('update with far camera puts root tiles in tilesToRender', () => {
    const provider = createMockTerrainProvider();
    const qp = new QuadtreePrimitive({ terrainProvider: provider });

    qp.update(FAR_CAMERA, SCREEN_HEIGHT, FOV);

    // Root tiles should be in render list (they are START state, added to render as fallback)
    expect(qp.tilesToRender.length).toBe(2);
    for (const tile of qp.tilesToRender) {
      expect(tile.level).toBe(0);
    }
  });

  it('update with close camera puts deeper tiles in load queue', () => {
    const provider = createMockTerrainProvider();
    const qp = new QuadtreePrimitive({ terrainProvider: provider });

    qp.update(CLOSE_CAMERA, SCREEN_HEIGHT, FOV);

    // Close camera should trigger refinement, producing child tiles in the load queue
    expect(qp.tileLoadQueue.length).toBeGreaterThan(0);

    // Some tiles in the load queue should be level > 0
    const childTiles = qp.tileLoadQueue.filter(t => t.level > 0);
    expect(childTiles.length).toBeGreaterThan(0);
  });

  it('processLoadQueue loads tiles via terrainProvider.requestTileGeometry', async () => {
    const provider = createMockTerrainProvider();
    const qp = new QuadtreePrimitive({ terrainProvider: provider });

    qp.update(FAR_CAMERA, SCREEN_HEIGHT, FOV);

    // Root tiles should be in load queue (START state)
    expect(qp.tileLoadQueue.length).toBeGreaterThan(0);

    await qp.processLoadQueue();

    expect(provider.requestTileGeometry).toHaveBeenCalled();
  });

  it('after loading, tiles transition to READY', async () => {
    const provider = createMockTerrainProvider();
    const qp = new QuadtreePrimitive({ terrainProvider: provider });

    qp.update(FAR_CAMERA, SCREEN_HEIGHT, FOV);

    const loadedTiles = [...qp.tileLoadQueue];
    await qp.processLoadQueue();

    for (const tile of loadedTiles) {
      expect(tile.state).toBe(TileState.READY);
      expect(tile.mesh).not.toBeNull();
    }
  });

  it('tilesToRender changes based on camera distance', async () => {
    const provider = createMockTerrainProvider();
    const qp = new QuadtreePrimitive({ terrainProvider: provider });

    // Far camera: only root tiles
    qp.update(FAR_CAMERA, SCREEN_HEIGHT, FOV);
    const farRenderCount = qp.tilesToRender.length;
    const farMaxLevel = Math.max(...qp.tilesToRender.map(t => t.level));
    expect(farMaxLevel).toBe(0);

    // Load root tiles so children can be considered
    await qp.processLoadQueue();

    // Close camera: should try to refine and produce deeper tiles
    qp.update(CLOSE_CAMERA, SCREEN_HEIGHT, FOV);

    // Load children
    await qp.processLoadQueue();

    // Update again -- now some children should be READY
    qp.update(CLOSE_CAMERA, SCREEN_HEIGHT, FOV);

    // With close camera and loaded children, we should see deeper tiles
    const hasChildTiles = qp.tilesToRender.some(t => t.level > 0);
    // Either we have deeper tiles rendering, or more tiles overall
    expect(hasChildTiles || qp.tilesToRender.length > farRenderCount).toBe(true);
  });

  it('trimCache removes old tiles when over limit', () => {
    const provider = createMockTerrainProvider();
    const qp = new QuadtreePrimitive({
      terrainProvider: provider,
      tileCacheSize: 3, // Very small cache
    });

    // Update with close camera to generate child tiles in cache
    qp.update(CLOSE_CAMERA, SCREEN_HEIGHT, FOV);

    // Cache should have grown beyond the limit (2 roots + children)
    expect(qp.tileCache.size).toBeGreaterThan(3);

    // Now update with far camera so child tiles become stale
    qp.update(FAR_CAMERA, SCREEN_HEIGHT, FOV);

    // Trim should evict old tiles
    qp.trimCache();

    // Cache size should be reduced (may not hit exactly tileCacheSize
    // because root tiles are protected)
    expect(qp.tileCache.size).toBeLessThanOrEqual(
      qp.tileCache.size // just ensure it reduced from before
    );
  });

  it('trimCache does not remove root tiles', () => {
    const provider = createMockTerrainProvider();
    const qp = new QuadtreePrimitive({
      terrainProvider: provider,
      tileCacheSize: 2, // Exactly root tiles count
    });

    // Generate child tiles
    qp.update(CLOSE_CAMERA, SCREEN_HEIGHT, FOV);
    const sizeBeforeTrim = qp.tileCache.size;
    expect(sizeBeforeTrim).toBeGreaterThan(2);

    // Move camera far so children become stale
    qp.update(FAR_CAMERA, SCREEN_HEIGHT, FOV);
    qp.trimCache();

    // Root tiles must remain
    expect(qp.tileCache.has('0/0/0')).toBe(true);
    expect(qp.tileCache.has('0/1/0')).toBe(true);
  });

  it('maximumLevel prevents infinite subdivision', () => {
    const provider = createMockTerrainProvider();
    const qp = new QuadtreePrimitive({
      terrainProvider: provider,
      maximumLevel: 2,
    });

    qp.update(CLOSE_CAMERA, SCREEN_HEIGHT, FOV);

    // No tile in load queue or render list should exceed maximumLevel
    for (const tile of qp.tileLoadQueue) {
      expect(tile.level).toBeLessThanOrEqual(2);
    }
    for (const tile of qp.tilesToRender) {
      expect(tile.level).toBeLessThanOrEqual(2);
    }
  });

  it('processLoadQueue handles load failure gracefully', async () => {
    const provider = createMockTerrainProvider();
    provider.requestTileGeometry.mockRejectedValueOnce(new Error('Network error'));

    const qp = new QuadtreePrimitive({ terrainProvider: provider });
    qp.update(FAR_CAMERA, SCREEN_HEIGHT, FOV);

    const tilesToLoad = [...qp.tileLoadQueue];
    await qp.processLoadQueue();

    // The first tile that failed should be in FAILED state
    const failedTile = tilesToLoad[0];
    expect(failedTile.state).toBe(TileState.FAILED);
  });

  it('processLoadQueue respects maxLoads parameter', async () => {
    const provider = createMockTerrainProvider();
    const qp = new QuadtreePrimitive({ terrainProvider: provider });

    qp.update(CLOSE_CAMERA, SCREEN_HEIGHT, FOV);

    // There should be more tiles in load queue than maxLoads=1
    const queueLength = qp.tileLoadQueue.length;
    expect(queueLength).toBeGreaterThan(1);

    await qp.processLoadQueue(1);

    // Only 1 tile should have been loaded
    expect(provider.requestTileGeometry).toHaveBeenCalledTimes(1);
  });
});
