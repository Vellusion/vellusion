import { describe, it, expect, vi } from 'vitest';
import { RenderPipelineBuilder, PipelineCache } from '../src/Pipeline';

// ---------------------------------------------------------------------------
// Mock helpers
// ---------------------------------------------------------------------------

function createMockShaderModule(label?: string) {
  return { label: label ?? 'mock-shader' } as unknown as GPUShaderModule;
}

function createMockPipelineLayout() {
  return { label: 'mock-pipeline-layout' } as unknown as GPUPipelineLayout;
}

function createMockRenderPipeline(label?: string) {
  return { label: label ?? 'mock-render-pipeline' } as unknown as GPURenderPipeline;
}

function createMockComputePipeline(label?: string) {
  return { label: label ?? 'mock-compute-pipeline' } as unknown as GPUComputePipeline;
}

function createMockBindGroupLayout(id: string) {
  return { id } as unknown as GPUBindGroupLayout;
}

function createMockDevice() {
  const mockPipelineLayout = createMockPipelineLayout();
  return {
    createRenderPipeline: vi.fn().mockReturnValue(createMockRenderPipeline()),
    createComputePipeline: vi.fn().mockReturnValue(createMockComputePipeline()),
    createPipelineLayout: vi.fn().mockReturnValue(mockPipelineLayout),
  } as unknown as GPUDevice;
}

// ---------------------------------------------------------------------------
// RenderPipelineBuilder
// ---------------------------------------------------------------------------

