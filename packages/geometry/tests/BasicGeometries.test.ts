import { describe, it, expect } from 'vitest';
import { BoxGeometry } from '../src/BoxGeometry';
import { SphereGeometry } from '../src/SphereGeometry';
import { EllipsoidGeometry } from '../src/EllipsoidGeometry';
import { CylinderGeometry } from '../src/CylinderGeometry';
import { ConeGeometry } from '../src/ConeGeometry';
import { PlaneGeometry } from '../src/PlaneGeometry';
import type { Geometry } from '../src/Geometry';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function vertexCount(g: Geometry): number {
  return g.attributes.position.values.length / g.attributes.position.componentsPerAttribute;
}

function indexCount(g: Geometry): number {
  return g.indices?.length ?? 0;
}

/** Verify every index is within [0, vertexCount). */
function allIndicesValid(g: Geometry): boolean {
  const vc = vertexCount(g);
  if (!g.indices) return true;
  for (let i = 0; i < g.indices.length; i++) {
    if (g.indices[i] >= vc) return false;
  }
  return true;
}

/** Spot-check that the first `count` normals are unit length. */
function normalsAreUnit(g: Geometry, count: number): boolean {
  const n = g.attributes.normal;
  if (!n) return false;
  const check = Math.min(count, n.values.length / 3);
  for (let i = 0; i < check; i++) {
    const x = n.values[i * 3];
    const y = n.values[i * 3 + 1];
    const z = n.values[i * 3 + 2];
    const len = Math.sqrt(x * x + y * y + z * z);
    if (Math.abs(len - 1) > 1e-5) return false;
  }
  return true;
}

/** Verify all UVs are in [0, 1]. */
function uvsInRange(g: Geometry): boolean {
  const st = g.attributes.st;
  if (!st) return false;
  for (let i = 0; i < st.values.length; i++) {
    if (st.values[i] < -1e-6 || st.values[i] > 1 + 1e-6) return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// BoxGeometry
// ---------------------------------------------------------------------------

describe('BoxGeometry', () => {
  it('should produce correct vertex and index counts', () => {
    const g = BoxGeometry.create();
    expect(vertexCount(g)).toBe(24); // 6 faces * 4 verts
    expect(indexCount(g)).toBe(36);  // 6 faces * 6 indices
  });

  it('should have all indices < vertexCount', () => {
    const g = BoxGeometry.create({ width: 2, height: 3, depth: 4 });
    expect(allIndicesValid(g)).toBe(true);
  });

  it('should have unit normals and valid UVs', () => {
    const g = BoxGeometry.create();
    expect(normalsAreUnit(g, 24)).toBe(true);
    expect(uvsInRange(g)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// SphereGeometry
// ---------------------------------------------------------------------------

describe('SphereGeometry', () => {
  const stacks = 16;
  const slices = 32;

  it('should produce correct vertex and index counts', () => {
    const g = SphereGeometry.create();
    expect(vertexCount(g)).toBe((stacks + 1) * (slices + 1));
    expect(indexCount(g)).toBe(stacks * slices * 6);
  });

  it('should have all indices < vertexCount', () => {
    const g = SphereGeometry.create({ radius: 5, stackCount: 8, sliceCount: 16 });
    expect(allIndicesValid(g)).toBe(true);
  });

  it('should have unit normals and valid UVs', () => {
    const g = SphereGeometry.create();
    expect(normalsAreUnit(g, 20)).toBe(true);
    expect(uvsInRange(g)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// EllipsoidGeometry
// ---------------------------------------------------------------------------

describe('EllipsoidGeometry', () => {
  const stacks = 16;
  const slices = 32;

  it('should produce correct vertex and index counts', () => {
    const g = EllipsoidGeometry.create();
    expect(vertexCount(g)).toBe((stacks + 1) * (slices + 1));
    expect(indexCount(g)).toBe(stacks * slices * 6);
  });

  it('should have all indices < vertexCount', () => {
    const g = EllipsoidGeometry.create({ radii: [2, 3, 4] });
    expect(allIndicesValid(g)).toBe(true);
  });

  it('should have unit normals and valid UVs', () => {
    const g = EllipsoidGeometry.create({ radii: [1, 2, 3] });
    expect(normalsAreUnit(g, 20)).toBe(true);
    expect(uvsInRange(g)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// CylinderGeometry
// ---------------------------------------------------------------------------

describe('CylinderGeometry', () => {
  const slices = 32;

  it('should produce correct vertex and index counts', () => {
    const g = CylinderGeometry.create();
    // Side: 2*(slices+1) = 66
    // Top cap: slices+2 = 34
    // Bottom cap: slices+2 = 34
    const expectedVerts = 2 * (slices + 1) + (slices + 2) + (slices + 2);
    // Side: slices*6 = 192
    // Top cap: slices*3 = 96
    // Bottom cap: slices*3 = 96
    const expectedIndices = slices * 6 + slices * 3 + slices * 3;

    expect(vertexCount(g)).toBe(expectedVerts);
    expect(indexCount(g)).toBe(expectedIndices);
  });

  it('should have all indices < vertexCount', () => {
    const g = CylinderGeometry.create({ topRadius: 0.5, bottomRadius: 2, height: 3 });
    expect(allIndicesValid(g)).toBe(true);
  });

  it('should have unit normals and valid UVs', () => {
    const g = CylinderGeometry.create();
    expect(normalsAreUnit(g, 20)).toBe(true);
    expect(uvsInRange(g)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// ConeGeometry
// ---------------------------------------------------------------------------

describe('ConeGeometry', () => {
  const slices = 32;

  it('should produce correct vertex and index counts', () => {
    const g = ConeGeometry.create();
    // topRadius=0 => no top cap
    // Side: 2*(slices+1) = 66
    // Bottom cap: slices+2 = 34
    const expectedVerts = 2 * (slices + 1) + (slices + 2);
    // Side: slices*6 = 192
    // Bottom cap: slices*3 = 96
    const expectedIndices = slices * 6 + slices * 3;

    expect(vertexCount(g)).toBe(expectedVerts);
    expect(indexCount(g)).toBe(expectedIndices);
  });

  it('should have all indices < vertexCount', () => {
    const g = ConeGeometry.create({ radius: 2, height: 5, sliceCount: 16 });
    expect(allIndicesValid(g)).toBe(true);
  });

  it('should have unit normals and valid UVs', () => {
    const g = ConeGeometry.create();
    expect(normalsAreUnit(g, 20)).toBe(true);
    expect(uvsInRange(g)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// PlaneGeometry
// ---------------------------------------------------------------------------

describe('PlaneGeometry', () => {
  it('should produce correct vertex and index counts', () => {
    const g = PlaneGeometry.create();
    expect(vertexCount(g)).toBe(4);
    expect(indexCount(g)).toBe(6);
  });

  it('should have all indices < vertexCount', () => {
    const g = PlaneGeometry.create({ width: 10, height: 5 });
    expect(allIndicesValid(g)).toBe(true);
  });

  it('should have unit normals and valid UVs', () => {
    const g = PlaneGeometry.create();
    expect(normalsAreUnit(g, 4)).toBe(true);
    expect(uvsInRange(g)).toBe(true);
  });
});
