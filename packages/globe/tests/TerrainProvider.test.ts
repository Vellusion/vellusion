import { describe, it, expect } from 'vitest';
import { Ellipsoid } from '@vellusion/math';
import {
  GeographicTilingScheme,
  WebMercatorTerrainTilingScheme,
  EllipsoidTerrainProvider,
} from '../src/TerrainProvider';

describe('GeographicTilingScheme', () => {
  const scheme = new GeographicTilingScheme();

  it('numberOfXTilesAtLevel returns 2 * 2^level', () => {
    expect(scheme.numberOfXTilesAtLevel(0)).toBe(2);
    expect(scheme.numberOfXTilesAtLevel(1)).toBe(4);
    expect(scheme.numberOfXTilesAtLevel(2)).toBe(8);
  });

  it('numberOfYTilesAtLevel returns 2^level', () => {
    expect(scheme.numberOfYTilesAtLevel(0)).toBe(1);
    expect(scheme.numberOfYTilesAtLevel(1)).toBe(2);
  });

  it('tileXYToExtent(0,0,0) covers [-PI..0, -PI/2..PI/2]', () => {
    const extent = scheme.tileXYToExtent(0, 0, 0);
    expect(extent.west).toBeCloseTo(-Math.PI, 10);
    expect(extent.south).toBeCloseTo(-Math.PI / 2, 10);
    expect(extent.east).toBeCloseTo(0, 10);
    expect(extent.north).toBeCloseTo(Math.PI / 2, 10);
  });
});

describe('WebMercatorTerrainTilingScheme', () => {
  const scheme = new WebMercatorTerrainTilingScheme();

  it('numberOfXTilesAtLevel returns 2^level', () => {
    expect(scheme.numberOfXTilesAtLevel(0)).toBe(1);
    expect(scheme.numberOfXTilesAtLevel(1)).toBe(2);
  });

  it('tile(0,0,0) covers full Mercator range', () => {
    const extent = scheme.tileXYToExtent(0, 0, 0);
    expect(extent.west).toBeCloseTo(-Math.PI, 10);
    expect(extent.east).toBeCloseTo(Math.PI, 10);
    // At level 0 with y=0, north should be ~85.05 degrees (max Mercator lat)
    const maxMercatorLat = Math.atan(Math.sinh(Math.PI));
    expect(extent.north).toBeCloseTo(maxMercatorLat, 10);
    // south should be -maxMercatorLat
    expect(extent.south).toBeCloseTo(-maxMercatorLat, 10);
  });
});

describe('EllipsoidTerrainProvider', () => {
  it('ready is true', () => {
    const provider = new EllipsoidTerrainProvider();
    expect(provider.ready).toBe(true);
  });

  it('requestTileGeometry returns valid mesh data', async () => {
    const provider = new EllipsoidTerrainProvider();
    const mesh = await provider.requestTileGeometry(0, 0, 0);
    expect(mesh.vertexCount).toBeGreaterThan(0);
    expect(mesh.indexCount).toBeGreaterThan(0);
    expect(mesh.positions.length).toBe(mesh.vertexCount * 3);
    expect(mesh.normals.length).toBe(mesh.vertexCount * 3);
    expect(mesh.uvs.length).toBe(mesh.vertexCount * 2);
    expect(mesh.indices.length).toBe(mesh.indexCount);
  });

  it('geometric error decreases with level', () => {
    const provider = new EllipsoidTerrainProvider();
    const error0 = provider.getLevelMaximumGeometricError(0);
    const error1 = provider.getLevelMaximumGeometricError(1);
    const error2 = provider.getLevelMaximumGeometricError(2);
    expect(error0).toBeGreaterThan(error1);
    expect(error1).toBeGreaterThan(error2);
  });

  it('uses WGS84 by default', async () => {
    const provider = new EllipsoidTerrainProvider();
    const mesh = await provider.requestTileGeometry(0, 0, 2);
    // Verify positions are on WGS84 ellipsoid surface (semi-major axis ~6378137)
    const x = mesh.positions[0];
    const y = mesh.positions[1];
    const z = mesh.positions[2];
    const dist = Math.sqrt(x * x + y * y + z * z);
    // Distance should be between semi-minor (6356752) and semi-major (6378137)
    expect(dist).toBeGreaterThan(6356752);
    expect(dist).toBeLessThanOrEqual(6378137);
  });
});