describe('RenderPipelineBuilder', () => {
  // -------------------------------------------------------------------------
  // Fluent API
  // -------------------------------------------------------------------------

  it('should return `this` from every setter', () => {
    const builder = new RenderPipelineBuilder();
    const vsModule = createMockShaderModule();
    const fsModule = createMockShaderModule();

    expect(builder.setVertexShader(vsModule)).toBe(builder);
    expect(builder.setFragmentShader(fsModule)).toBe(builder);
    expect(builder.setVertexBufferLayouts([])).toBe(builder);
    expect(builder.setColorTargets([])).toBe(builder);
    expect(builder.setDepthStencil({ format: 'depth24plus', depthWriteEnabled: true, depthCompare: 'less' })).toBe(builder);
    expect(builder.setPrimitiveTopology('line-list')).toBe(builder);
    expect(builder.setMultisample(4)).toBe(builder);
    expect(builder.setBindGroupLayouts([])).toBe(builder);
    expect(builder.setLabel('test')).toBe(builder);
  });

  // -------------------------------------------------------------------------
  // build() with default values
  // -------------------------------------------------------------------------

  it('should apply default values (topology, entryPoints, multisample)', () => {
    const device = createMockDevice();
    const vsModule = createMockShaderModule('vs');
    const fsModule = createMockShaderModule('fs');

    new RenderPipelineBuilder()
      .setVertexShader(vsModule)
      .setFragmentShader(fsModule)
      .build(device);

    expect(device.createRenderPipeline).toHaveBeenCalledWith(
      expect.objectContaining({
        layout: 'auto',
        vertex: expect.objectContaining({
          module: vsModule,
          entryPoint: 'vs_main',
          buffers: [],
        }),
        fragment: expect.objectContaining({
          module: fsModule,
          entryPoint: 'fs_main',
          targets: [],
        }),
        primitive: { topology: 'triangle-list' },
        multisample: { count: 1 },
      }),
    );
  });

  // -------------------------------------------------------------------------
  // build() with custom values
  // -------------------------------------------------------------------------

  it('should use custom entry points when provided', () => {
    const device = createMockDevice();
    const vsModule = createMockShaderModule();
    const fsModule = createMockShaderModule();

    new RenderPipelineBuilder()
      .setVertexShader(vsModule, 'vertex_entry')
      .setFragmentShader(fsModule, 'fragment_entry')
      .build(device);

    const call = (device.createRenderPipeline as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(call.vertex.entryPoint).toBe('vertex_entry');
    expect(call.fragment.entryPoint).toBe('fragment_entry');
  });

  it('should set vertex buffer layouts', () => {
    const device = createMockDevice();
    const vsModule = createMockShaderModule();
    const layouts: GPUVertexBufferLayout[] = [
      {
        arrayStride: 12,
        attributes: [{ shaderLocation: 0, offset: 0, format: 'float32x3' }],
      },
    ];

    new RenderPipelineBuilder()
      .setVertexShader(vsModule)
      .setVertexBufferLayouts(layouts)
      .build(device);

    const call = (device.createRenderPipeline as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(call.vertex.buffers).toBe(layouts);
  });

  it('should set color targets', () => {
    const device = createMockDevice();
    const vsModule = createMockShaderModule();
    const fsModule = createMockShaderModule();
    const targets: GPUColorTargetState[] = [{ format: 'bgra8unorm' }];

    new RenderPipelineBuilder()
      .setVertexShader(vsModule)
      .setFragmentShader(fsModule)
      .setColorTargets(targets)
      .build(device);

    const call = (device.createRenderPipeline as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(call.fragment.targets).toBe(targets);
  });

  it('should set depth/stencil state', () => {
    const device = createMockDevice();
    const vsModule = createMockShaderModule();
    const depthStencil: GPUDepthStencilState = {
      format: 'depth24plus',
      depthWriteEnabled: true,
      depthCompare: 'less',
    };

    new RenderPipelineBuilder()
      .setVertexShader(vsModule)
      .setDepthStencil(depthStencil)
      .build(device);

    const call = (device.createRenderPipeline as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(call.depthStencil).toBe(depthStencil);
  });

  it('should not include depthStencil when not set', () => {
    const device = createMockDevice();
    const vsModule = createMockShaderModule();

    new RenderPipelineBuilder()
      .setVertexShader(vsModule)
      .build(device);

    const call = (device.createRenderPipeline as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(call.depthStencil).toBeUndefined();
  });

  it('should set primitive topology', () => {
    const device = createMockDevice();
    const vsModule = createMockShaderModule();

    new RenderPipelineBuilder()
      .setVertexShader(vsModule)
      .setPrimitiveTopology('line-list')
      .build(device);

    const call = (device.createRenderPipeline as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(call.primitive.topology).toBe('line-list');
  });

  it('should set multisample count', () => {
    const device = createMockDevice();
    const vsModule = createMockShaderModule();

    new RenderPipelineBuilder()
      .setVertexShader(vsModule)
      .setMultisample(4)
      .build(device);

    const call = (device.createRenderPipeline as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(call.multisample.count).toBe(4);
  });

  it('should set label on the pipeline', () => {
    const device = createMockDevice();
    const vsModule = createMockShaderModule();

    new RenderPipelineBuilder()
      .setVertexShader(vsModule)
      .setLabel('my-pipeline')
      .build(device);

    const call = (device.createRenderPipeline as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(call.label).toBe('my-pipeline');
  });

  // -------------------------------------------------------------------------
  // Layout handling
  // -------------------------------------------------------------------------

  it('should use layout "auto" when no bind group layouts are set', () => {
    const device = createMockDevice();
    const vsModule = createMockShaderModule();

    new RenderPipelineBuilder()
      .setVertexShader(vsModule)
      .build(device);

    const call = (device.createRenderPipeline as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(call.layout).toBe('auto');
    expect(device.createPipelineLayout).not.toHaveBeenCalled();
  });

  it('should create a pipeline layout when bind group layouts are provided', () => {
    const device = createMockDevice();
    const vsModule = createMockShaderModule();
    const bgl1 = createMockBindGroupLayout('bgl1');
    const bgl2 = createMockBindGroupLayout('bgl2');

    new RenderPipelineBuilder()
      .setVertexShader(vsModule)
      .setBindGroupLayouts([bgl1, bgl2])
      .build(device);

    expect(device.createPipelineLayout).toHaveBeenCalledWith({
      bindGroupLayouts: [bgl1, bgl2],
    });

    const call = (device.createRenderPipeline as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(call.layout).toEqual(createMockPipelineLayout());
  });

  // -------------------------------------------------------------------------
  // Fragment-less pipeline (vertex-only)
  // -------------------------------------------------------------------------

  it('should not include fragment stage when no fragment shader is set', () => {
    const device = createMockDevice();
    const vsModule = createMockShaderModule();

    new RenderPipelineBuilder()
      .setVertexShader(vsModule)
      .build(device);

    const call = (device.createRenderPipeline as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(call.fragment).toBeUndefined();
  });

  // -------------------------------------------------------------------------
  // Error handling
  // -------------------------------------------------------------------------

  it('should throw when vertex shader module is not set', () => {
    const device = createMockDevice();

    expect(() => {
      new RenderPipelineBuilder().build(device);
    }).toThrow('vertex shader module is required');
  });

  // -------------------------------------------------------------------------
  // build() returns the pipeline created by device
  // -------------------------------------------------------------------------

  it('should return the pipeline from device.createRenderPipeline', () => {
    const device = createMockDevice();
    const vsModule = createMockShaderModule();

    const result = new RenderPipelineBuilder()
      .setVertexShader(vsModule)
      .build(device);

    expect(result).toEqual(createMockRenderPipeline());
  });
});

// ---------------------------------------------------------------------------
// PipelineCache
// ---------------------------------------------------------------------------

describe('PipelineCache', () => {
  // -------------------------------------------------------------------------
  // Render pipeline caching
  // -------------------------------------------------------------------------

  it('should create a render pipeline on first call', () => {
    const device = createMockDevice();
    const cache = new PipelineCache(device);
    const descriptor = { layout: 'auto', vertex: { module: {} } } as unknown as GPURenderPipelineDescriptor;

    const pipeline = cache.getRenderPipeline(descriptor);

    expect(device.createRenderPipeline).toHaveBeenCalledTimes(1);
    expect(device.createRenderPipeline).toHaveBeenCalledWith(descriptor);
    expect(pipeline).toEqual(createMockRenderPipeline());
  });

  it('should return cached render pipeline for same descriptor', () => {
    const device = createMockDevice();
    const cache = new PipelineCache(device);
    const descriptor = { layout: 'auto', vertex: { module: {} } } as unknown as GPURenderPipelineDescriptor;

    const first = cache.getRenderPipeline(descriptor);
    const second = cache.getRenderPipeline(descriptor);

    expect(device.createRenderPipeline).toHaveBeenCalledTimes(1);
    expect(first).toBe(second);
  });

  it('should create new render pipeline for different descriptor', () => {
    const device = createMockDevice();
    let callCount = 0;
    (device.createRenderPipeline as ReturnType<typeof vi.fn>).mockImplementation(() => {
      callCount++;
      return createMockRenderPipeline(`pipeline-${callCount}`);
    });

    const cache = new PipelineCache(device);
    const desc1 = { layout: 'auto', vertex: { module: 'a' } } as unknown as GPURenderPipelineDescriptor;
    const desc2 = { layout: 'auto', vertex: { module: 'b' } } as unknown as GPURenderPipelineDescriptor;

    const first = cache.getRenderPipeline(desc1);
    const second = cache.getRenderPipeline(desc2);

    expect(device.createRenderPipeline).toHaveBeenCalledTimes(2);
    expect(first).not.toBe(second);
  });

  // -------------------------------------------------------------------------
  // Compute pipeline caching
  // -------------------------------------------------------------------------

  it('should create a compute pipeline on first call', () => {
    const device = createMockDevice();
    const cache = new PipelineCache(device);
    const descriptor = {
      layout: 'auto',
      compute: { module: {}, entryPoint: 'main' },
    } as unknown as GPUComputePipelineDescriptor;

    const pipeline = cache.getComputePipeline(descriptor);

    expect(device.createComputePipeline).toHaveBeenCalledTimes(1);
    expect(device.createComputePipeline).toHaveBeenCalledWith(descriptor);
    expect(pipeline).toEqual(createMockComputePipeline());
  });

  it('should return cached compute pipeline for same descriptor', () => {
    const device = createMockDevice();
    const cache = new PipelineCache(device);
    const descriptor = {
      layout: 'auto',
      compute: { module: {}, entryPoint: 'main' },
    } as unknown as GPUComputePipelineDescriptor;

    const first = cache.getComputePipeline(descriptor);
    const second = cache.getComputePipeline(descriptor);

    expect(device.createComputePipeline).toHaveBeenCalledTimes(1);
    expect(first).toBe(second);
  });

  it('should create new compute pipeline for different descriptor', () => {
    const device = createMockDevice();
    let callCount = 0;
    (device.createComputePipeline as ReturnType<typeof vi.fn>).mockImplementation(() => {
      callCount++;
      return createMockComputePipeline(`pipeline-${callCount}`);
    });

    const cache = new PipelineCache(device);
    const desc1 = {
      layout: 'auto',
      compute: { module: 'a', entryPoint: 'main' },
    } as unknown as GPUComputePipelineDescriptor;
    const desc2 = {
      layout: 'auto',
      compute: { module: 'b', entryPoint: 'main' },
    } as unknown as GPUComputePipelineDescriptor;

    const first = cache.getComputePipeline(desc1);
    const second = cache.getComputePipeline(desc2);

    expect(device.createComputePipeline).toHaveBeenCalledTimes(2);
    expect(first).not.toBe(second);
  });

  // -------------------------------------------------------------------------
  // clear()
  // -------------------------------------------------------------------------

  it('should clear all cached pipelines', () => {
    const device = createMockDevice();
    const cache = new PipelineCache(device);

    const renderDesc = { layout: 'auto', vertex: { module: {} } } as unknown as GPURenderPipelineDescriptor;
    const computeDesc = {
      layout: 'auto',
      compute: { module: {}, entryPoint: 'main' },
    } as unknown as GPUComputePipelineDescriptor;

    cache.getRenderPipeline(renderDesc);
    cache.getComputePipeline(computeDesc);

    expect(device.createRenderPipeline).toHaveBeenCalledTimes(1);
    expect(device.createComputePipeline).toHaveBeenCalledTimes(1);

    cache.clear();

    // After clear, re-requesting should create new pipelines.
    cache.getRenderPipeline(renderDesc);
    cache.getComputePipeline(computeDesc);

    expect(device.createRenderPipeline).toHaveBeenCalledTimes(2);
    expect(device.createComputePipeline).toHaveBeenCalledTimes(2);
  });
});
