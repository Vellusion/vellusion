import { describe, it, expect } from 'vitest';
import { Vec3 } from '@vellusion/math';
import {
  parseBoundingVolume,
  distanceToBoundingVolume,
  Tile3D,
  Tile3DState,
  Tileset3D,
} from '@vellusion/tiles3d';

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

// ---------- BoundingVolume ----------

describe('parseBoundingVolume', () => {
  it('parses sphere', () => {
    const bv = parseBoundingVolume({ sphere: [1, 2, 3, 10] });
    expect(bv.type).toBe('sphere');
    if (bv.type === 'sphere') {
      expect(bv.center[0]).toBe(1);
      expect(bv.center[1]).toBe(2);
      expect(bv.center[2]).toBe(3);
      expect(bv.radius).toBe(10);
    }
  });

  it('parses box', () => {
    const boxArr = [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1];
    const bv = parseBoundingVolume({ box: boxArr });
    expect(bv.type).toBe('box');
    if (bv.type === 'box') {
      expect(bv.center[0]).toBe(0);
      expect(bv.halfAxes.length).toBe(9);
      expect(bv.halfAxes[0]).toBe(1); // first half-axis x
    }
  });

  it('parses region', () => {
    const bv = parseBoundingVolume({ region: [-1.5, -0.5, 1.5, 0.5, 0, 100] });
    expect(bv.type).toBe('region');
    if (bv.type === 'region') {
      expect(bv.west).toBe(-1.5);
      expect(bv.south).toBe(-0.5);
      expect(bv.east).toBe(1.5);
      expect(bv.north).toBe(0.5);
      expect(bv.minHeight).toBe(0);
      expect(bv.maxHeight).toBe(100);
    }
  });

  it('throws on unknown type', () => {
    expect(() => parseBoundingVolume({})).toThrow('Unknown bounding volume type');
  });
});

describe('distanceToBoundingVolume', () => {
  it('sphere: returns dist - radius when camera outside', () => {
    const bv = parseBoundingVolume({ sphere: [0, 0, 0, 10] });
    const cam = Vec3.create(20, 0, 0);
    expect(distanceToBoundingVolume(bv, cam)).toBeCloseTo(10, 5);
  });

  it('sphere: returns 0 when camera inside', () => {
    const bv = parseBoundingVolume({ sphere: [0, 0, 0, 100] });
    const cam = Vec3.create(5, 0, 0);
    expect(distanceToBoundingVolume(bv, cam)).toBe(0);
  });

  it('sphere: returns 0 when camera at center', () => {
    const bv = parseBoundingVolume({ sphere: [0, 0, 0, 10] });
    const cam = Vec3.create(0, 0, 0);
    expect(distanceToBoundingVolume(bv, cam)).toBe(0);
  });

  it('sphere: handles 3D offset', () => {
    const bv = parseBoundingVolume({ sphere: [0, 0, 0, 1] });
    const cam = Vec3.create(3, 4, 0); // distance = 5
    expect(distanceToBoundingVolume(bv, cam)).toBeCloseTo(4, 5);
  });

  it('box: returns approximate distance', () => {
    // Unit box at origin: half-axes are identity columns
    const boxArr = [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1];
    const bv = parseBoundingVolume({ box: boxArr });
    const cam = Vec3.create(10, 0, 0);
    const dist = distanceToBoundingVolume(bv, cam);
    expect(dist).toBeGreaterThan(0);
    // dist to center = 10, max half-axis = 1, so approx 9
    expect(dist).toBeCloseTo(9, 5);
  });

  it('box: returns 0 when camera inside', () => {
    const boxArr = [0, 0, 0, 10, 0, 0, 0, 10, 0, 0, 0, 10];
    const bv = parseBoundingVolume({ box: boxArr });
    const cam = Vec3.create(5, 0, 0);
    // dist to center = 5, max half-axis = 10 => max(0, 5-10) = 0
    expect(distanceToBoundingVolume(bv, cam)).toBe(0);
  });

  it('region: returns 0 (placeholder)', () => {
    const bv = parseBoundingVolume({ region: [-1, -0.5, 1, 0.5, 0, 100] });
    const cam = Vec3.create(1000, 1000, 1000);
    expect(distanceToBoundingVolume(bv, cam)).toBe(0);
  });
});

// ---------- Tile3D ----------

