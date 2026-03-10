/**
 * Options for creating a GPUContext.
 */
export interface GPUContextOptions {
  canvas: HTMLCanvasElement | OffscreenCanvas;
  powerPreference?: GPUPowerPreference;
  requiredFeatures?: GPUFeatureName[];
  requiredLimits?: Record<string, number>;
}

/**
 * Manages the WebGPU device, canvas context, and surface configuration.
 *
 * Use the static `create` factory method to instantiate, since WebGPU
 * initialization is asynchronous.
 */
export class GPUContext {
  readonly device: GPUDevice;
  readonly context: GPUCanvasContext;
  readonly format: GPUTextureFormat;
  readonly canvas: HTMLCanvasElement | OffscreenCanvas;
  private _pixelRatio: number;

  private constructor(
    device: GPUDevice,
    context: GPUCanvasContext,
    format: GPUTextureFormat,
    canvas: HTMLCanvasElement | OffscreenCanvas,
  ) {
    this.device = device;
    this.context = context;
    this.format = format;
    this.canvas = canvas;
    this._pixelRatio = typeof devicePixelRatio !== 'undefined' ? devicePixelRatio : 1;
  }

  /**
   * Create a new GPUContext by requesting an adapter, device, and configuring
   * the canvas context.
   *
   * Throws if WebGPU is not supported or no suitable adapter is found.
   */
  static async create(options: GPUContextOptions): Promise<GPUContext> {
    if (!navigator.gpu) {
      throw new Error('WebGPU is not supported in this environment.');
    }

    const adapter = await navigator.gpu.requestAdapter({
      powerPreference: options.powerPreference,
    });

    if (!adapter) {
      throw new Error('Failed to obtain a GPUAdapter.');
    }

    const device = await adapter.requestDevice({
      requiredFeatures: options.requiredFeatures,
      requiredLimits: options.requiredLimits,
    });

    const context = options.canvas.getContext('webgpu') as GPUCanvasContext;
    if (!context) {
      throw new Error('Failed to obtain a WebGPU canvas context.');
    }

    const format = navigator.gpu.getPreferredCanvasFormat();

    context.configure({
      device,
      format,
      alphaMode: 'premultiplied',
    });

    return new GPUContext(device, context, format, options.canvas);
  }

  /**
   * Returns the current GPUTexture for the canvas swap chain.
   */
  getCurrentTexture(): GPUTexture {
    return this.context.getCurrentTexture();
  }

  /** Canvas width in physical pixels. */
  get width(): number {
    return this.canvas.width;
  }

  /** Canvas height in physical pixels. */
  get height(): number {
    return this.canvas.height;
  }

  /** Device pixel ratio used for high-DPI rendering. */
  get pixelRatio(): number {
    return this._pixelRatio;
  }

  /**
   * Resize the canvas to the given CSS dimensions, scaled by the pixel ratio.
   */
  resize(width: number, height: number): void {
    this.canvas.width = width * this._pixelRatio;
    this.canvas.height = height * this._pixelRatio;
  }

  /**
   * Destroy the GPU device and release resources.
   */
  destroy(): void {
    this.device.destroy();
  }
}
