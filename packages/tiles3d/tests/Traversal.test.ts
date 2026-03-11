import { describe, it, expect } from 'vitest';
import { Vec3 } from '@vellusion/math';
import {
  parseBoundingVolume,
  Tile3D,
  Tile3DState,
  Tileset3D,
  Tileset3DTraversal,
  RequestScheduler,
  TileCache,
} from '@vellusion/tiles3d';

// Shared tileset JSON used across tests
const sampleTileset = {
  asset: { version: '1.0' },
  geometricError: 500,
  root: {
    boundingVolume: { sphere: [0, 0, 0, 100] },
    geometricError: 200,
    refine: 'REPLACE',
    content: { uri: 'root.b3dm' },
    children: [
      {
        boundingVolume: { sphere: [50, 0, 0, 50] },
        geometricError: 50,
        content: { uri: 'child0.b3dm' },
      },
      {
        boundingVolume: { sphere: [-50, 0, 0, 50] },
        geometricError: 50,
        content: { uri: 'child1.b3dm' },
      },
    ],
  },
};

const addTileset = {
  asset: { version: '1.0' },
  geometricError: 500,
  root: {
    boundingVolume: { sphere: [0, 0, 0, 100] },
    geometricError: 200,
    refine: 'ADD',
    content: { uri: 'root.b3dm' },
    children: [
      {
        boundingVolume: { sphere: [50, 0, 0, 50] },
        geometricError: 50,
        content: { uri: 'child0.b3dm' },
      },
      {
        boundingVolume: { sphere: [-50, 0, 0, 50] },
        geometricError: 50,
        content: { uri: 'child1.b3dm' },
      },
    ],
  },
};

const url = 'http://example.com/tileset/tileset.json';
const fov = Math.PI / 3; // 60 degrees
const screenHeight = 768;

/** Helper: create a simple tile for scheduler/cache tests */
function makeTile(geoError: number = 100, contentUri?: string): Tile3D {
  return new Tile3D({
    parent: null,
    boundingVolume: parseBoundingVolume({ sphere: [0, 0, 0, 10] }),
    geometricError: geoError,
    contentUri,
    tilesetBaseUrl: 'http://example.com',
  });
}

// ---------- Tileset3DTraversal ----------

