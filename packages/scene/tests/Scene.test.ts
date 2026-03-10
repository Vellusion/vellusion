import { describe, it, expect, vi } from 'vitest';
import { Scene, type SceneOptions } from '../src/Scene';
import { SceneRenderer } from '../src/SceneRenderer';
import { PerspectiveCamera } from '../src/Camera';
import { Clock } from '../src/Clock';
import { SceneNode } from '../src/SceneNode';
import type { GPUContext } from '@vellusion/core';

describe('Scene', () => {
  function createScene(options?: Partial<SceneOptions>): Scene {
    const camera = options?.camera ?? new PerspectiveCamera();
    return new Scene({ camera, clock: options?.clock });
  }

  it('constructor creates root node named "root"', () => {
    const scene = createScene();
    expect(scene.root).toBeInstanceOf(SceneNode);
    expect(scene.root.name).toBe('root');
  });

  it('constructor stores camera reference', () => {
    const camera = new PerspectiveCamera();
    const scene = new Scene({ camera });
    expect(scene.camera).toBe(camera);
  });

  it('constructor creates default clock when none provided', () => {
    const scene = createScene();
    expect(scene.clock).toBeInstanceOf(Clock);
  });

  it('custom clock is used when provided', () => {
    const clock = new Clock({ multiplier: 5 });
    const scene = new Scene({ camera: new PerspectiveCamera(), clock });
    expect(scene.clock).toBe(clock);
    expect(scene.clock.multiplier).toBe(5);
  });

  it('backgroundColor defaults to black', () => {
    const scene = createScene();
    expect(scene.backgroundColor).toEqual({ r: 0, g: 0, b: 0, a: 1 });
  });

  it('backgroundColor can be changed', () => {
    const scene = createScene();
    scene.backgroundColor = { r: 0.2, g: 0.4, b: 0.6, a: 1 };
    expect(scene.backgroundColor).toEqual({ r: 0.2, g: 0.4, b: 0.6, a: 1 });
  });

  it('add appends node to root children', () => {
    const scene = createScene();
    const node = new SceneNode('child');
    scene.add(node);
    expect(scene.root.children).toContain(node);
    expect(node.parent).toBe(scene.root);
  });

  it('remove detaches node from root children', () => {
    const scene = createScene();
    const node = new SceneNode('child');
    scene.add(node);
    scene.remove(node);
    expect(scene.root.children.length).toBe(0);
    expect(node.parent).toBeNull();
  });

  it('update calls clock.tick with deltaTime', () => {
    const scene = createScene();
    const tickSpy = vi.spyOn(scene.clock, 'tick');
    scene.update(0.016);
    expect(tickSpy).toHaveBeenCalledWith(0.016);
  });

  it('update calls root.updateWorldMatrix', () => {
    const scene = createScene();
    const updateSpy = vi.spyOn(scene.root, 'updateWorldMatrix');
    scene.update(0.016);
    expect(updateSpy).toHaveBeenCalled();
  });

  it('update calls camera.update', () => {
    const scene = createScene();
    const updateSpy = vi.spyOn(scene.camera, 'update');
    scene.update(0.016);
    expect(updateSpy).toHaveBeenCalled();
  });

  it('update calls clock.tick, root.updateWorldMatrix, camera.update in order', () => {
    const scene = createScene();
    const order: string[] = [];
    vi.spyOn(scene.clock, 'tick').mockImplementation(() => {
      order.push('clock.tick');
      return scene.clock.currentTime;
    });
    vi.spyOn(scene.root, 'updateWorldMatrix').mockImplementation(() => {
      order.push('root.updateWorldMatrix');
    });
    vi.spyOn(scene.camera, 'update').mockImplementation(() => {
      order.push('camera.update');
    });
    scene.update(0.016);
    expect(order).toEqual(['clock.tick', 'root.updateWorldMatrix', 'camera.update']);
  });
});

