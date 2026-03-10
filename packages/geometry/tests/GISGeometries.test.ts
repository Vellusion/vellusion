import { describe, it, expect } from 'vitest';
import { PolygonGeometry } from '../src/PolygonGeometry';
import { PolylineGeometry } from '../src/PolylineGeometry';
import { EllipseGeometry } from '../src/EllipseGeometry';
import { RectangleGeometry } from '../src/RectangleGeometry';
import { WallGeometry } from '../src/WallGeometry';
import { CorridorGeometry } from '../src/CorridorGeometry';
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

// ── PolygonGeometry ─────────────────────────────────────────────────

describe('PolygonGeometry', () => {
  it('should return a valid triangles Geometry', () => {
    // Triangle in XY plane
    const positions = new Float64Array([
      0, 0, 0,
      1, 0, 0,
      0.5, 1, 0,
    ]);
    const geom = PolygonGeometry.create({ positions });
    expectValidGeometry(geom, 'triangles');
    expectIndicesInBounds(geom);
  });

  it('should produce exactly 3 indices for a triangle', () => {
    const positions = new Float64Array([
      0, 0, 0,
      1, 0, 0,
      0.5, 1, 0,
    ]);
    const geom = PolygonGeometry.create({ positions });
    expect(geom.indices!.length).toBe(3);
  });

  it('should triangulate a quad (4 vertices) into 2 triangles', () => {
    const positions = new Float64Array([
      0, 0, 0,
      1, 0, 0,
      1, 1, 0,
      0, 1, 0,
    ]);
    const geom = PolygonGeometry.create({ positions });
    expectValidGeometry(geom, 'triangles');
    // A quad should produce 2 triangles = 6 indices
    expect(geom.indices!.length).toBe(6);
    expectIndicesInBounds(geom);
  });

  it('should generate normals', () => {
    const positions = new Float64Array([
      0, 0, 0,
      1, 0, 0,
      0.5, 1, 0,
    ]);
    const geom = PolygonGeometry.create({ positions });
    expect(geom.attributes.normal).toBeDefined();
    expect(geom.attributes.normal!.values.length).toBe(geom.attributes.position.values.length);
  });

  it('should handle extruded polygon', () => {
    const positions = new Float64Array([
      0, 0, 0,
      1, 0, 0,
      0.5, 1, 0,
    ]);
    const geom = PolygonGeometry.create({ positions, extrudedHeight: 5 });
    expectValidGeometry(geom, 'triangles');
    expectIndicesInBounds(geom);
    // Should have more vertices than flat polygon (top + bottom + walls)
    const vertexCount = geom.attributes.position.values.length / 3;
    expect(vertexCount).toBeGreaterThan(3);
    expect(geom.indices!.length).toBeGreaterThan(6);
  });

  it('should handle a concave L-shaped polygon', () => {
    // L-shape (concave)
    const positions = new Float64Array([
      0, 0, 0,
      2, 0, 0,
      2, 1, 0,
      1, 1, 0,
      1, 2, 0,
      0, 2, 0,
    ]);
    const geom = PolygonGeometry.create({ positions });
    expectValidGeometry(geom, 'triangles');
    // 6 vertices -> 4 triangles = 12 indices
    expect(geom.indices!.length).toBe(12);
    expectIndicesInBounds(geom);
  });
});

// ── PolylineGeometry ────────────────────────────────────────────────

describe('PolylineGeometry', () => {
  it('should return a valid triangles Geometry', () => {
    const positions = new Float64Array([
      0, 0, 0,
      1, 0, 0,
    ]);
    const geom = PolylineGeometry.create({ positions });
    expectValidGeometry(geom, 'triangles');
    expectIndicesInBounds(geom);
  });

  it('should produce ribbon vertices for 2 points', () => {
    const positions = new Float64Array([
      0, 0, 0,
      1, 0, 0,
    ]);
    const geom = PolylineGeometry.create({ positions, width: 2.0 });
    // 1 segment => 4 vertices
    const vertexCount = geom.attributes.position.values.length / 3;
    expect(vertexCount).toBe(4);
    // 1 segment => 6 indices
    expect(geom.indices!.length).toBe(6);
  });

  it('should produce correct count for multi-segment polyline', () => {
    const positions = new Float64Array([
      0, 0, 0,
      1, 0, 0,
      2, 1, 0,
      3, 1, 0,
    ]);
    const geom = PolylineGeometry.create({ positions, width: 1.0 });
    // 3 segments => 12 vertices, 18 indices
    const vertexCount = geom.attributes.position.values.length / 3;
    expect(vertexCount).toBe(12);
    expect(geom.indices!.length).toBe(18);
    expectIndicesInBounds(geom);
  });

  it('should handle empty / single point gracefully', () => {
    const geom = PolylineGeometry.create({ positions: new Float64Array([1, 2, 3]) });
    expect(geom.attributes.position.values.length).toBe(0);
    expect(geom.indices!.length).toBe(0);
  });

  it('should produce normals', () => {
    const positions = new Float64Array([
      0, 0, 0,
      1, 0, 0,
    ]);
    const geom = PolylineGeometry.create({ positions });
    expect(geom.attributes.normal).toBeDefined();
    expect(geom.attributes.normal!.values.length).toBe(geom.attributes.position.values.length);
  });
});

