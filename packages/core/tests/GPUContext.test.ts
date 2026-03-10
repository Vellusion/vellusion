import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GPUContext, GPUContextOptions } from '../src/GPUContext';

// ---------------------------------------------------------------------------
// Mock objects
// ---------------------------------------------------------------------------

function createMockDevice() {
  return {
    destroy: vi.fn(),
    queue: { writeBuffer: vi.fn(), submit: vi.fn() },
    createShaderModule: vi.fn(),
    createRenderPipeline: vi.fn(),
    createComputePipeline: vi.fn(),
    createBuffer: vi.fn(),
    createTexture: vi.fn(),
    createSampler: vi.fn(),
    createBindGroup: vi.fn(),
    createBindGroupLayout: vi.fn(),
    createPipelineLayout: vi.fn(),
    createCommandEncoder: vi.fn(),
  } as unknown as GPUDevice;
}

function createMockCanvasContext() {
  return {
    configure: vi.fn(),
    getCurrentTexture: vi.fn().mockReturnValue({ width: 800, height: 600 }),
    unconfigure: vi.fn(),
  } as unknown as GPUCanvasContext;
}

function createMockAdapter(device: GPUDevice) {
  return {
    requestDevice: vi.fn().mockResolvedValue(device),
    features: new Set(),
    limits: {},
    info: {},
    isFallbackAdapter: false,
  } as unknown as GPUAdapter;
}

function createMockCanvas(ctx: GPUCanvasContext) {
  return {
    width: 800,
    height: 600,
    getContext: vi.fn().mockReturnValue(ctx),
  } as unknown as HTMLCanvasElement;
}

function installNavigatorGpu(adapter: GPUAdapter | null) {
  Object.defineProperty(globalThis, 'navigator', {
    value: {
      gpu: {
        requestAdapter: vi.fn().mockResolvedValue(adapter),
        getPreferredCanvasFormat: vi.fn().mockReturnValue('bgra8unorm'),
      },
    },
    writable: true,
    configurable: true,
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('GPUContext', () => {
  let mockDevice: GPUDevice;
  let mockCanvasContext: GPUCanvasContext;
  let mockAdapter: GPUAdapter;
  let mockCanvas: HTMLCanvasElement;
  let savedNavigator: typeof globalThis.navigator;

  beforeEach(() => {
    savedNavigator = globalThis.navigator;
    mockDevice = createMockDevice();
    mockCanvasContext = createMockCanvasContext();
    mockAdapter = createMockAdapter(mockDevice);
    mockCanvas = createMockCanvas(mockCanvasContext);
    installNavigatorGpu(mockAdapter);
  });

  afterEach(() => {
    Object.defineProperty(globalThis, 'navigator', {
      value: savedNavigator,
      writable: true,
      configurable: true,
    });
  });

  // -----------------------------------------------------------------------
  // create()
  // -----------------------------------------------------------------------

  it('should call navigator.gpu.requestAdapter', async () => {
    await GPUContext.create({ canvas: mockCanvas });
    expect(navigator.gpu.requestAdapter).toHaveBeenCalled();
  });

  it('should forward powerPreference to requestAdapter', async () => {
    await GPUContext.create({ canvas: mockCanvas, powerPreference: 'high-performance' });
    expect(navigator.gpu.requestAdapter).toHaveBeenCalledWith(
      expect.objectContaining({ powerPreference: 'high-performance' }),
    );
  });

  it('should call adapter.requestDevice with requiredFeatures and requiredLimits', async () => {
    const options: GPUContextOptions = {
      canvas: mockCanvas,
      requiredFeatures: ['texture-compression-bc' as GPUFeatureName],
      requiredLimits: { maxTextureDimension2D: 4096 },
    };
    await GPUContext.create(options);
    expect(mockAdapter.requestDevice).toHaveBeenCalledWith(
      expect.objectContaining({
        requiredFeatures: options.requiredFeatures,
        requiredLimits: options.requiredLimits,
      }),
    );
  });

  it('should configure canvas context with correct format', async () => {
    const ctx = await GPUContext.create({ canvas: mockCanvas });
    expect(mockCanvasContext.configure).toHaveBeenCalledWith(
      expect.objectContaining({
        device: mockDevice,
        format: 'bgra8unorm',
        alphaMode: 'premultiplied',
      }),
    );
    expect(ctx.format).toBe('bgra8unorm');
  });

  it('should expose device, context, format, and canvas', async () => {
    const ctx = await GPUContext.create({ canvas: mockCanvas });
    expect(ctx.device).toBe(mockDevice);
    expect(ctx.context).toBe(mockCanvasContext);
    expect(ctx.canvas).toBe(mockCanvas);
    expect(ctx.format).toBe('bgra8unorm');
  });

  // -----------------------------------------------------------------------
  // Error paths
  // -----------------------------------------------------------------------

  it('should throw if WebGPU is not supported', async () => {
    Object.defineProperty(globalThis, 'navigator', {
      value: {},
      writable: true,
      configurable: true,
    });

    await expect(GPUContext.create({ canvas: mockCanvas })).rejects.toThrow(
      'WebGPU is not supported',
    );
  });

  it('should throw if no adapter is found', async () => {
    installNavigatorGpu(null);

    await expect(GPUContext.create({ canvas: mockCanvas })).rejects.toThrow(
      'Failed to obtain a GPUAdapter',
    );
  });

  it('should throw if canvas context cannot be obtained', async () => {
    const badCanvas = {
      width: 800,
      height: 600,
      getContext: vi.fn().mockReturnValue(null),
    } as unknown as HTMLCanvasElement;

    await expect(GPUContext.create({ canvas: badCanvas })).rejects.toThrow(
      'Failed to obtain a WebGPU canvas context',
    );
  });

  // -----------------------------------------------------------------------
  // Getters
  // -----------------------------------------------------------------------

  it('width and height should return canvas dimensions', async () => {
    const ctx = await GPUContext.create({ canvas: mockCanvas });
    expect(ctx.width).toBe(800);
    expect(ctx.height).toBe(600);
  });

  it('pixelRatio should return a number', async () => {
    const ctx = await GPUContext.create({ canvas: mockCanvas });
    expect(typeof ctx.pixelRatio).toBe('number');
  });

  // -----------------------------------------------------------------------
  // getCurrentTexture
  // -----------------------------------------------------------------------

  it('getCurrentTexture should delegate to canvas context', async () => {
    const ctx = await GPUContext.create({ canvas: mockCanvas });
    const tex = ctx.getCurrentTexture();
    expect(mockCanvasContext.getCurrentTexture).toHaveBeenCalled();
    expect(tex).toEqual({ width: 800, height: 600 });
  });

  // -----------------------------------------------------------------------
  // resize
  // -----------------------------------------------------------------------

  it('resize should update canvas width and height', async () => {
    const ctx = await GPUContext.create({ canvas: mockCanvas });
    ctx.resize(1024, 768);
    // resize scales by pixelRatio; in test env devicePixelRatio may be 1
    expect(ctx.width).toBe(1024 * ctx.pixelRatio);
    expect(ctx.height).toBe(768 * ctx.pixelRatio);
  });

  // -----------------------------------------------------------------------
  // destroy
  // -----------------------------------------------------------------------

  it('destroy should call device.destroy()', async () => {
    const ctx = await GPUContext.create({ canvas: mockCanvas });
    ctx.destroy();
    expect(mockDevice.destroy).toHaveBeenCalled();
  });
});
