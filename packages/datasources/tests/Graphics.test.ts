import { describe, it, expect } from 'vitest';
import {
  BillboardGraphics,
  BoxGraphics,
  CorridorGraphics,
  CylinderGraphics,
  EllipseGraphics,
  EllipsoidGraphics,
  LabelGraphics,
  ModelGraphics,
  PathGraphics,
  PlaneGraphics,
  PointGraphics,
  PolygonGraphics,
  PolylineGraphics,
  PolylineVolumeGraphics,
  RectangleGraphics,
  WallGraphics,
} from '../src/graphics';

describe('Graphics', () => {
  // ── BillboardGraphics ──────────────────────────────────────

  describe('BillboardGraphics', () => {
    it('should store image', () => {
      const g = new BillboardGraphics({ image: 'marker.png' });
      expect(g.image).toBe('marker.png');
    });

    it('should have defaults: width=32, height=32, scale=1, show=true', () => {
      const g = new BillboardGraphics();
      expect(g.width).toBe(32);
      expect(g.height).toBe(32);
      expect(g.scale).toBe(1);
      expect(g.rotation).toBe(0);
      expect(g.show).toBe(true);
      expect(g.image).toBeUndefined();
      expect(g.color).toBeUndefined();
    });

    it('should accept custom options', () => {
      const g = new BillboardGraphics({
        image: 'icon.png',
        width: 64,
        height: 48,
        color: [1, 0, 0, 1],
        scale: 2,
        rotation: Math.PI / 4,
        show: false,
      });
      expect(g.width).toBe(64);
      expect(g.height).toBe(48);
      expect(g.color).toEqual([1, 0, 0, 1]);
      expect(g.scale).toBe(2);
      expect(g.rotation).toBe(Math.PI / 4);
      expect(g.show).toBe(false);
    });
  });

  // ── BoxGraphics ────────────────────────────────────────────

  describe('BoxGraphics', () => {
    it('should store dimensions', () => {
      const g = new BoxGraphics({ dimensions: [2, 3, 4] });
      expect(g.dimensions).toEqual([2, 3, 4]);
    });

    it('should default dimensions to [1,1,1]', () => {
      const g = new BoxGraphics();
      expect(g.dimensions).toEqual([1, 1, 1]);
      expect(g.fill).toBe(true);
      expect(g.outline).toBe(false);
    });
  });

  // ── PointGraphics ──────────────────────────────────────────

  describe('PointGraphics', () => {
    it('should default pixelSize=4', () => {
      const g = new PointGraphics();
      expect(g.pixelSize).toBe(4);
      expect(g.show).toBe(true);
      expect(g.outlineWidth).toBe(0);
    });

    it('should accept color', () => {
      const g = new PointGraphics({ color: [0, 1, 0, 1], pixelSize: 8 });
      expect(g.color).toEqual([0, 1, 0, 1]);
      expect(g.pixelSize).toBe(8);
    });
  });

  // ── PolygonGraphics ────────────────────────────────────────

  describe('PolygonGraphics', () => {
    it('should store positions', () => {
      const positions = [0, 0, 0, 1, 0, 0, 1, 1, 0];
      const g = new PolygonGraphics({ positions });
      expect(g.positions).toEqual(positions);
    });

    it('should default to empty positions and fill=true', () => {
      const g = new PolygonGraphics();
      expect(g.positions).toEqual([]);
      expect(g.fill).toBe(true);
      expect(g.outline).toBe(false);
      expect(g.height).toBe(0);
    });
  });

  // ── PolylineGraphics ──────────────────────────────────────

  describe('PolylineGraphics', () => {
    it('should store positions and default width=1', () => {
      const positions = [0, 0, 0, 1, 1, 0];
      const g = new PolylineGraphics({ positions });
      expect(g.positions).toEqual(positions);
      expect(g.width).toBe(1);
      expect(g.clampToGround).toBe(false);
    });

    it('should accept custom width', () => {
      const g = new PolylineGraphics({ width: 5, clampToGround: true });
      expect(g.width).toBe(5);
      expect(g.clampToGround).toBe(true);
    });
  });

  // ── LabelGraphics ─────────────────────────────────────────

  describe('LabelGraphics', () => {
    it('should store text', () => {
      const g = new LabelGraphics({ text: 'Hello' });
      expect(g.text).toBe('Hello');
    });

    it('should have default font', () => {
      const g = new LabelGraphics();
      expect(g.text).toBe('');
      expect(g.font).toBe('16px sans-serif');
      expect(g.scale).toBe(1);
      expect(g.show).toBe(true);
    });
  });

  // ── ModelGraphics ──────────────────────────────────────────

  describe('ModelGraphics', () => {
    it('should store uri', () => {
      const g = new ModelGraphics({ uri: 'model.glb' });
      expect(g.uri).toBe('model.glb');
    });

    it('should have default scale=1', () => {
      const g = new ModelGraphics();
      expect(g.uri).toBe('');
      expect(g.scale).toBe(1);
      expect(g.show).toBe(true);
      expect(g.silhouetteSize).toBe(0);
    });
  });

  // ── All 16 types instantiate without error ─────────────────

  describe('All 16 graphics types', () => {
    const classes = [
      BillboardGraphics,
      BoxGraphics,
      CorridorGraphics,
      CylinderGraphics,
      EllipseGraphics,
      EllipsoidGraphics,
      LabelGraphics,
      ModelGraphics,
      PathGraphics,
      PlaneGraphics,
      PointGraphics,
      PolygonGraphics,
      PolylineGraphics,
      PolylineVolumeGraphics,
      RectangleGraphics,
      WallGraphics,
    ];

    it('should all be exactly 16 types', () => {
      expect(classes.length).toBe(16);
    });

    it.each(classes.map((C) => [C.name, C]))(
      '%s instantiates without error',
      (_name, GraphicsClass) => {
        const instance = new (GraphicsClass as new () => unknown)();
        expect(instance).toBeDefined();
      },
    );
  });

  // ── Custom options override defaults ───────────────────────

  describe('Custom options override defaults', () => {
    it('CylinderGraphics overrides', () => {
      const g = new CylinderGraphics({
        topRadius: 5,
        bottomRadius: 10,
        length: 20,
        slices: 64,
        show: false,
      });
      expect(g.topRadius).toBe(5);
      expect(g.bottomRadius).toBe(10);
      expect(g.length).toBe(20);
      expect(g.slices).toBe(64);
      expect(g.show).toBe(false);
    });

    it('EllipseGraphics overrides', () => {
      const g = new EllipseGraphics({
        semiMajorAxis: 100,
        semiMinorAxis: 50,
        rotation: 1.5,
        extrudedHeight: 500,
      });
      expect(g.semiMajorAxis).toBe(100);
      expect(g.semiMinorAxis).toBe(50);
      expect(g.rotation).toBe(1.5);
      expect(g.extrudedHeight).toBe(500);
    });

    it('EllipsoidGraphics overrides', () => {
      const g = new EllipsoidGraphics({
        radii: [10, 20, 30],
        slicePartitions: 64,
        stackPartitions: 32,
      });
      expect(g.radii).toEqual([10, 20, 30]);
      expect(g.slicePartitions).toBe(64);
      expect(g.stackPartitions).toBe(32);
    });

    it('RectangleGraphics overrides', () => {
      const g = new RectangleGraphics({
        coordinates: { west: -1, south: -1, east: 1, north: 1 },
        rotation: 0.5,
        extrudedHeight: 100,
      });
      expect(g.coordinates).toEqual({ west: -1, south: -1, east: 1, north: 1 });
      expect(g.rotation).toBe(0.5);
      expect(g.extrudedHeight).toBe(100);
    });

    it('WallGraphics overrides', () => {
      const g = new WallGraphics({
        positions: [0, 0, 0, 1, 0, 0],
        maximumHeights: [100, 200],
        minimumHeights: [0, 0],
      });
      expect(g.positions).toEqual([0, 0, 0, 1, 0, 0]);
      expect(g.maximumHeights).toEqual([100, 200]);
      expect(g.minimumHeights).toEqual([0, 0]);
    });
  });
});