// ── EllipseGeometry ─────────────────────────────────────────────────

describe('EllipseGeometry', () => {
  it('should return a valid triangles Geometry', () => {
    const center = new Float64Array([0, 0, 6378137]);
    const geom = EllipseGeometry.create({
      center,
      semiMajorAxis: 100,
      semiMinorAxis: 50,
    });
    expectValidGeometry(geom, 'triangles');
    expectIndicesInBounds(geom);
  });

  it('should produce a closed disc (center + boundary)', () => {
    const center = new Float64Array([6378137, 0, 0]);
    const geom = EllipseGeometry.create({
      center,
      semiMajorAxis: 1000,
      semiMinorAxis: 500,
      granularity: Math.PI / 4, // 8 segments around
    });
    // 8 boundary points + 1 center = 9 vertices
    const vertexCount = geom.attributes.position.values.length / 3;
    expect(vertexCount).toBe(9);
    // 8 fan triangles => 24 indices
    expect(geom.indices!.length).toBe(24);
    expectIndicesInBounds(geom);
  });

  it('should handle rotation', () => {
    const center = new Float64Array([6378137, 0, 0]);
    const geom = EllipseGeometry.create({
      center,
      semiMajorAxis: 100,
      semiMinorAxis: 100,
      rotation: Math.PI / 4,
    });
    expectValidGeometry(geom, 'triangles');
    expect(geom.indices!.length).toBeGreaterThan(0);
  });

  it('should produce normals', () => {
    const center = new Float64Array([0, 0, 6378137]);
    const geom = EllipseGeometry.create({
      center,
      semiMajorAxis: 100,
      semiMinorAxis: 100,
    });
    expect(geom.attributes.normal).toBeDefined();
    expect(geom.attributes.normal!.values.length).toBe(geom.attributes.position.values.length);
  });
});

// ── RectangleGeometry ───────────────────────────────────────────────

describe('RectangleGeometry', () => {
  const west = -0.01;
  const south = -0.01;
  const east = 0.01;
  const north = 0.01;

  it('should return a valid triangles Geometry', () => {
    const geom = RectangleGeometry.create({ west, south, east, north });
    expectValidGeometry(geom, 'triangles');
    expectIndicesInBounds(geom);
  });

  it('should produce subdivided grid', () => {
    // With granularity just large enough to produce 1 subdivision step
    const granularity = 0.02; // larger than the range so 1 step
    const geom = RectangleGeometry.create({ west, south, east, north, granularity });
    // 1 step each direction => 2x2 = 4 vertices, 1 quad = 2 triangles = 6 indices
    const vertexCount = geom.attributes.position.values.length / 3;
    expect(vertexCount).toBe(4);
    expect(geom.indices!.length).toBe(6);
    expectIndicesInBounds(geom);
  });

  it('should include texture coordinates', () => {
    const geom = RectangleGeometry.create({ west, south, east, north });
    expect(geom.attributes.st).toBeDefined();
    expect(geom.attributes.st!.componentsPerAttribute).toBe(2);
    const stLen = geom.attributes.st!.values.length;
    const vertexCount = geom.attributes.position.values.length / 3;
    expect(stLen).toBe(vertexCount * 2);
  });

  it('should have normals pointing outward from earth', () => {
    const geom = RectangleGeometry.create({ west, south, east, north });
    expect(geom.attributes.normal).toBeDefined();
    // Normals should be unit-ish vectors
    const n = geom.attributes.normal!.values;
    for (let i = 0; i < n.length; i += 3) {
      const mag = Math.sqrt(n[i] * n[i] + n[i + 1] * n[i + 1] + n[i + 2] * n[i + 2]);
      expect(mag).toBeCloseTo(1.0, 3);
    }
  });
});

// ── WallGeometry ────────────────────────────────────────────────────

