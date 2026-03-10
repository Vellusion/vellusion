import { describe, it, expect } from 'vitest';
import { Ellipsoid } from '@vellusion/math';
import { TileMesh } from '../src/TileMesh';

describe('TileMesh', () => {
  it('creates mesh with correct vertex and index count', () => {
    const extent = { west: -Math.PI, south: -Math.PI / 2, east: Math.PI, north: Math.PI / 2 };
    const mesh = TileMesh.create(extent, Ellipsoid.WGS84, 4, 4);
    expect(mesh.vertexCount).toBe(25); // (4+1)*(4+1)
    expect(mesh.indexCount).toBe(96); // 4*4*6
  });

  it('positions lie on ellipsoid surface', () => {
    const extent = { west: 0, south: 0, east: 0.1, north: 0.1 };
    const mesh = TileMesh.create(extent, Ellipsoid.UNIT_SPHERE, 2, 2);
    for (let i = 0; i < mesh.vertexCount; i++) {
      const x = mesh.positions[i * 3], y = mesh.positions[i * 3 + 1], z = mesh.positions[i * 3 + 2];
      const dist = Math.sqrt(x * x + y * y + z * z);
      expect(dist).toBeCloseTo(1.0, 5);
    }
  });

  it('UVs range from 0 to 1', () => {
    const extent = { west: -1, south: -0.5, east: 1, north: 0.5 };
    const mesh = TileMesh.create(extent, Ellipsoid.WGS84, 4, 4);
    for (let i = 0; i < mesh.vertexCount; i++) {
      expect(mesh.uvs[i * 2]).toBeGreaterThanOrEqual(0);
      expect(mesh.uvs[i * 2]).toBeLessThanOrEqual(1);
      expect(mesh.uvs[i * 2 + 1]).toBeGreaterThanOrEqual(0);
      expect(mesh.uvs[i * 2 + 1]).toBeLessThanOrEqual(1);
    }
  });

  it('normals are unit length', () => {
    const extent = { west: 0, south: 0, east: 1, north: 1 };
    const mesh = TileMesh.create(extent, Ellipsoid.WGS84, 4, 4);
    for (let i = 0; i < mesh.vertexCount; i++) {
      const nx = mesh.normals[i * 3], ny = mesh.normals[i * 3 + 1], nz = mesh.normals[i * 3 + 2];
      expect(Math.sqrt(nx * nx + ny * ny + nz * nz)).toBeCloseTo(1.0, 4);
    }
  });

  it('indices are within valid range', () => {
    const mesh = TileMesh.create(
      { west: 0, south: 0, east: 1, north: 1 }, Ellipsoid.WGS84, 4, 4,
    );
    for (let i = 0; i < mesh.indexCount; i++) {
      expect(mesh.indices[i]).toBeLessThan(mesh.vertexCount);
    }
  });
});
