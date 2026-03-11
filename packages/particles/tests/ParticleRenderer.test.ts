import { describe, it, expect, vi, beforeAll } from 'vitest';
import { ParticleRenderer } from '../src/ParticleRenderer';
import { ParticleSystem } from '../src/ParticleSystem';
import type { GPUContext } from '@vellusion/core';
import type { Emitter } from '../src/ParticleSystem';

// GPUBufferUsage is a WebGPU global not available in Node
beforeAll(() => {
  (globalThis as Record<string, unknown>).GPUBufferUsage = {
    VERTEX: 0x0020,
    COPY_DST: 0x0008,
    UNIFORM: 0x0040,
  };
});

const simpleEmitter: Emitter = {
  emit: () => ({
    position: new Float32Array([0, 0, 0]),
    velocity: new Float32Array([0, 1, 0]),
  }),
};

function createMockGPUContext() {
  const mockBindGroup = {};
  const mockPipeline = {
    getBindGroupLayout: vi.fn(() => ({})),
  };
  const mockBuffer = {
    destroy: vi.fn(),
  };
  const mockGPUContext = {
    device: {
      createBuffer: vi.fn(() => mockBuffer),
      createBindGroup: vi.fn(() => mockBindGroup),
      createShaderModule: vi.fn(() => ({})),
      createRenderPipeline: vi.fn(() => mockPipeline),
      queue: {
        writeBuffer: vi.fn(),
      },
    },
    format: 'bgra8unorm',
  } as unknown as GPUContext;

  return { mockGPUContext, mockPipeline, mockBuffer, mockBindGroup };
}

function createSystem(options?: Partial<{ show: boolean; maximumParticles: number }>): ParticleSystem {
  return new ParticleSystem({
    emitter: simpleEmitter,
    emissionRate: 10,
    maximumParticles: options?.maximumParticles ?? 100,
    minimumParticleLife: 5,
    maximumParticleLife: 5,
    minimumSpeed: 1,
    maximumSpeed: 1,
    show: options?.show ?? true,
  });
}

describe('ParticleRenderer', () => {
  it('addSystem increases count', () => {
    const { mockGPUContext } = createMockGPUContext();
    const renderer = new ParticleRenderer(mockGPUContext);
    const system = createSystem();

    expect(renderer.systemCount).toBe(0);
    renderer.addSystem(system);
    expect(renderer.systemCount).toBe(1);
  });

  it('removeSystem decreases count', () => {
    const { mockGPUContext } = createMockGPUContext();
    const renderer = new ParticleRenderer(mockGPUContext);
    const system = createSystem();

    renderer.addSystem(system);
    expect(renderer.systemCount).toBe(1);
    renderer.removeSystem(system);
    expect(renderer.systemCount).toBe(0);
  });

  it('render does nothing without pipeline', () => {
    const { mockGPUContext } = createMockGPUContext();
    const renderer = new ParticleRenderer(mockGPUContext);
    const system = createSystem();
    renderer.addSystem(system);

    const mockPassEncoder = {
      setPipeline: vi.fn(),
      setBindGroup: vi.fn(),
      setVertexBuffer: vi.fn(),
      draw: vi.fn(),
    } as unknown as GPURenderPassEncoder;

    const vp = new Float32Array(16);
    const camPos = new Float32Array([0, 0, 5]);

    // Should not throw and should not call any pass encoder methods
    renderer.render(mockPassEncoder, vp, camPos);
    expect(mockPassEncoder.setPipeline).not.toHaveBeenCalled();
    expect(mockPassEncoder.draw).not.toHaveBeenCalled();
  });

  it('render skips hidden systems', () => {
    const { mockGPUContext } = createMockGPUContext();
    const renderer = new ParticleRenderer(mockGPUContext);
    const system = createSystem({ show: false });
    renderer.addSystem(system);

    // Init pipeline so the render path is active
    renderer.initPipeline('// dummy shader');

    // Force some active particles by updating with show=true temporarily
    system.show = true;
    renderer.update(1.0);
    system.show = false;

    const mockPassEncoder = {
      setPipeline: vi.fn(),
      setBindGroup: vi.fn(),
      setVertexBuffer: vi.fn(),
      draw: vi.fn(),
    } as unknown as GPURenderPassEncoder;

    const vp = new Float32Array(16);
    const camPos = new Float32Array([0, 0, 5]);

    renderer.render(mockPassEncoder, vp, camPos);
    expect(mockPassEncoder.draw).not.toHaveBeenCalled();
  });

  it('render skips systems with 0 active particles', () => {
    const { mockGPUContext } = createMockGPUContext();
    const renderer = new ParticleRenderer(mockGPUContext);
    const system = createSystem();
    renderer.addSystem(system);

    // Init pipeline but don't update, so activeCount is 0
    renderer.initPipeline('// dummy shader');

    const mockPassEncoder = {
      setPipeline: vi.fn(),
      setBindGroup: vi.fn(),
      setVertexBuffer: vi.fn(),
      draw: vi.fn(),
    } as unknown as GPURenderPassEncoder;

    const vp = new Float32Array(16);
    const camPos = new Float32Array([0, 0, 5]);

    renderer.render(mockPassEncoder, vp, camPos);
    expect(mockPassEncoder.draw).not.toHaveBeenCalled();
  });

  it('destroy clears everything', () => {
    const { mockGPUContext } = createMockGPUContext();
    const renderer = new ParticleRenderer(mockGPUContext);
    const system1 = createSystem();
    const system2 = createSystem();
    renderer.addSystem(system1);
    renderer.addSystem(system2);

    renderer.destroy();

    expect(renderer.systemCount).toBe(0);
  });

  it('systemCount is correct', () => {
    const { mockGPUContext } = createMockGPUContext();
    const renderer = new ParticleRenderer(mockGPUContext);

    expect(renderer.systemCount).toBe(0);

    const s1 = createSystem();
    const s2 = createSystem();
    const s3 = createSystem();

    renderer.addSystem(s1);
    expect(renderer.systemCount).toBe(1);

    renderer.addSystem(s2);
    renderer.addSystem(s3);
    expect(renderer.systemCount).toBe(3);

    renderer.removeSystem(s2);
    expect(renderer.systemCount).toBe(2);
  });

  it('update calls system.update', () => {
    const { mockGPUContext } = createMockGPUContext();
    const renderer = new ParticleRenderer(mockGPUContext);
    const system = createSystem();
    const updateSpy = vi.spyOn(system, 'update');

    renderer.addSystem(system);
    renderer.update(0.016);

    expect(updateSpy).toHaveBeenCalledWith(0.016);
  });
});