describe('Tile3D', () => {
  it('depth is 0 for root', () => {
    const tile = new Tile3D({
      parent: null,
      boundingVolume: parseBoundingVolume({ sphere: [0, 0, 0, 10] }),
      geometricError: 100,
      tilesetBaseUrl: 'http://example.com',
    });
    expect(tile.depth).toBe(0);
  });

  it('depth is 1 for children', () => {
    const root = new Tile3D({
      parent: null,
      boundingVolume: parseBoundingVolume({ sphere: [0, 0, 0, 10] }),
      geometricError: 100,
      tilesetBaseUrl: 'http://example.com',
    });
    const child = new Tile3D({
      parent: root,
      boundingVolume: parseBoundingVolume({ sphere: [5, 0, 0, 5] }),
      geometricError: 50,
      tilesetBaseUrl: 'http://example.com',
    });
    expect(child.depth).toBe(1);
  });

  it('hasContent is true when contentUri is set', () => {
    const tile = new Tile3D({
      parent: null,
      boundingVolume: parseBoundingVolume({ sphere: [0, 0, 0, 10] }),
      geometricError: 100,
      contentUri: 'tile.b3dm',
      tilesetBaseUrl: 'http://example.com',
    });
    expect(tile.hasContent).toBe(true);
  });

  it('hasContent is false when contentUri is undefined', () => {
    const tile = new Tile3D({
      parent: null,
      boundingVolume: parseBoundingVolume({ sphere: [0, 0, 0, 10] }),
      geometricError: 100,
      tilesetBaseUrl: 'http://example.com',
    });
    expect(tile.hasContent).toBe(false);
  });

  it('hasChildren is true when children array has elements', () => {
    const root = new Tile3D({
      parent: null,
      boundingVolume: parseBoundingVolume({ sphere: [0, 0, 0, 10] }),
      geometricError: 100,
      tilesetBaseUrl: 'http://example.com',
    });
    const child = new Tile3D({
      parent: root,
      boundingVolume: parseBoundingVolume({ sphere: [5, 0, 0, 5] }),
      geometricError: 50,
      tilesetBaseUrl: 'http://example.com',
    });
    root.children.push(child);
    expect(root.hasChildren).toBe(true);
  });

  it('hasChildren is false when children array is empty', () => {
    const tile = new Tile3D({
      parent: null,
      boundingVolume: parseBoundingVolume({ sphere: [0, 0, 0, 10] }),
      geometricError: 100,
      tilesetBaseUrl: 'http://example.com',
    });
    expect(tile.hasChildren).toBe(false);
  });

  it('computeScreenSpaceError returns Infinity when distance is 0', () => {
    const tile = new Tile3D({
      parent: null,
      boundingVolume: parseBoundingVolume({ sphere: [0, 0, 0, 100] }),
      geometricError: 200,
      tilesetBaseUrl: 'http://example.com',
    });
    // Camera inside the sphere: distance = 0
    const cam = Vec3.create(0, 0, 0);
    expect(tile.computeScreenSpaceError(cam, 768, Math.PI / 3)).toBe(Infinity);
  });

  it('computeScreenSpaceError decreases with distance', () => {
    const tile = new Tile3D({
      parent: null,
      boundingVolume: parseBoundingVolume({ sphere: [0, 0, 0, 10] }),
      geometricError: 200,
      tilesetBaseUrl: 'http://example.com',
    });
    const cam1 = Vec3.create(100, 0, 0);
    const cam2 = Vec3.create(500, 0, 0);
    const sse1 = tile.computeScreenSpaceError(cam1, 768, Math.PI / 3);
    const sse2 = tile.computeScreenSpaceError(cam2, 768, Math.PI / 3);
    expect(sse1).toBeGreaterThan(sse2);
  });

  it('state defaults to UNLOADED', () => {
    const tile = new Tile3D({
      parent: null,
      boundingVolume: parseBoundingVolume({ sphere: [0, 0, 0, 10] }),
      geometricError: 100,
      tilesetBaseUrl: 'http://example.com',
    });
    expect(tile.state).toBe(Tile3DState.UNLOADED);
  });

  it('contentUrl resolves relative URIs against base URL', () => {
    const tile = new Tile3D({
      parent: null,
      boundingVolume: parseBoundingVolume({ sphere: [0, 0, 0, 10] }),
      geometricError: 100,
      contentUri: 'data/tile.b3dm',
      tilesetBaseUrl: 'http://example.com/tiles',
    });
    expect(tile.contentUrl).toBe('http://example.com/tiles/data/tile.b3dm');
  });

  it('contentUrl returns absolute URI unchanged', () => {
    const tile = new Tile3D({
      parent: null,
      boundingVolume: parseBoundingVolume({ sphere: [0, 0, 0, 10] }),
      geometricError: 100,
      contentUri: 'http://cdn.example.com/tile.b3dm',
      tilesetBaseUrl: 'http://example.com/tiles',
    });
    expect(tile.contentUrl).toBe('http://cdn.example.com/tile.b3dm');
  });

  it('contentUrl is undefined when no contentUri', () => {
    const tile = new Tile3D({
      parent: null,
      boundingVolume: parseBoundingVolume({ sphere: [0, 0, 0, 10] }),
      geometricError: 100,
      tilesetBaseUrl: 'http://example.com',
    });
    expect(tile.contentUrl).toBeUndefined();
  });
});