describe('Tileset3DTraversal', () => {
  it('selects root when SSE < threshold (far camera)', () => {
    const ts = Tileset3D.fromJson(url, sampleTileset);
    ts.root.state = Tile3DState.READY;
    // Camera very far away: SSE will be small
    const cam = Vec3.create(100000, 0, 0);
    const result = Tileset3DTraversal.selectTiles(ts.root, cam, screenHeight, fov, 16);
    expect(result.tilesToRender).toContain(ts.root);
    // Should not include children
    expect(result.tilesToRender).not.toContain(ts.root.children[0]);
    expect(result.tilesToRender).not.toContain(ts.root.children[1]);
  });

  it('refines to children when SSE > threshold (close camera)', () => {
    const ts = Tileset3D.fromJson(url, sampleTileset);
    ts.root.children[0].state = Tile3DState.READY;
    ts.root.children[1].state = Tile3DState.READY;
    // Camera very close: SSE will be large, triggers refinement
    const cam = Vec3.create(200, 0, 0);
    const result = Tileset3DTraversal.selectTiles(ts.root, cam, screenHeight, fov, 16);
    // REPLACE: parent should NOT be in render list, children should be
    expect(result.tilesToRender).toContain(ts.root.children[0]);
    expect(result.tilesToRender).toContain(ts.root.children[1]);
    expect(result.tilesToRender).not.toContain(ts.root);
  });

  it('REPLACE: only renders children when refined', () => {
    const ts = Tileset3D.fromJson(url, sampleTileset);
    ts.root.state = Tile3DState.READY;
    ts.root.children[0].state = Tile3DState.READY;
    ts.root.children[1].state = Tile3DState.READY;
    // Close camera to trigger refinement
    const cam = Vec3.create(200, 0, 0);
    const result = Tileset3DTraversal.selectTiles(ts.root, cam, screenHeight, fov, 16);
    // Root should not be rendered with REPLACE
    expect(result.tilesToRender).not.toContain(ts.root);
  });

  it('ADD: renders parent AND children', () => {
    const ts = Tileset3D.fromJson(url, addTileset);
    ts.root.state = Tile3DState.READY;
    ts.root.children[0].state = Tile3DState.READY;
    ts.root.children[1].state = Tile3DState.READY;
    // Close camera to trigger refinement
    const cam = Vec3.create(200, 0, 0);
    const result = Tileset3DTraversal.selectTiles(ts.root, cam, screenHeight, fov, 16);
    // ADD: root should also be rendered
    expect(result.tilesToRender).toContain(ts.root);
    expect(result.tilesToRender).toContain(ts.root.children[0]);
    expect(result.tilesToRender).toContain(ts.root.children[1]);
  });

  it('unloaded tiles added to tilesToLoad', () => {
    const ts = Tileset3D.fromJson(url, sampleTileset);
    // All tiles are UNLOADED by default
    const cam = Vec3.create(100000, 0, 0);
    const result = Tileset3DTraversal.selectTiles(ts.root, cam, screenHeight, fov, 16);
    expect(result.tilesToLoad).toContain(ts.root);
  });

  it('counts visited tiles correctly', () => {
    const ts = Tileset3D.fromJson(url, sampleTileset);
    // Far camera: only root visited
    const cam = Vec3.create(100000, 0, 0);
    const result = Tileset3DTraversal.selectTiles(ts.root, cam, screenHeight, fov, 16);
    expect(result.tilesVisited).toBe(1);
  });

  it('visits all tiles when refinement occurs', () => {
    const ts = Tileset3D.fromJson(url, sampleTileset);
    // Close camera: root + 2 children visited
    const cam = Vec3.create(200, 0, 0);
    const result = Tileset3DTraversal.selectTiles(ts.root, cam, screenHeight, fov, 16);
    expect(result.tilesVisited).toBe(3);
  });

  it('adds fallback ancestor when tile is unloaded', () => {
    const ts = Tileset3D.fromJson(url, sampleTileset);
    ts.root.state = Tile3DState.READY;
    // Children are UNLOADED, close camera triggers refinement
    const cam = Vec3.create(200, 0, 0);
    const result = Tileset3DTraversal.selectTiles(ts.root, cam, screenHeight, fov, 16);
    // Root should appear as fallback since children are unloaded
    expect(result.tilesToRender).toContain(ts.root);
    expect(result.tilesToLoad.length).toBeGreaterThan(0);
  });

  it('does not duplicate fallback ancestor in render list', () => {
    const ts = Tileset3D.fromJson(url, sampleTileset);
    ts.root.state = Tile3DState.READY;
    // Both children unloaded, both should trigger fallback to root but only once
    const cam = Vec3.create(200, 0, 0);
    const result = Tileset3DTraversal.selectTiles(ts.root, cam, screenHeight, fov, 16);
    const rootCount = result.tilesToRender.filter(t => t === ts.root).length;
    expect(rootCount).toBe(1);
  });
});

// ---------- RequestScheduler ----------