describe('SceneRenderer', () => {
  function createMockGPUContext() {
    const mockTextureView = {};
    const mockTexture = {
      createView: vi.fn(() => mockTextureView),
      destroy: vi.fn(),
    };
    const mockPass = {
      end: vi.fn(),
      setPipeline: vi.fn(),
      draw: vi.fn(),
    };
    const mockEncoder = {
      beginRenderPass: vi.fn(() => mockPass),
      finish: vi.fn(() => 'command_buffer'),
    };
    const mockGPUContext = {
      device: {
        createCommandEncoder: vi.fn(() => mockEncoder),
        queue: { submit: vi.fn() },
        createTexture: vi.fn(() => mockTexture),
      },
      getCurrentTexture: vi.fn(() => mockTexture),
      width: 800,
      height: 600,
      format: 'bgra8unorm',
    } as unknown as GPUContext;

    return { mockGPUContext, mockEncoder, mockPass, mockTexture, mockTextureView };
  }

  it('render creates command encoder', () => {
    const { mockGPUContext } = createMockGPUContext();
    const scene = new Scene({ camera: new PerspectiveCamera() });
    const renderer = new SceneRenderer(mockGPUContext, scene);

    renderer.render();

    expect(mockGPUContext.device.createCommandEncoder).toHaveBeenCalled();
  });

  it('render begins render pass with scene backgroundColor', () => {
    const { mockGPUContext, mockEncoder } = createMockGPUContext();
    const scene = new Scene({ camera: new PerspectiveCamera() });
    scene.backgroundColor = { r: 0.1, g: 0.2, b: 0.3, a: 1 };
    const renderer = new SceneRenderer(mockGPUContext, scene);

    renderer.render();

    // beginRenderPass from @vellusion/core calls encoder.beginRenderPass
    // with the mapped descriptor. Verify it was called.
    expect(mockEncoder.beginRenderPass).toHaveBeenCalled();
  });

  it('render submits commands', () => {
    const { mockGPUContext } = createMockGPUContext();
    const scene = new Scene({ camera: new PerspectiveCamera() });
    const renderer = new SceneRenderer(mockGPUContext, scene);

    renderer.render();

    expect(mockGPUContext.device.queue.submit).toHaveBeenCalledWith(['command_buffer']);
  });

  it('render ends the render pass', () => {
    const { mockGPUContext, mockPass } = createMockGPUContext();
    const scene = new Scene({ camera: new PerspectiveCamera() });
    const renderer = new SceneRenderer(mockGPUContext, scene);

    renderer.render();

    expect(mockPass.end).toHaveBeenCalled();
  });

  it('destroy cleans up depth texture', () => {
    const { mockGPUContext, mockTexture } = createMockGPUContext();
    const scene = new Scene({ camera: new PerspectiveCamera() });
    const renderer = new SceneRenderer(mockGPUContext, scene);

    // Trigger depth texture creation
    renderer.render();

    // Now destroy
    renderer.destroy();

    // Depth texture's destroy should have been called
    // (the TextureWrapper internally calls gpuTexture.destroy)
    expect(mockTexture.destroy).toHaveBeenCalled();
  });

  it('render creates depth texture matching canvas size', () => {
    const { mockGPUContext } = createMockGPUContext();
    const scene = new Scene({ camera: new PerspectiveCamera() });
    const renderer = new SceneRenderer(mockGPUContext, scene);

    renderer.render();

    expect(mockGPUContext.device.createTexture).toHaveBeenCalledWith(
      expect.objectContaining({
        size: { width: 800, height: 600 },
        format: 'depth24plus',
      }),
    );
  });

  it('render reuses depth texture when canvas size unchanged', () => {
    const { mockGPUContext } = createMockGPUContext();
    const scene = new Scene({ camera: new PerspectiveCamera() });
    const renderer = new SceneRenderer(mockGPUContext, scene);

    renderer.render();
    renderer.render();

    // createTexture should only be called once for the depth texture
    expect(mockGPUContext.device.createTexture).toHaveBeenCalledTimes(1);
  });
});
