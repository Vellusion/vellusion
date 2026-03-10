import { describe, it, expect } from 'vitest';
import { PolylineVolumeGeometry } from '../src/PolylineVolumeGeometry';
import { CoplanarPolygonGeometry } from '../src/CoplanarPolygonGeometry';
import { SimplePolylineGeometry } from '../src/SimplePolylineGeometry';
import { FrustumGeometry } from '../src/FrustumGeometry';
import type { Geometry } from '../src/Geometry';

/**
 * Helper: verify that a geometry has valid structure.
 */
function expectValidGeometry(geom: Geometry, expectedPrimType: string) {
  expect(geom.attributes.position).toBeDefined();
  expect(geom.attributes.position.values).toBeInstanceOf(Float32Array);
  expect(geom.attributes.position.componentsPerAttribute).toBe(3);
  expect(geom.primitiveType).toBe(expectedPrimType);
}

/**
 * Helper: verify that all indices are within bounds.
 */
function expectIndicesInBounds(geom: Geometry) {
  const vertexCount = geom.attributes.position.values.length / 3;
  expect(geom.indices).toBeDefined();
  const indices = geom.indices!;
  expect(indices.length).toBeGreaterThan(0);
  for (let i = 0; i < indices.length; i++) {
    expect(indices[i]).toBeLessThan(vertexCount);
  }
}

// ── PolylineVolumeGeometry ──────────────────────────────────────────

describe('PolylineVolumeGeometry', () => {
  it('should produce triangles with correct vertex count for 3-point path and square shape', () => {
    // 3-point path along X axis
    const positions = new Float64Array([
      0, 0, 0,
      5, 0, 0,
      10, 0, 0,
    ]);
    // Square cross-section (4 vertices)
    const shape = new Float32Array([
      -1, -1,
       1, -1,
       1,  1,
      -1,  1,
    ]);

    const geom = PolylineVolumeGeometry.create({ positions, shape });
    expectValidGeometry(geom, 'triangles');
    expectIndicesInBounds(geom);

    // 3 path points * 4 shape vertices = 12 vertices
    const vertexCount = geom.attributes.position.values.length / 3;
    expect(vertexCount).toBe(12);

    // 2 segments * 4 shape edges * 2 triangles * 3 indices = 48 indices
    expect(geom.indices!.length).toBe(48);
  });

  it('should produce normals', () => {
    const positions = new Float64Array([
      0, 0, 0,
      5, 0, 0,
    ]);
    const shape = new Float32Array([
      -1, -1,
       1, -1,
       1,  1,
      -1,  1,
    ]);
    const geom = PolylineVolumeGeometry.create({ positions, shape });
    expect(geom.attributes.normal).toBeDefined();
    expect(geom.attributes.normal!.values.length).toBe(geom.attributes.position.values.length);
  });

  it('should handle degenerate input gracefully', () => {
    // Single point path
    const geom = PolylineVolumeGeometry.create({
      positions: new Float64Array([0, 0, 0]),
      shape: new Float32Array([-1, -1, 1, -1, 1, 1, -1, 1]),
    });
    expect(geom.attributes.position.values.length).toBe(0);
    expect(geom.indices!.length).toBe(0);
  });
});

// ── CoplanarPolygonGeometry ─────────────────────────────────────────

describe('CoplanarPolygonGeometry', () => {
  it('should triangulate 4 coplanar points correctly', () => {
    // Square on the XY plane at z=5
    const positions = new Float64Array([
      0, 0, 5,
      4, 0, 5,
      4, 4, 5,
      0, 4, 5,
    ]);

    const geom = CoplanarPolygonGeometry.create({ positions });
    expectValidGeometry(geom, 'triangles');
    expectIndicesInBounds(geom);

    // 4 vertices => 2 triangles => 6 indices
    expect(geom.indices!.length).toBe(6);
    expect(geom.attributes.position.values.length / 3).toBe(4);
  });

  it('should handle 3D coplanar points not axis-aligned', () => {
    // Triangle on a tilted plane
    const positions = new Float64Array([
      1, 0, 0,
      0, 1, 0,
      0, 0, 1,
    ]);

    const geom = CoplanarPolygonGeometry.create({ positions });
    expectValidGeometry(geom, 'triangles');
    expect(geom.indices!.length).toBe(3);
  });

  it('should produce normals matching the plane', () => {
    const positions = new Float64Array([
      0, 0, 0,
      1, 0, 0,
      1, 1, 0,
      0, 1, 0,
    ]);

    const geom = CoplanarPolygonGeometry.create({ positions });
    expect(geom.attributes.normal).toBeDefined();
    const n = geom.attributes.normal!.values;
    // Normal should point along Z for XY-plane polygon
    for (let i = 0; i < n.length; i += 3) {
      expect(Math.abs(n[i])).toBeCloseTo(0, 5);
      expect(Math.abs(n[i + 1])).toBeCloseTo(0, 5);
      expect(Math.abs(n[i + 2])).toBeCloseTo(1, 5);
    }
  });

  it('should handle degenerate input gracefully', () => {
    const geom = CoplanarPolygonGeometry.create({
      positions: new Float64Array([0, 0, 0, 1, 0, 0]),
    });
    expect(geom.attributes.position.values.length).toBe(0);
  });
});