describe('RequestScheduler', () => {
  it('enqueue adds tile to queue', () => {
    const scheduler = new RequestScheduler();
    const tile = makeTile(100, 'tile.b3dm');
    scheduler.enqueue(tile, 1);
    expect(scheduler.pendingCount).toBe(1);
  });

  it('enqueue sets tile state to LOADING', () => {
    const scheduler = new RequestScheduler();
    const tile = makeTile(100, 'tile.b3dm');
    scheduler.enqueue(tile, 1);
    expect(tile.state).toBe(Tile3DState.LOADING);
  });

  it('processQueue respects maxConcurrency', () => {
    const scheduler = new RequestScheduler(2);
    const tiles = [
      makeTile(100, 'a.b3dm'),
      makeTile(100, 'b.b3dm'),
      makeTile(100, 'c.b3dm'),
    ];
    for (let i = 0; i < tiles.length; i++) {
      scheduler.enqueue(tiles[i], i);
    }
    const started = scheduler.processQueue();
    expect(started.length).toBe(2);
    expect(scheduler.pendingCount).toBe(1);
    expect(scheduler.activeCount).toBe(2);
  });

  it('requestCompleted decrements active count', () => {
    const scheduler = new RequestScheduler(2);
    const tile = makeTile(100, 'tile.b3dm');
    scheduler.enqueue(tile, 1);
    scheduler.processQueue();
    expect(scheduler.activeCount).toBe(1);
    scheduler.requestCompleted(tile);
    expect(scheduler.activeCount).toBe(0);
  });

  it('cancel removes from queue', () => {
    const scheduler = new RequestScheduler();
    const tile = makeTile(100, 'tile.b3dm');
    scheduler.enqueue(tile, 1);
    expect(scheduler.pendingCount).toBe(1);
    scheduler.cancel(tile);
    expect(scheduler.pendingCount).toBe(0);
    expect(tile.state).toBe(Tile3DState.UNLOADED);
  });

  it('queue sorted by priority (lower = higher priority)', () => {
    const scheduler = new RequestScheduler(10);
    const tileHigh = makeTile(100, 'high.b3dm');
    const tileLow = makeTile(100, 'low.b3dm');
    const tileMid = makeTile(100, 'mid.b3dm');
    scheduler.enqueue(tileLow, 10);
    scheduler.enqueue(tileHigh, 1);
    scheduler.enqueue(tileMid, 5);
    const started = scheduler.processQueue();
    expect(started[0]).toBe(tileHigh);
    expect(started[1]).toBe(tileMid);
    expect(started[2]).toBe(tileLow);
  });

  it('pendingCount and activeCount reflect state', () => {
    const scheduler = new RequestScheduler(1);
    expect(scheduler.pendingCount).toBe(0);
    expect(scheduler.activeCount).toBe(0);
    const tile1 = makeTile(100, 'a.b3dm');
    const tile2 = makeTile(100, 'b.b3dm');
    scheduler.enqueue(tile1, 1);
    scheduler.enqueue(tile2, 2);
    expect(scheduler.pendingCount).toBe(2);
    scheduler.processQueue();
    expect(scheduler.activeCount).toBe(1);
    expect(scheduler.pendingCount).toBe(1);
  });

  it('does not re-add loading tiles', () => {
    const scheduler = new RequestScheduler();
    const tile = makeTile(100, 'tile.b3dm');
    scheduler.enqueue(tile, 1);
    // tile is now LOADING
    scheduler.enqueue(tile, 1);
    expect(scheduler.pendingCount).toBe(1);
  });

  it('clear resets queue and active count', () => {
    const scheduler = new RequestScheduler(2);
    const tile1 = makeTile(100, 'a.b3dm');
    const tile2 = makeTile(100, 'b.b3dm');
    scheduler.enqueue(tile1, 1);
    scheduler.enqueue(tile2, 2);
    scheduler.processQueue();
    scheduler.clear();
    expect(scheduler.pendingCount).toBe(0);
    expect(scheduler.activeCount).toBe(0);
  });
});

// ---------- TileCache ----------