describe('WallGeometry', () => {
  it('should return a valid triangles Geometry', () => {
    const positions = new Float64Array([
      6378137, 0, 0,
      6378237, 100, 0,
    ]);
    const geom = WallGeometry.create({
      positions,
      maximumHeights: [100, 100],
    });
    expectValidGeometry(geom, 'triangles');
    expectIndicesInBounds(geom);
  });

  it('should produce vertical quads: 4 vertices and 6 indices per segment', () => {
    const positions = new Float64Array([
      6378137, 0, 0,
      6378237, 100, 0,
    ]);
    const geom = WallGeometry.create({
      positions,
      maximumHeights: [50, 50],
      minimumHeights: [0, 0],
    });
    const vertexCount = geom.attributes.position.values.length / 3;
    expect(vertexCount).toBe(4);
    expect(geom.indices!.length).toBe(6);
  });

  it('should produce correct count for multi-segment wall', () => {
    const positions = new Float64Array([
      6378137, 0, 0,
      6378237, 100, 0,
      6378337, 200, 0,
    ]);
    const geom = WallGeometry.create({
      positions,
      maximumHeights: [100, 100, 100],
      minimumHeights: [0, 0, 0],
    });
    // 2 segments => 8 vertices, 12 indices
    const vertexCount = geom.attributes.position.values.length / 3;
    expect(vertexCount).toBe(8);
    expect(geom.indices!.length).toBe(12);
    expectIndicesInBounds(geom);
  });

  it('should default minimum heights to 0', () => {
    const positions = new Float64Array([
      6378137, 0, 0,
      6378237, 100, 0,
    ]);
    const geom = WallGeometry.create({ positions });
    expectValidGeometry(geom, 'triangles');
    // Without max heights, top = base position, bottom = base position (heights default to 0)
    const vertexCount = geom.attributes.position.values.length / 3;
    expect(vertexCount).toBe(4);
  });

  it('should handle single point gracefully', () => {
    const geom = WallGeometry.create({
      positions: new Float64Array([1, 2, 3]),
    });
    expect(geom.attributes.position.values.length).toBe(0);
  });

  it('should produce normals', () => {
    const positions = new Float64Array([
      6378137, 0, 0,
      6378237, 100, 0,
    ]);
    const geom = WallGeometry.create({
      positions,
      maximumHeights: [100, 100],
    });
    expect(geom.attributes.normal).toBeDefined();
    expect(geom.attributes.normal!.values.length).toBe(geom.attributes.position.values.length);
  });
});

// ── CorridorGeometry ────────────────────────────────────────────────

describe('CorridorGeometry', () => {
  it('should return a valid triangles Geometry', () => {
    const positions = new Float64Array([
      6378137, 0, 0,
      6378237, 100, 0,
    ]);
    const geom = CorridorGeometry.create({ positions, width: 10 });
    expectValidGeometry(geom, 'triangles');
    expectIndicesInBounds(geom);
  });

  it('should produce 2*N vertices for N center-line points', () => {
    const positions = new Float64Array([
      6378137, 0, 0,
      6378237, 100, 0,
      6378337, 200, 0,
    ]);
    const geom = CorridorGeometry.create({ positions, width: 20 });
    // 3 points => 6 vertices (left + right per point)
    const vertexCount = geom.attributes.position.values.length / 3;
    expect(vertexCount).toBe(6);
    // 2 segments => 12 indices
    expect(geom.indices!.length).toBe(12);
    expectIndicesInBounds(geom);
  });

  it('should include texture coordinates', () => {
    const positions = new Float64Array([
      6378137, 0, 0,
      6378237, 100, 0,
    ]);
    const geom = CorridorGeometry.create({ positions, width: 10 });
    expect(geom.attributes.st).toBeDefined();
    expect(geom.attributes.st!.componentsPerAttribute).toBe(2);
    const vertexCount = geom.attributes.position.values.length / 3;
    expect(geom.attributes.st!.values.length).toBe(vertexCount * 2);
  });

  it('should handle single point gracefully', () => {
    const geom = CorridorGeometry.create({
      positions: new Float64Array([1, 2, 3]),
      width: 10,
    });
    expect(geom.attributes.position.values.length).toBe(0);
  });

  it('should produce normals', () => {
    const positions = new Float64Array([
      6378137, 0, 0,
      6378237, 100, 0,
    ]);
    const geom = CorridorGeometry.create({ positions, width: 10 });
    expect(geom.attributes.normal).toBeDefined();
    expect(geom.attributes.normal!.values.length).toBe(geom.attributes.position.values.length);
  });
});