// ── SimplePolylineGeometry ──────────────────────────────────────────

describe('SimplePolylineGeometry', () => {
  it('should produce 4 indices (2 line segments) for 3 points', () => {
    const positions = new Float64Array([
      0, 0, 0,
      1, 0, 0,
      2, 1, 0,
    ]);

    const geom = SimplePolylineGeometry.create({ positions });
    expectValidGeometry(geom, 'lines');

    // 3 points => 2 segments => 4 indices
    expect(geom.indices!.length).toBe(4);
    expect(geom.primitiveType).toBe('lines');

    // Check indices form correct pairs
    const idx = geom.indices!;
    expect(idx[0]).toBe(0);
    expect(idx[1]).toBe(1);
    expect(idx[2]).toBe(1);
    expect(idx[3]).toBe(2);
  });

  it('should have color attribute when colors are provided', () => {
    const positions = new Float64Array([
      0, 0, 0,
      1, 0, 0,
      2, 1, 0,
    ]);
    const colors = new Float32Array([
      1, 0, 0, 1,  // red
      0, 1, 0, 1,  // green
      0, 0, 1, 1,  // blue
    ]);

    const geom = SimplePolylineGeometry.create({ positions, colors });
    expect(geom.attributes.color).toBeDefined();
    expect(geom.attributes.color!.componentsPerAttribute).toBe(4);
    expect(geom.attributes.color!.values.length).toBe(12);
  });

  it('should not have color attribute when colors are omitted', () => {
    const positions = new Float64Array([
      0, 0, 0,
      1, 0, 0,
    ]);

    const geom = SimplePolylineGeometry.create({ positions });
    expect(geom.attributes.color).toBeUndefined();
  });

  it('should handle single point gracefully', () => {
    const geom = SimplePolylineGeometry.create({
      positions: new Float64Array([1, 2, 3]),
    });
    expect(geom.attributes.position.values.length).toBe(0);
    expect(geom.indices!.length).toBe(0);
    expect(geom.primitiveType).toBe('lines');
  });
});

// ── FrustumGeometry ─────────────────────────────────────────────────

describe('FrustumGeometry', () => {
  it('should produce lines primitiveType with 24 indices (12 edges)', () => {
    const geom = FrustumGeometry.create({
      fov: Math.PI / 4,  // 45 degrees
      aspect: 16 / 9,
      near: 0.1,
      far: 100,
    });

    expectValidGeometry(geom, 'lines');
    expect(geom.primitiveType).toBe('lines');

    // 12 edges * 2 indices each = 24 indices
    expect(geom.indices!.length).toBe(24);

    // 8 corner vertices
    const vertexCount = geom.attributes.position.values.length / 3;
    expect(vertexCount).toBe(8);

    expectIndicesInBounds(geom);
  });

  it('should compute correct near-plane dimensions', () => {
    const fov = Math.PI / 2; // 90 degrees
    const aspect = 2;
    const near = 1;
    const far = 10;

    const geom = FrustumGeometry.create({ fov, aspect, near, far });
    const pos = geom.attributes.position.values;

    // At 90-degree FOV, half-height at near=1 should be tan(45deg)*1 = 1
    // half-width = 1 * 2 = 2
    // Vertex 0 is near top-left: (-2, 1, -1)
    expect(pos[0]).toBeCloseTo(-2, 5);   // x
    expect(pos[1]).toBeCloseTo(1, 5);    // y
    expect(pos[2]).toBeCloseTo(-1, 5);   // z
  });

  it('should place far plane at correct distance', () => {
    const geom = FrustumGeometry.create({
      fov: Math.PI / 4,
      aspect: 1,
      near: 0.5,
      far: 50,
    });
    const pos = geom.attributes.position.values;

    // Vertices 4-7 are far plane, z should be -50
    for (let i = 4; i < 8; i++) {
      expect(pos[i * 3 + 2]).toBeCloseTo(-50, 5);
    }
    // Vertices 0-3 are near plane, z should be -0.5
    for (let i = 0; i < 4; i++) {
      expect(pos[i * 3 + 2]).toBeCloseTo(-0.5, 5);
    }
  });
});
