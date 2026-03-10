import { describe, it, expect, vi } from 'vitest';
import { Ellipsoid } from '@vellusion/math';
import { Globe } from '../src/Globe';
import { GlobeRenderer } from '../src/GlobeRenderer';
import { QuadtreePrimitive } from '../src/QuadtreePrimitive';
import { ImageryLayerCollection } from '../src/ImageryLayerCollection';
import { EllipsoidTerrainProvider } from '../src/TerrainProvider';
import type { TerrainProvider, TerrainTilingScheme } from '../src/TerrainProvider';
import type { GPUContext } from '@vellusion/core';
import type { TileMeshData, GeographicExtent } from '../src/TileMesh';

// ---------------------------------------------------------------------------
// Globe tests
// ---------------------------------------------------------------------------

describe('Globe', () => {
  it('constructor creates quadtree', () => {
    const globe = new Globe();
    expect(globe.quadtree).toBeInstanceOf(QuadtreePrimitive);
  });

  it('default ellipsoid is WGS84', () => {
    const globe = new Globe();
    expect(globe.ellipsoid).toBe(Ellipsoid.WGS84);
  });

  it('default terrain is EllipsoidTerrainProvider', () => {
    const globe = new Globe();
    expect(globe.terrainProvider).toBeInstanceOf(EllipsoidTerrainProvider);
  });

  it('imageryLayers is an ImageryLayerCollection', () => {
    const globe = new Globe();
    expect(globe.imageryLayers).toBeInstanceOf(ImageryLayerCollection);
  });

  it('show defaults to true', () => {
    const globe = new Globe();
    expect(globe.show).toBe(true);
  });

  it('depthTestAgainstTerrain defaults to false', () => {
    const globe = new Globe();
    expect(globe.depthTestAgainstTerrain).toBe(false);
  });

  it('custom terrain provider is used', () => {
    const mockTilingScheme: TerrainTilingScheme = {
      numberOfXTilesAtLevel: () => 1,
      numberOfYTilesAtLevel: () => 1,
      tileXYToExtent: () => ({ west: 0, south: 0, east: 1, north: 1 }),
    };
    const customProvider: TerrainProvider = {
      ready: true,
      tilingScheme: mockTilingScheme,
      requestTileGeometry: async () => ({
        positions: new Float64Array(0),
        normals: new Float32Array(0),
        uvs: new Float32Array(0),
        indices: new Uint16Array(0),
        vertexCount: 0,
        indexCount: 0,
      }),
      getLevelMaximumGeometricError: () => 1,
    };
    const globe = new Globe({ terrainProvider: customProvider });
    expect(globe.terrainProvider).toBe(customProvider);
  });
});

// ---------------------------------------------------------------------------
// GlobeRenderer tests (mock-based)
// ---------------------------------------------------------------------------

describe('GlobeRenderer', () => {
  function createMockGPUContext() {
    const mockBuffer = {
      getMappedRange: vi.fn(() => new ArrayBuffer(1024)),
      unmap: vi.fn(),
      destroy: vi.fn(),
    };
    const mockBindGroup = {};
    const mockBindGroupLayout = {};
    const mockShaderModule = {};
    const mockPipeline = {
      getBindGroupLayout: vi.fn(() => mockBindGroupLayout),
    };

    const mockGPUContext = {
      device: {
        createBuffer: vi.fn(() => mockBuffer),
        createBindGroup: vi.fn(() => mockBindGroup),
        createShaderModule: vi.fn(() => mockShaderModule),
        createRenderPipeline: vi.fn(() => mockPipeline),
        queue: {
          submit: vi.fn(),
          writeBuffer: vi.fn(),
        },
      },
      format: 'bgra8unorm',
      width: 800,
      height: 600,
    } as unknown as GPUContext;

    return { mockGPUContext, mockBuffer };
  }

  function createGlobe(): Globe {
    return new Globe();
  }

  it('update calls quadtree.update when show=true', () => {
    const { mockGPUContext } = createMockGPUContext();
    const globe = createGlobe();
    const renderer = new GlobeRenderer(mockGPUContext, globe);

    const updateSpy = vi.spyOn(globe.quadtree, 'update');
    const cameraPos = new Float64Array([0, 0, 20000000]);
    renderer.update(cameraPos, 600, Math.PI / 4);

    expect(updateSpy).toHaveBeenCalledWith(cameraPos, 600, Math.PI / 4);
  });

  it('update does nothing when show=false', () => {
    const { mockGPUContext } = createMockGPUContext();
    const globe = createGlobe();
    globe.show = false;
    const renderer = new GlobeRenderer(mockGPUContext, globe);

    const updateSpy = vi.spyOn(globe.quadtree, 'update');
    renderer.update(new Float64Array([0, 0, 20000000]), 600, Math.PI / 4);

    expect(updateSpy).not.toHaveBeenCalled();
  });

  it('render does nothing without pipeline', () => {
    const { mockGPUContext } = createMockGPUContext();
    const globe = createGlobe();
    const renderer = new GlobeRenderer(mockGPUContext, globe);

    const mockPassEncoder = {
      setPipeline: vi.fn(),
      setBindGroup: vi.fn(),
      setVertexBuffer: vi.fn(),
      setIndexBuffer: vi.fn(),
      drawIndexed: vi.fn(),
    } as unknown as GPURenderPassEncoder;

    const viewProjection = new Float64Array(16);

    // Should not throw, just do nothing
    renderer.render(mockPassEncoder, viewProjection);

    expect(mockPassEncoder.setPipeline).not.toHaveBeenCalled();
  });

  it('destroy cleans up GPU resources', () => {
    const { mockGPUContext, mockBuffer } = createMockGPUContext();
    const globe = createGlobe();
    const renderer = new GlobeRenderer(mockGPUContext, globe);

    renderer.destroy();

    // After destroy, internal map should be cleared (no error thrown)
    // Since no tiles were loaded, no buffers to destroy, but method should succeed
    expect(() => renderer.destroy()).not.toThrow();
  });
});