describe('TileCache', () => {
  it('add increases memory usage', () => {
    const cache = new TileCache();
    const tile = makeTile(100, 'tile.b3dm');
    cache.add(tile, 1024);
    expect(cache.currentMemoryUsage).toBe(1024);
    expect(cache.entryCount).toBe(1);
  });

  it('add same tile twice does not duplicate', () => {
    const cache = new TileCache();
    const tile = makeTile(100, 'tile.b3dm');
    cache.add(tile, 1024);
    cache.add(tile, 1024);
    expect(cache.entryCount).toBe(1);
    expect(cache.currentMemoryUsage).toBe(1024);
  });

  it('touch updates last accessed', () => {
    const cache = new TileCache(2048);
    const tile1 = makeTile(100, 'a.b3dm');
    const tile2 = makeTile(100, 'b.b3dm');
    cache.add(tile1, 1024);
    cache.add(tile2, 1024);
    // Touch tile1 to make it more recent than tile2
    cache.touch(tile1);
    // Now exceed budget
    const tile3 = makeTile(100, 'c.b3dm');
    cache.add(tile3, 1024);
    // tile2 should be evicted first since tile1 was touched more recently
    const evicted = cache.trimToFit();
    expect(evicted).toContain(tile2);
    expect(evicted).not.toContain(tile1);
  });

  it('trimToFit evicts oldest tiles', () => {
    const cache = new TileCache(1500); // Budget is 1500 bytes
    const tile1 = makeTile(100, 'a.b3dm');
    tile1.state = Tile3DState.READY;
    tile1.content = { data: 'a' };
    const tile2 = makeTile(100, 'b.b3dm');
    tile2.state = Tile3DState.READY;
    tile2.content = { data: 'b' };
    cache.add(tile1, 1000);
    cache.add(tile2, 1000);
    // Total = 2000, exceeds 1500
    const evicted = cache.trimToFit();
    expect(evicted.length).toBeGreaterThan(0);
    expect(evicted[0].state).toBe(Tile3DState.UNLOADED);
    expect(evicted[0].content).toBeNull();
    expect(cache.currentMemoryUsage).toBeLessThanOrEqual(1500);
  });

  it('trimToFit does nothing when under budget', () => {
    const cache = new TileCache(); // 512 MB default
    const tile = makeTile(100, 'tile.b3dm');
    cache.add(tile, 1024);
    const evicted = cache.trimToFit();
    expect(evicted.length).toBe(0);
    expect(cache.entryCount).toBe(1);
  });

  it('remove specific tile', () => {
    const cache = new TileCache();
    const tile1 = makeTile(100, 'a.b3dm');
    const tile2 = makeTile(100, 'b.b3dm');
    cache.add(tile1, 1024);
    cache.add(tile2, 2048);
    expect(cache.remove(tile1)).toBe(true);
    expect(cache.entryCount).toBe(1);
    expect(cache.currentMemoryUsage).toBe(2048);
  });

  it('remove returns false for uncached tile', () => {
    const cache = new TileCache();
    const tile = makeTile(100, 'tile.b3dm');
    expect(cache.remove(tile)).toBe(false);
  });

  it('clear resets everything', () => {
    const cache = new TileCache();
    const tile1 = makeTile(100, 'a.b3dm');
    tile1.state = Tile3DState.READY;
    tile1.content = { data: 'a' };
    const tile2 = makeTile(100, 'b.b3dm');
    tile2.state = Tile3DState.READY;
    tile2.content = { data: 'b' };
    cache.add(tile1, 1024);
    cache.add(tile2, 2048);
    cache.clear();
    expect(cache.entryCount).toBe(0);
    expect(cache.currentMemoryUsage).toBe(0);
    expect(tile1.state).toBe(Tile3DState.UNLOADED);
    expect(tile1.content).toBeNull();
    expect(tile2.state).toBe(Tile3DState.UNLOADED);
    expect(tile2.content).toBeNull();
  });

  it('evicted tiles set to UNLOADED with null content', () => {
    const cache = new TileCache(500);
    const tile = makeTile(100, 'tile.b3dm');
    tile.state = Tile3DState.READY;
    tile.content = { mesh: 'data' };
    cache.add(tile, 1000);
    // Over budget immediately
    const evicted = cache.trimToFit();
    expect(evicted).toContain(tile);
    expect(tile.state).toBe(Tile3DState.UNLOADED);
    expect(tile.content).toBeNull();
  });
});
