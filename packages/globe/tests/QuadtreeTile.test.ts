import { describe, it, expect } from 'vitest';
import { Vec3 } from '@vellusion/math';
import { QuadtreeTile, TileState } from '../src/QuadtreeTile';

describe('QuadtreeTile', () => {
  it('createRootTiles returns 2 tiles at level 0', () => {
    const roots = QuadtreeTile.createRootTiles();
    expect(roots).toHaveLength(2);
    expect(roots[0].level).toBe(0);
    expect(roots[1].level).toBe(0);
    expect(roots[0].x).toBe(0);
    expect(roots[1].x).toBe(1);
    expect(roots[0].y).toBe(0);
    expect(roots[1].y).toBe(0);
  });

  it('computeExtent(0,0,0) covers [-PI..0, -PI/2..PI/2]', () => {
    const ext = QuadtreeTile.computeExtent(0, 0, 0);
    expect(ext.west).toBeCloseTo(-Math.PI, 10);
    expect(ext.east).toBeCloseTo(0, 10);
    expect(ext.south).toBeCloseTo(-Math.PI / 2, 10);
    expect(ext.north).toBeCloseTo(Math.PI / 2, 10);
  });

  it('computeExtent(1,0,0) covers [0..PI, -PI/2..PI/2]', () => {
    const ext = QuadtreeTile.computeExtent(1, 0, 0);
    expect(ext.west).toBeCloseTo(0, 10);
    expect(ext.east).toBeCloseTo(Math.PI, 10);
    expect(ext.south).toBeCloseTo(-Math.PI / 2, 10);
    expect(ext.north).toBeCloseTo(Math.PI / 2, 10);
  });

  it('subdivide creates 4 children', () => {
    const root = QuadtreeTile.createRootTiles()[0];
    const children = root.subdivide();
    expect(children).toHaveLength(4);
  });

  it('children extents tile the parent (no gaps, no overlap)', () => {
    const root = QuadtreeTile.createRootTiles()[0];
    const children = root.subdivide();
    const parentExt = root.extent;

    // Collect all child wests, easts, souths, norths
    const wests = children.map(c => c.extent.west).sort((a, b) => a - b);
    const easts = children.map(c => c.extent.east).sort((a, b) => a - b);
    const souths = children.map(c => c.extent.south).sort((a, b) => a - b);
    const norths = children.map(c => c.extent.north).sort((a, b) => a - b);

    // The minimum west of children should match parent west
    expect(Math.min(...wests)).toBeCloseTo(parentExt.west, 10);
    // The maximum east of children should match parent east
    expect(Math.max(...easts)).toBeCloseTo(parentExt.east, 10);
    // The minimum south of children should match parent south
    expect(Math.min(...souths)).toBeCloseTo(parentExt.south, 10);
    // The maximum north of children should match parent north
    expect(Math.max(...norths)).toBeCloseTo(parentExt.north, 10);

    // Check that the 4 children partition the parent into a 2x2 grid
    // Find the mid longitude and mid latitude
    const midLon = (parentExt.west + parentExt.east) / 2;
    const midLat = (parentExt.south + parentExt.north) / 2;

    // Each child should have extent boundaries at either the parent boundary or the midpoint
    for (const child of children) {
      const isLeftHalf = Math.abs(child.extent.west - parentExt.west) < 1e-10;
      const isRightHalf = Math.abs(child.extent.west - midLon) < 1e-10;
      expect(isLeftHalf || isRightHalf).toBe(true);

      const isBottomHalf = Math.abs(child.extent.south - parentExt.south) < 1e-10;
      const isTopHalf = Math.abs(child.extent.south - midLat) < 1e-10;
      expect(isBottomHalf || isTopHalf).toBe(true);

      if (isLeftHalf) {
        expect(child.extent.east).toBeCloseTo(midLon, 10);
      } else {
        expect(child.extent.east).toBeCloseTo(parentExt.east, 10);
      }

      if (isBottomHalf) {
        expect(child.extent.north).toBeCloseTo(midLat, 10);
      } else {
        expect(child.extent.north).toBeCloseTo(parentExt.north, 10);
      }
    }
  });

  it('children level = parent level + 1', () => {
    const root = QuadtreeTile.createRootTiles()[0];
    const children = root.subdivide();
    for (const child of children) {
      expect(child.level).toBe(root.level + 1);
    }
  });

  it('needsRefinement: true for very close camera', () => {
    const root = QuadtreeTile.createRootTiles()[0];
    // Place camera very close to the bounding sphere center
    const closeCamera = Vec3.clone(root.boundingSphere.center);
    // Move just slightly outside the sphere
    const offset = root.boundingSphere.radius + 1;
    closeCamera[0] += offset;

    // With a large sseDenominator, the SSE will be large -> needs refinement
    expect(root.needsRefinement(closeCamera, 1000, 2.0)).toBe(true);
  });

  it('needsRefinement: false for very far camera', () => {
    const root = QuadtreeTile.createRootTiles()[0];
    // Place camera very far from the tile
    const farCamera = Vec3.create(1e12, 1e12, 1e12);

    // At extreme distance, SSE should be tiny -> no refinement needed
    expect(root.needsRefinement(farCamera, 1, 2.0)).toBe(false);
  });

  it('tileKey format is "level/x/y"', () => {
    const tile = new QuadtreeTile(3, 5, 2, QuadtreeTile.computeExtent(3, 5, 2));
    expect(tile.tileKey).toBe('2/3/5');
  });

  it('state defaults to START', () => {
    const tile = QuadtreeTile.createRootTiles()[0];
    expect(tile.state).toBe(TileState.START);
  });

  it('subdivide called twice returns same children (idempotent)', () => {
    const root = QuadtreeTile.createRootTiles()[0];
    const first = root.subdivide();
    const second = root.subdivide();
    expect(first).toBe(second);
    expect(first).toHaveLength(4);
  });
});