// ---------- Tileset3D ----------

describe('Tileset3D', () => {
  const url = 'http://example.com/tileset/tileset.json';

  it('fromJson parses root tile', () => {
    const ts = Tileset3D.fromJson(url, sampleTileset);
    expect(ts.root).toBeDefined();
    expect(ts.root.boundingVolume.type).toBe('sphere');
  });

  it('fromJson creates correct tree depth', () => {
    const ts = Tileset3D.fromJson(url, sampleTileset);
    expect(ts.root.depth).toBe(0);
    expect(ts.root.children[0].depth).toBe(1);
    expect(ts.root.children[1].depth).toBe(1);
  });

  it('tileCount returns total tiles', () => {
    const ts = Tileset3D.fromJson(url, sampleTileset);
    expect(ts.tileCount).toBe(3); // root + 2 children
  });

  it('asset version is stored', () => {
    const ts = Tileset3D.fromJson(url, sampleTileset);
    expect(ts.asset.version).toBe('1.0');
  });

  it('maximumScreenSpaceError defaults to 16', () => {
    const ts = Tileset3D.fromJson(url, sampleTileset);
    expect(ts.maximumScreenSpaceError).toBe(16);
  });

  it('maximumScreenSpaceError can be overridden', () => {
    const ts = Tileset3D.fromJson(url, sampleTileset, { maximumScreenSpaceError: 8 });
    expect(ts.maximumScreenSpaceError).toBe(8);
  });

  it('show defaults to true', () => {
    const ts = Tileset3D.fromJson(url, sampleTileset);
    expect(ts.show).toBe(true);
  });

  it('show can be overridden', () => {
    const ts = Tileset3D.fromJson(url, sampleTileset, { show: false });
    expect(ts.show).toBe(false);
  });

  it('root has correct geometric error', () => {
    const ts = Tileset3D.fromJson(url, sampleTileset);
    expect(ts.root.geometricError).toBe(200);
  });

  it('children inherit refine from parent when not specified', () => {
    const ts = Tileset3D.fromJson(url, sampleTileset);
    // Children don't have refine in the JSON, should inherit REPLACE
    expect(ts.root.refine).toBe('REPLACE');
    expect(ts.root.children[0].refine).toBe('REPLACE');
    expect(ts.root.children[1].refine).toBe('REPLACE');
  });

  it('resolves content URIs relative to tileset base URL', () => {
    const ts = Tileset3D.fromJson(url, sampleTileset);
    expect(ts.root.contentUrl).toBe('http://example.com/tileset/root.b3dm');
    expect(ts.root.children[0].contentUrl).toBe('http://example.com/tileset/child0.b3dm');
  });

  it('ready is true after fromJson', () => {
    const ts = Tileset3D.fromJson(url, sampleTileset);
    expect(ts.ready).toBe(true);
  });

  it('url is stored', () => {
    const ts = Tileset3D.fromJson(url, sampleTileset);
    expect(ts.url).toBe(url);
  });

  it('boundingSphere returns root bounding volume', () => {
    const ts = Tileset3D.fromJson(url, sampleTileset);
    expect(ts.boundingSphere).toBe(ts.root.boundingVolume);
  });

  it('handles tileset with content.url instead of content.uri', () => {
    const tilesetWithUrl = {
      asset: { version: '1.0' },
      geometricError: 100,
      root: {
        boundingVolume: { sphere: [0, 0, 0, 50] },
        geometricError: 50,
        refine: 'ADD',
        content: { url: 'legacy.b3dm' },
      },
    };
    const ts = Tileset3D.fromJson(url, tilesetWithUrl);
    expect(ts.root.contentUri).toBe('legacy.b3dm');
    expect(ts.root.refine).toBe('ADD');
  });
});
